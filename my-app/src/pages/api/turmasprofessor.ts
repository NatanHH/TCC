import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });

  const { professorId } = req.query;
  if (!professorId)
    return res.status(400).json({ error: "professorId obrigatório" });

  try {
    const turmas = await prisma.turma.findMany({
      where: { professorId: Number(professorId) },
      include: {
        alunos: { include: { aluno: true } },
      },
    });
    return res.status(200).json(turmas);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
}
