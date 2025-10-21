import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });

  const { id } = req.query;
  const atividadeId = Number(id);
  if (Number.isNaN(atividadeId))
    return res.status(400).json({ error: "ID inválido" });

  console.log(`[API] GET /api/atividades/${atividadeId}/attachments called`);

  try {
    const anexos = await prisma.atividadeArquivo.findMany({
      where: { atividadeId },
      select: {
        idArquivo: true,
        url: true,
        tipoArquivo: true,
      },
    });
    // Retorna a array diretamente (compatível com consumidores que esperam lista)
    return res.status(200).json(anexos);
  } catch (e: any) {
    console.error("[API] /api/atividades/[id]/attachments error:", e);
    return res.status(500).json({ error: e.message ?? String(e) });
  }
}
