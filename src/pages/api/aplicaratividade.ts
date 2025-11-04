import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { idAtividade, idTurma } = req.body;

  // Validação dos parâmetros
  if (!idAtividade || !idTurma) {
    return res.status(400).json({
      error: "idAtividade e idTurma são obrigatórios",
    });
  }

  try {
    // Converter para números
    const atividadeId = Number(idAtividade);
    const turmaId = Number(idTurma);

    // Verificar se atividade existe
    const atividade = await prisma.atividade.findUnique({
      where: { idAtividade: atividadeId },
    });

    if (!atividade) {
      return res.status(404).json({ error: "Atividade não encontrada" });
    }

    // Verificar se turma existe
    const turma = await prisma.turma.findUnique({
      where: { idTurma: turmaId },
    });

    if (!turma) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Verificar se já foi aplicada nesta turma (usando o modelo correto)
    const jaAplicada = await prisma.atividadeTurma.findFirst({
      where: {
        idTurma: turmaId,
        idAtividade: atividadeId,
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
        idTurma: turmaId,
        idAtividade: atividadeId,
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
