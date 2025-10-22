import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import prisma from "../../../../lib/prisma";

/**
 * Handler para compilar AssemblyScript e salvar .wasm em public/uploads.
 * Estratégia:
 * - salva o source temporariamente em os.tmpdir()
 * - compila com asc (tenta node_modules/.bin/asc primeiro)
 * - em caso de problema de spawn no Windows, faz fallback para `npx asc ...`
 * - copia o .wasm gerado do tmp para public/uploads (cria a pasta se necessário)
 * - retorna { success: true, wasmUrl } em caso de sucesso
 * - em caso de erro retorna { error: "...", stdout, stderr, details }
 *
 * Observações:
 * - em produção prefira compilar em CI/worker isolado e só gravar o .wasm pronto no storage (S3/public/uploads).
 * - ajuste o import do prisma se sua estrutura for diferente (ver script fix-prisma-imports fornecido abaixo).
 */

const PUBLIC_UPLOADS = process.env.UPLOADS_ROOT
  ? path.resolve(process.cwd(), process.env.UPLOADS_ROOT)
  : path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(PUBLIC_UPLOADS)) {
  try {
    fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });
  } catch (e) {
    console.error("Erro criando public/uploads:", e);
  }
}

function ascCliPath(): string {
  // preferir asc bin; em Windows geralmente node_modules/.bin/asc.cmd
  const bin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "asc.cmd" : "asc"
  );
  return bin;
}

