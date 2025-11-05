import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const payload: unknown = req.body;
  if (typeof payload !== "object" || payload === null)
    return res.status(400).json({ error: "Invalid body" });

  const body = payload as {
    atividadeId?: number;
    turmaId?: number;
    alunoId?: number;
  };
  const { atividadeId, turmaId, alunoId } = body;

  // Validação dos parâmetros
  if (atividadeId == null || turmaId == null || alunoId == null) {
    return res.status(400).json({
      error: "atividadeId, turmaId e alunoId são obrigatórios",
    });
  }

  try {
    // Converter para números
    const atividadeIdNum = Number(atividadeId);
    const turmaIdNum = Number(turmaId);
    const alunoIdNum = Number(alunoId);

    // Verificar se atividade existe
    const atividade = await prisma.atividade.findUnique({
      where: { idAtividade: atividadeIdNum },
    });

    if (!atividade) {
      return res.status(404).json({ error: "Atividade não encontrada" });
    }

    // Verificar se turma existe
    const turma = await prisma.turma.findUnique({
      where: { idTurma: turmaIdNum },
    });

    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Verificar se aluno existe
    const aluno = await prisma.aluno.findUnique({
      where: { idAluno: alunoIdNum },
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Verificar se já foi aplicada nesta turma (usando o modelo correto)
    const jaAplicada = await prisma.atividadeTurma.findFirst({
      where: {
        idTurma: turmaIdNum,
        idAtividade: atividadeIdNum,
      },
    });

    if (jaAplicada) {
      return res.status(200).json({
        success: true,
        message: "Esta atividade já foi aplicada nesta turma",
        jaExistia: true,
      });
    }

    // Aplicar atividade na turma (usando o modelo correto do seu schema)
    const aplicacao = await prisma.atividadeTurma.create({
      data: {
        idTurma: turmaIdNum,
        idAtividade: atividadeIdNum,
        dataAplicacao: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Atividade aplicada com sucesso!",
      aplicacao: {
        id: aplicacao.idAtividadeTurma,
        atividade: atividade.titulo,
        turma: turma.nome,
        dataAplicacao: aplicacao.dataAplicacao,
      },
    });
  } catch (error: any) {
    console.error("Erro ao aplicar atividade:", error);

    // Erro mais específico para problemas do Prisma
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Esta atividade já foi aplicada nesta turma (constraint única)",
      });
    }

    return res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
}
