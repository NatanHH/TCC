import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { alunoId } = req.query;

  if (!alunoId) {
    return res.status(400).json({ error: "alunoId é obrigatório" });
  }

  try {
    // 1. Buscar turmas que o aluno pertence
    const turmasDoAluno = await prisma.turmaAluno.findMany({
      where: { idAluno: Number(alunoId) },
      select: { idTurma: true },
    });

    if (turmasDoAluno.length === 0) {
      return res.status(200).json([]);
    }

    const turmasIds = turmasDoAluno.map((t) => t.idTurma);

    // 2. Buscar atividades aplicadas nas turmas do aluno através de AtividadeTurma
    const atividadesAplicadas = await prisma.atividadeTurma.findMany({
      where: {
        idTurma: {
          in: turmasIds,
        },
      },
      include: {
        atividade: {
          include: {
            arquivos: true,
          },
        },
        turma: true,
      },
      orderBy: {
        dataAplicacao: "desc",
      },
    });

    // 3. Formatar igual ao professor
    const atividades = atividadesAplicadas.map((aplicacao) => ({
      idAtividade: aplicacao.atividade.idAtividade,
      titulo: aplicacao.atividade.titulo,
      descricao: aplicacao.atividade.descricao,
      tipo: aplicacao.atividade.tipo,
      nota: aplicacao.atividade.nota,
      dataAplicacao: aplicacao.dataAplicacao,
      turma: {
        idTurma: aplicacao.turma.idTurma,
        nome: aplicacao.turma.nome,
      },
      arquivos: aplicacao.atividade.arquivos,
    }));

    return res.status(200).json(atividades);
  } catch (error: any) {
    console.error("Erro ao buscar atividades do aluno:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
