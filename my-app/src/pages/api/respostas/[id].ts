import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ error: "Missing resposta id in path" });
  const idResposta = Number(id);
  if (Number.isNaN(idResposta))
    return res.status(400).json({ error: "Invalid resposta id" });

  if (req.method === "GET") {
    try {
      const found = await prisma.respostaAlunoAtividade.findUnique({
        where: { idResposta },
        include: {
          aluno: { select: { idAluno: true, nome: true, email: true } },
        },
      });
      if (!found)
        return res.status(404).json({ error: "Resposta não encontrada" });
      return res.status(200).json({ resposta: found });
    } catch (err: any) {
      console.error("GET /api/respostas/[id] error:", err);
      return res.status(500).json({
        error: "Internal server error",
        detail: String(err?.message ?? err),
      });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { notaObtida, feedback } = req.body ?? {};
      const dataToUpdate: any = {};
      if (notaObtida !== undefined) dataToUpdate.notaObtida = notaObtida;
      if (feedback !== undefined) dataToUpdate.feedback = feedback;

      const updated = await prisma.respostaAlunoAtividade.update({
        where: { idResposta },
        data: dataToUpdate,
        include: {
          aluno: { select: { idAluno: true, nome: true, email: true } },
        },
      });
      return res.status(200).json({ resposta: updated });
    } catch (err: any) {
      console.error("PATCH /api/respostas/[id] error:", err);
      if (String(err?.message ?? "").includes("Record to update not found")) {
        return res.status(404).json({ error: "Resposta não encontrada" });
      }
      return res.status(500).json({
        error: "Internal server error",
        detail: String(err?.message ?? err),
      });
    }
  }

  res.setHeader("Allow", "GET,PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
