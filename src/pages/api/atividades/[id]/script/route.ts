import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import prisma from "../../../../../lib/prisma";

const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_ROOT))
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

function ascCliPath() {
  return path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "asc.cmd" : "asc"
  );
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const idAtividade = Number(params.id);
  if (Number.isNaN(idAtividade))
    return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { scriptSource, compile, alternativas, correctIndex } = body ?? {};

  if (!scriptSource && !compile)
    return NextResponse.json(
      { error: "Nenhum script enviado" },
      { status: 400 }
    );

  try {
    if (typeof scriptSource === "string") {
      await prisma.atividade.update({
        where: { idAtividade },
        data: { script: scriptSource, linguagem: "assemblyscript" },
      });
    }
    if (!compile)
      return NextResponse.json({
        success: true,
        message: "Script salvo (sem compilação)",
      });

    const ascPath = ascCliPath();
    if (!fs.existsSync(ascPath)) {
      return NextResponse.json(
        {
          error:
            "AssemblyScript compiler (asc) não encontrado. Rode npm i --save-dev assemblyscript",
        },
        { status: 500 }
      );
    }

    const altTexts = Array.isArray(alternativas)
      ? alternativas.map((a: any) => String(a.texto || ""))
      : [];
    const corrIndex = Number.isInteger(Number(correctIndex))
      ? Number(correctIndex)
      : -1;
    const escapeASString = (s: string) =>
      s
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");

    const injectedHeader = `
export const ALTERNATIVAS: string[] = [${altTexts
      .map((t) => `"${escapeASString(t)}"`)
      .join(",")}];
export const CORRECT_INDEX: i32 = ${corrIndex};
`;
    const tmpTsName = `atividade-${idAtividade}-${Date.now()}.ts`;
    const tmpTsPath = path.join(UPLOADS_ROOT, tmpTsName);
    fs.writeFileSync(
      tmpTsPath,
      injectedHeader + "\n\n" + (scriptSource || ""),
      "utf8"
    );
    const outWasmName = `atividade-${idAtividade}-${Date.now()}.wasm`;
    const outWasmPath = path.join(UPLOADS_ROOT, outWasmName);

    const args = [
      tmpTsPath,
      "--binaryFile",
      outWasmPath,
      "--optimize",
      "--runtime",
      "none",
    ];
    return await new Promise((resolve) => {
      execFile(
        ascPath,
        args,
        { timeout: 60_000 },
        async (err, stdout, stderr) => {
          try {
            fs.unlinkSync(tmpTsPath);
          } catch (e) {}
          if (err) {
            console.error("AssemblyScript compile error:", stderr || err);
            resolve(
              NextResponse.json(
                {
                  error: "Erro ao compilar AssemblyScript",
                  details: stderr || String(err),
                },
                { status: 500 }
              )
            );
            return;
          }
          const wasmUrl = path
            .join("/uploads", path.basename(outWasmPath))
            .replace(/\\/g, "/");
          await prisma.atividade
            .update({ where: { idAtividade }, data: { wasmUrl } })
            .catch(console.error);
          resolve(NextResponse.json({ success: true, wasmUrl }));
        }
      );
    });
  } catch (e: any) {
    console.error("Erro route script:", e);
    return NextResponse.json(
      { error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
