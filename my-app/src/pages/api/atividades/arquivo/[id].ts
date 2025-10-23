import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);
  if (!id || Number.isNaN(id))
    return res.status(400).json({ error: "id inválido" });

  try {
    if (req.method === "DELETE") {
      const arquivo = await prisma.atividadeArquivo.findUnique({
        where: { idArquivo: id },
      });
      if (!arquivo)
        return res.status(404).json({ error: "Arquivo não encontrado" });

      // remove arquivo físico
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          arquivo.url.replace(/^\//, "")
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Erro apagando arquivo físico:", e);
      }

      await prisma.atividadeArquivo.delete({ where: { idArquivo: id } });
      return res.status(200).json({ message: "Arquivo removido" });
    }

    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err: any) {
    console.error("arquivo/[id] error:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}
