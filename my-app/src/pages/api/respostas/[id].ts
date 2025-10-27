import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

/**
 * PATCH /api/respostas/[id]
 * Body:
 *  { notaObtida?: number, feedback?: string }
 *
 * Atualiza a resposta do aluno (nota + feedback).
 * Retorna o registro atualizado (incluindo aluno).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing resposta id in path" });
  }
  const idResposta = Number(id);
  if (Number.isNaN(idResposta)) {
    return res.status(400).json({ error: "Invalid resposta id" });
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notaObtida, feedback } = req.body ?? {};

    // Basic validation: at least one of the fields must be provided
    if (
      notaObtida === undefined &&
      (feedback === undefined || feedback === null)
    ) {
      return res
        .status(400)
        .json({ error: "Provide 'notaObtida' and/or 'feedback' in the body" });
    }

    // Optional: validate notaObtida range (0-10)
    if (notaObtida !== undefined && typeof notaObtida === "number") {
      if (notaObtida < 0 || notaObtida > 10) {
        return res
          .status(400)
          .json({ error: "notaObtida must be between 0 and 10" });
      }
    }

    const dataToUpdate: any = {};
    if (notaObtida !== undefined) dataToUpdate.notaObtida = notaObtida;
    if (feedback !== undefined) dataToUpdate.feedback = feedback;

    const updated = await prisma.respostaAlunoAtividade.update({
      where: { idResposta: idResposta },
      data: dataToUpdate,
      include: {
        aluno: { select: { idAluno: true, nome: true, email: true } },
      },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error("PATCH /api/respostas/[id] error:", err);
    // If prisma couldn't find the record:
    if (String(err?.message ?? "").includes("Record to update not found")) {
      return res.status(404).json({ error: "Resposta não encontrada" });
    }
    return res.status(500).json({
      error: "Internal server error",
      detail: String(err?.message ?? err),
    });
  }
}
