import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

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
    if (!atividadeId)
      return res.status(400).json({ error: "Missing atividadeId" });
    const atividadeIdNum = Number(atividadeId);
    if (Number.isNaN(atividadeIdNum))
      return res.status(400).json({ error: "Invalid atividadeId" });

    const turmaIdNum = turmaId ? Number(turmaId) : undefined;
    if (turmaId && Number.isNaN(turmaIdNum))
      return res.status(400).json({ error: "Invalid turmaId" });

    // candidates de where que tentamos (ordem: mais provável primeiro)
    const attempts: any[] = [];

    // 1) filtro escalar direto (se existir idAtividade)
    attempts.push({ idAtividade: atividadeIdNum });

    // 2) filtro por relação aluno.idTurma (caso aluno tenha campo idTurma)
    if (turmaIdNum !== undefined) {
      attempts.push({
        idAtividade: atividadeIdNum,
        aluno: { idTurma: turmaIdNum },
      });
      // 3) filtro por relação aluno.turma.idTurma (caso haja relação turma)
      attempts.push({
        idAtividade: atividadeIdNum,
        aluno: { turma: { idTurma: turmaIdNum } },
      });
      // 4) filtro por resposta.idTurma (caso exista campo diferente)
      attempts.push({ idAtividade: atividadeIdNum, turmaId: turmaIdNum });
      attempts.push({
        idAtividade: atividadeIdNum,
        turma: { idTurma: turmaIdNum },
      });
    }

    let respostas: any[] | null = null;
    let lastError: any = null;

    for (const where of attempts) {
      try {
        respostas = await prisma.respostaAlunoAtividade.findMany({
          where,
          include: {
            aluno: { select: { idAluno: true, nome: true, email: true } },
          },
          orderBy: { idResposta: "desc" },
        });
        // se encontrou sem erro do prisma, encerra
        break;
      } catch (err: any) {
        lastError = err;
        // se for erro de "Unknown argument", tenta próxima variação; senão relança
        const msg = String(err?.message ?? "");
        if (
          msg.includes("Unknown argument") ||
          msg.includes("Unknown field") ||
          msg.includes("did not expect")
        ) {
          // tenta próxima tentativa
          continue;
        }
        // outro erro (conexão DB etc) — relança imediatamente
        throw err;
      }
    }

    if (!respostas) {
      // nenhuma tentativa funcionou — tenta fallback com filtro apenas por atividade (sem incluir turma)
      try {
        respostas = await prisma.respostaAlunoAtividade.findMany({
          where: { idAtividade: atividadeIdNum },
          include: {
            aluno: { select: { idAluno: true, nome: true, email: true } },
          },
          orderBy: { idResposta: "desc" },
        });
        console.warn(
          "Fallback: returned respostas filtered only by atividadeId (turma filter unsupported)."
        );
      } catch (err: any) {
        console.error("GET /api/respostas final fallback error:", err);
        return res
          .status(500)
          .json({
            error: "Internal server error",
            detail: String(err?.message ?? err),
          });
      }
    }

    return res.status(200).json({ respostas });
  } catch (err: any) {
    console.error("GET /api/respostas error:", err);
    return res
      .status(500)
      .json({
        error: "Internal server error",
        detail: String(err?.message ?? err),
      });
  }
}
