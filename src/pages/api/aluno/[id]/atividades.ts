import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

/**
 * GET /api/aluno/:id/getAtividades
 * Retorna apenas as atividades que foram aplicadas nas turmas em que o aluno está matriculado.
 *
 * Response:
 * {
 *   atividades: [
 *     {
 *       idAtividade,
 *       titulo,
 *       descricao,
 *       tipo,
 *       nota,
 *       arquivos: [...],
 *       aplicacoes: [{ idAtividadeTurma, idTurma, dataAplicacao }, ...]
 *     },
 *     ...
 *   ]
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });

  const { id } = req.query;
  const alunoId = Number(id);
  if (Number.isNaN(alunoId))
    return res.status(400).json({ error: "ID inválido" });

  try {
    // 1) Recupera as turmas em que o aluno está matriculado
    const turmasAluno = await prisma.turmaAluno.findMany({
      where: { idAluno: alunoId },
      select: { idTurma: true },
    });
    const turmaIds = turmasAluno.map((t) => t.idTurma);
    if (turmaIds.length === 0) {
      return res.status(200).json({ atividades: [] });
    }

    // 2) Busca aplicações (AtividadeTurma) para essas turmas, incluindo a atividade e seus arquivos
    const aplicacoes = await prisma.atividadeTurma.findMany({
      where: { idTurma: { in: turmaIds } },
      include: {
        atividade: {
          include: {
            arquivos: true,
            alternativas: true, // agora incluindo alternativas também
          },
        },
        turma: true,
      },
      orderBy: { dataAplicacao: "desc" },
    });

    // 3) Agrupa por atividade (para evitar duplicatas quando a mesma atividade foi aplicada em várias turmas)
    const map = new Map<number, any>();
    for (const ap of aplicacoes) {
      const atividade = ap.atividade;
      if (!atividade) continue;
      const key = atividade.idAtividade;
      const aplicacaoInfo = {
        idAtividadeTurma: ap.idAtividadeTurma,
        idTurma: ap.idTurma,
        dataAplicacao: ap.dataAplicacao,
        turmaNome: ap.turma?.nome ?? null,
      };

      if (!map.has(key)) {
        map.set(key, {
          idAtividade: atividade.idAtividade,
          titulo: atividade.titulo,
          descricao: atividade.descricao,
          tipo: atividade.tipo,
          nota: atividade.nota,
          arquivos: atividade.arquivos || [],
          aplicacoes: [aplicacaoInfo],
        });
      } else {
        map.get(key).aplicacoes.push(aplicacaoInfo);
      }
    }

    const atividades = Array.from(map.values());
    return res.status(200).json({ atividades });
  } catch (err: any) {
    console.error("Erro ao buscar atividades do aluno:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}
