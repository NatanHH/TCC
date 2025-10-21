import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const atividadeId = Number(id);
  if (Number.isNaN(atividadeId))
    return res.status(400).json({ error: "ID inválido" });

  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });

  try {
    const atividade = await prisma.atividade.findUnique({
      where: { idAtividade: atividadeId },
      include: { arquivos: true, alternativas: true, turmas: true },
    });
    if (!atividade)
      return res.status(404).json({ error: "Atividade não encontrada" });
    return res.status(200).json(atividade);
  } catch (e: any) {
    console.error("Erro GET /api/atividade/[id]:", e);
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
