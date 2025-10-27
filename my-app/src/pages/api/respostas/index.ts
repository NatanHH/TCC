import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

/**
 * GET /api/respostas?atividadeId=... [&turmaId=...]
 *
 * - atividadeId (required)
 * - turmaId (optional): se informado, retorna apenas respostas de alunos que pertencem àquela turma
 *
 * Retorna lista de RespostaAlunoAtividade com include do Aluno (idAluno, nome, email).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { atividadeId, turmaId } = req.query;

    if (!atividadeId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: atividadeId" });
    }
    const idAtividade = Number(atividadeId);
    if (Number.isNaN(idAtividade)) {
      return res.status(400).json({ error: "atividadeId must be a number" });
    }

    if (turmaId) {
      const idTurma = Number(turmaId);
      if (Number.isNaN(idTurma)) {
        return res.status(400).json({ error: "turmaId must be a number" });
      }

      const respostas = await prisma.respostaAlunoAtividade.findMany({
        where: {
          idAtividade: idAtividade,
          aluno: {
            turmas: {
              some: {
                idTurma: idTurma,
              },
            },
          },
        },
        include: {
          aluno: {
            select: { idAluno: true, nome: true, email: true },
          },
        },
        orderBy: { dataAplicacao: "desc" },
      });

      return res.status(200).json(respostas);
    }

    // sem filtro de turma: retorna todas as respostas para a atividade
    const respostas = await prisma.respostaAlunoAtividade.findMany({
      where: { idAtividade: idAtividade },
      include: {
        aluno: {
          select: { idAluno: true, nome: true, email: true },
        },
      },
      orderBy: { dataAplicacao: "desc" },
    });

    return res.status(200).json(respostas);
  } catch (err: any) {
    console.error("GET /api/respostas error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: String(err?.message ?? err),
    });
  }
}