// wrapper que tenta executar asc bin e faz fallback p/ npx asc em Windows quando houver EINVAL/spawn erros
function runAscWithFallback(
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const ascPath = ascCliPath();

    // tentativa 1: executar asc bin diretamente
    execFile(
      ascPath,
      args,
      { timeout: 60_000, windowsHide: true },
      (err, stdout, stderr) => {
        if (!err) {
          return resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        }

        // se erro de spawn (EINVAL) ou ascPath não existir -> tentar `npx asc ...` como fallback
        const isSpawnErr =
          (err && (err as any).code === "EINVAL") ||
          (err && (err as any).code === "ENOENT") ||
          /spawn .* EINVAL/.test(String(err)) ||
          /ENOENT/.test(String(err));

        if (!isSpawnErr) {
          // outro erro: retornar stderr/err
          return reject({
            error: "execfile_failed",
            details: String(err),
            stdout: stdout ?? "",
            stderr: stderr ?? "",
          });
        }

        // fallback: npx asc ...
        execFile(
          "npx",
          ["asc", ...args],
          { timeout: 120_000, windowsHide: true },
          (err2, stdout2, stderr2) => {
            if (err2) {
              return reject({
                error: "npx_fallback_failed",
                details: String(err2),
                stdout: stdout2 ?? "",
                stderr: stderr2 ?? "",
              });
            }
            return resolve({ stdout: stdout2 ?? "", stderr: stderr2 ?? "" });
          }
        );
      }
    );
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const idAtividade = Number(id);
  if (Number.isNaN(idAtividade))
    return res.status(400).json({ error: "id inválido" });

  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  const { scriptSource, compile, alternativas, correctIndex } = req.body ?? {};
  if (!scriptSource && !compile)
    return res.status(400).json({ error: "Nenhum script enviado" });

  // use tmp dir for source + initial wasm, then copy to public/uploads
  const tmpDir = fs.existsSync(os.tmpdir()) ? os.tmpdir() : process.cwd();
  const tmpTsName = `atividade-${idAtividade}-${Date.now()}.ts`;
  const tmpOutName = `atividade-${idAtividade}-${Date.now()}.wasm`;
  const tmpTsPath = path.join(tmpDir, tmpTsName);
  const tmpWasmPath = path.join(tmpDir, `out-${tmpOutName}`); // compile into tmp out

  try {
    // persistir script no DB (opcional)
    if (typeof scriptSource === "string") {
      await prisma.atividade.update({
        where: { idAtividade },
        data: { script: scriptSource, linguagem: "assemblyscript" },
      });
    }

    if (!compile) {
      return res
        .status(200)
        .json({ success: true, message: "Script salvo (sem compilação)" });
    }

    // prepare injected header (escape strings)
    const altTexts = Array.isArray(alternativas)
      ? alternativas.map((a: any) => String(a.texto ?? ""))
      : [];
    const corrIndex = Number.isInteger(Number(correctIndex))
      ? Number(correctIndex)
      : -1;
    const escapeAS = (s: string) =>
      s
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");

    const injectedHeader = `
/* Auto-injected by server */
export const ALTERNATIVAS: string[] = [${altTexts
      .map((t) => `"${escapeAS(t)}"`)
      .join(",")}];
export const CORRECT_INDEX: i32 = ${corrIndex};
`;

    // write tmp ts
    fs.writeFileSync(
      tmpTsPath,
      injectedHeader + "\n\n" + (scriptSource ?? ""),
      "utf8"
    );

    // args para asc
    // usar caminhos absolutos para evitar problemas com cwd
    const args = [
      tmpTsPath,
      "--binaryFile",
      tmpWasmPath,
      "--optimize",
      "--runtime",
      "none",
    ];

    // run compiler (with fallback)
    let runResult;
    try {
      runResult = await runAscWithFallback(args);
    } catch (compileErr: any) {
      // cleanup tmp files (se existirem)
      try {
        if (fs.existsSync(tmpTsPath)) fs.unlinkSync(tmpTsPath);
      } catch {}
      try {
        if (fs.existsSync(tmpWasmPath)) fs.unlinkSync(tmpWasmPath);
      } catch {}
      console.error("Erro endpoint script: ", compileErr);
      // retornar stdout/stderr completos se existir
      return res.status(500).json({
        error: "Erro ao compilar AssemblyScript",
        details: compileErr.details || compileErr,
        stdout: compileErr.stdout ?? runResult?.stdout ?? "",
        stderr: compileErr.stderr ?? runResult?.stderr ?? "",
      });
    }

    // runResult ok; verify wasm exists
    if (!fs.existsSync(tmpWasmPath)) {
      // cleanup tmpTs
      try {
        if (fs.existsSync(tmpTsPath)) fs.unlinkSync(tmpTsPath);
      } catch {}
      return res.status(500).json({
        error: "compile_no_output",
        stdout: runResult?.stdout ?? "",
        stderr: runResult?.stderr ?? "asc did not create output file",
      });
    }

    // create final name in public/uploads (use posix basename for url)
    const finalWasmName = `atividade-${idAtividade}-${Date.now()}.wasm`;
    const finalWasmPath = path.join(PUBLIC_UPLOADS, finalWasmName);

    // copy tmpWasmPath -> finalWasmPath
    fs.copyFileSync(tmpWasmPath, finalWasmPath);

    // clean tmp artifacts
    try {
      if (fs.existsSync(tmpTsPath)) fs.unlinkSync(tmpTsPath);
    } catch (e) {
      console.warn("cleanup tmpTs failed:", e);
    }
    try {
      if (fs.existsSync(tmpWasmPath)) fs.unlinkSync(tmpWasmPath);
    } catch (e) {
      /* ignore */
    }

    // persistir wasmUrl no DB
    const wasmUrl = `/uploads/${path.posix.basename(finalWasmPath)}`; // use posix for url
    try {
      await prisma.atividade.update({
        where: { idAtividade },
        data: { wasmUrl },
      });
    } catch (e) {
      console.error("Erro ao salvar wasmUrl no DB:", e);
      // não falhar inteiro; retornar sucesso com warning
      return res.status(200).json({
        success: true,
        wasmUrl,
        warning:
          "Não foi possível gravar wasmUrl no DB. Veja logs do servidor.",
      });
    }

    return res.status(200).json({
      success: true,
      wasmUrl,
      stdout: runResult.stdout ?? "",
      stderr: runResult.stderr ?? "",
    });
  } catch (e: any) {
    console.error("Erro endpoint script:", e);
    try {
      if (fs.existsSync(tmpTsPath)) fs.unlinkSync(tmpTsPath);
    } catch {}
    try {
      if (fs.existsSync(tmpWasmPath)) fs.unlinkSync(tmpWasmPath);
    } catch {}
    return res
      .status(500)
      .json({ error: e?.message || "Erro interno", details: e });
  }
}
