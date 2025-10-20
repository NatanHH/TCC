import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import prisma from "../../../../lib/prisma";

const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_ROOT))
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

function ascCliPath() {
  // local node_modules/.bin/asc
  return path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "asc.cmd" : "asc"
  );
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

  const { scriptSource, compile } = req.body ?? {};
  if (!scriptSource && !compile)
    return res.status(400).json({ error: "Nenhum script fornecido" });

  try {
    // 1) Atualiza o scriptSource no banco (se fornecido)
    if (typeof scriptSource === "string") {
      await prisma.atividade.update({
        where: { idAtividade },
        data: { script: scriptSource, linguagem: "assemblyscript" },
      });
    }

    if (!compile)
      return res
        .status(200)
        .json({ success: true, message: "Script salvo (compile=false)" });

    // 2) Verifica se asc existe
    const ascPath = ascCliPath();
    if (!fs.existsSync(ascPath)) {
      return res.status(500).json({
        error:
          "AssemblyScript compiler (asc) não encontrado. Rode npm i --save-dev assemblyscript",
      });
    }

    // 3) grava arquivo temporário .ts
    const tmpTsName = `atividade-${idAtividade}-${Date.now()}.ts`;
    const tmpTsPath = path.join(UPLOADS_ROOT, tmpTsName);
    fs.writeFileSync(tmpTsPath, scriptSource, "utf8");

    // 4) define saída .wasm
    const outWasmName = `atividade-${idAtividade}-${Date.now()}.wasm`;
    const outWasmPath = path.join(UPLOADS_ROOT, outWasmName);

    // montagem de args recomendadas (runtime minimal/none para maior controle)
    const args = [
      tmpTsPath,
      "--binaryFile",
      outWasmPath,
      "--optimize",
      "--runtime",
      "none",
    ];

    execFile(
      ascPath,
      args,
      { timeout: 60_000 },
      async (err, stdout, stderr) => {
        // cleanup tmp ts
        try {
          fs.unlinkSync(tmpTsPath);
        } catch (e) {}

        if (err) {
          console.error("AssemblyScript compile error:", stderr || err);
          return res.status(500).json({
            error: "Erro ao compilar AssemblyScript",
            details: stderr || String(err),
          });
        }

        // Persistir wasmUrl no DB (path relativo)
        const wasmUrl = path
          .join("/uploads", path.basename(outWasmPath))
          .replace(/\\/g, "/");
        await prisma.atividade
          .update({
            where: { idAtividade },
            data: {
              /* usando campo wasmUrl - ver migration abaixo */ wasmUrl,
            } as any,
          })
          .catch((e) => console.error("Erro atualizando DB com wasmUrl:", e));

        return res.status(200).json({ success: true, wasmUrl });
      }
    );
  } catch (e: any) {
    console.error("Erro no endpoint /script:", e);
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
