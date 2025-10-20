import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query;
  const idArquivo = Number(id);
  if (Number.isNaN(idArquivo))
    return res.status(400).json({ error: "ID inválido" });

  try {
    const arquivo = await prisma.atividadeArquivo.findUnique({
      where: { idArquivo },
      select: { idArquivo: true, url: true, tipoArquivo: true },
    });
    if (!arquivo)
      return res.status(404).json({ error: "Arquivo não encontrado" });

    // espera que arquivo.url seja algo como "/uploads/xxxxx.ext"
    const rel = arquivo.url.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", rel);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "Arquivo no disco não encontrado" });

    const stat = fs.statSync(filePath);
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Type",
      arquivo.tipoArquivo || "application/octet-stream"
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
