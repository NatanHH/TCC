import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }
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
