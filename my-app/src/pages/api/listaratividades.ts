import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const alunoId = Number(req.query.alunoId ?? req.query.idAluno);
  if (!alunoId || Number.isNaN(alunoId)) {
    return res
      .status(400)
      .json({ error: "alunoId (query) é obrigatório e numérico" });
  }

  try {
    // 1) buscar turmas do aluno
    const turmaRels = await prisma.turmaAluno.findMany({
      where: { idAluno: alunoId },
      select: { idTurma: true },
    });

    if (!turmaRels || turmaRels.length === 0) {
      return res.status(200).json({
        atividades: [],
        message: "Você não está matriculado em nenhuma turma.",
      });
    }

    const turmasIds = turmaRels.map((t) => t.idTurma);

    // 2) buscar aplicações (AtividadeTurma) nas turmas do aluno
    const aplicacoes = await prisma.atividadeTurma.findMany({
      where: { idTurma: { in: turmasIds } },
      include: {
        atividade: {
          include: {
            arquivos: true, // se no schema o nome for diferente ajuste aqui
          },
        },
        turma: true,
      },
      orderBy: { dataAplicacao: "desc" },
    });

    // 3) mapear formato de resposta
    if (!aplicacoes || aplicacoes.length === 0) {
      return res.status(200).json({
        atividades: [],
        message:
          "O professor ainda não aplicou nenhuma atividade para sua turma.",
      });
    }

    const atividades = aplicacoes.map((a) => {
      const atividade = a.atividade || {};
      const turma = a.turma || {};
      return {
        idAtividade: atividade.idAtividade ?? null,
        titulo: atividade.titulo ?? "",
        descricao: atividade.descricao ?? null,
        tipo: atividade.tipo ?? null,
        nota: atividade.nota ?? null,
        dataAplicacao: a.dataAplicacao ?? null,
        turma: {
          idTurma: turma.idTurma ?? null,
          nome: turma.nome ?? null,
        },
        arquivos: (atividade.arquivos ?? []).map((f: any) => ({
          idArquivo: f.idArquivo ?? null,
          url: f.url ?? f.path ?? null,
          tipoArquivo: f.tipoArquivo ?? f.mimetype ?? null,
          nomeArquivo: f.nomeArquivo ?? f.originalName ?? null,
        })),
        idAtividadeTurma: a.idAtividadeTurma ?? null,
      };
    });

    return res.status(200).json({ atividades });
  } catch (error: any) {
    console.error("Erro /api/atividades:", error);
    return res
      .status(500)
      .json({ error: "Erro interno", details: String(error) });
  }
}
