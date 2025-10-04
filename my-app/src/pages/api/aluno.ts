import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

// Função utilitária para validar dados
function validateAluno(data: any) {
  if (!data.nome || !data.email || !data.senha) {
    return false;
  }
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Listar todos os alunos
    const alunos = await prisma.aluno.findMany();
    return res.status(200).json(alunos);
  }

  if (req.method === "POST") {
    // Criar novo aluno
    if (!validateAluno(req.body)) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }
    try {
      const novoAluno = await prisma.aluno.create({
        data: {
          nome: req.body.nome,
          email: req.body.email,
          senha: req.body.senha,
        },
      });
      return res.status(201).json(novoAluno);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === "PUT") {
    // Atualizar dados do aluno
    const { idAluno, nome, email, senha } = req.body;
    if (!idAluno) {
      return res.status(400).json({ error: "idAluno obrigatório." });
    }
    try {
      const alunoAtualizado = await prisma.aluno.update({
        where: { idAluno: Number(idAluno) },
        data: { nome, email, senha },
      });
      return res.status(200).json(alunoAtualizado);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    // Apagar aluno pelo idAluno
    const { idAluno } = req.body;
    if (!idAluno) {
      return res.status(400).json({ error: "idAluno obrigatório." });
    }
    try {
      await prisma.aluno.delete({
        where: { idAluno: Number(idAluno) },
      });
      return res.status(204).end();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Método não permitido
  return res.status(405).json({ error: "Método não permitido" });
}
