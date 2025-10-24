import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Buscar turmas do professor
  if (req.method === "GET") {
    const { professorId } = req.query;

    if (!professorId) {
      return res.status(400).json({ error: "professorId é obrigatório" });
    }

    try {
      const turmas = await prisma.turma.findMany({
        where: {
          professorId: Number(professorId),
        },
        include: {
          alunos: {
            include: {
              aluno: {
                select: {
                  idAluno: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: { alunos: true },
          },
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(turmas);
    } catch (error: any) {
      console.error("Erro ao buscar turmas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // POST: Criar turma
  if (req.method === "POST") {
    const { nomeTurma, professorId, alunos } = req.body;
    if (
      !nomeTurma ||
      !professorId ||
      !Array.isArray(alunos) ||
      alunos.length === 0
    ) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }
    try {
      // Cria a turma
      const turma = await prisma.turma.create({
        data: {
          nome: nomeTurma,
          professorId: Number(professorId),
        },
      });

      // Para cada aluno, cria ou conecta e adiciona na turma
      for (const aluno of alunos) {
        // Cria aluno
        const novoAluno = await prisma.aluno.create({
          data: {
            nome: aluno.nome,
            email: aluno.email,
            senha: aluno.senha,
          },
        });
        // Relaciona aluno à turma
        await prisma.turmaAluno.create({
          data: {
            idTurma: turma.idTurma,
            idAluno: novoAluno.idAluno,
          },
        });
      }
      // Retorna turma criada
      const turmaCompleta = await prisma.turma.findUnique({
        where: { idTurma: turma.idTurma },
        include: {
          alunos: { include: { aluno: true } },
        },
      });
      return res.status(201).json(turmaCompleta);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  // DELETE: Excluir turma
  if (req.method === "DELETE") {
    const { turmaId } = req.body;

    if (!turmaId) {
      return res.status(400).json({ error: "turmaId é obrigatório" });
    }

    try {
      // Verificar se a turma existe e se pertence a algum professor
      const turmaExistente = await prisma.turma.findUnique({
        where: { idTurma: Number(turmaId) },
        include: {
          alunos: true,
          atividades: true,
        },
      });

      if (!turmaExistente) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      // Remover relacionamentos primeiro
      // 1. Remover alunos da turma
      await prisma.turmaAluno.deleteMany({
        where: { idTurma: Number(turmaId) },
      });

      // 2. Remover atividades aplicadas à turma
      await prisma.atividade.deleteMany({
        where: { turmas: { some: { idTurma: Number(turmaId) } } },
      });

      // 3. Finalmente, excluir a turma
      await prisma.turma.delete({
        where: { idTurma: Number(turmaId) },
      });

      return res.status(200).json({
        message: "Turma excluída com sucesso",
        turmaExcluida: turmaExistente.nome,
      });
    } catch (error: any) {
      console.error("Erro ao excluir turma:", error);
      return res.status(500).json({
        error: "Erro interno ao excluir turma",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
