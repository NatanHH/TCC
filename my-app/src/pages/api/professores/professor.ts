import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

// Função utilitária para validar dados
function validateProfessor(data: any) {
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
    // Listar todos os professores
    const professores = await prisma.professor.findMany();
    return res.status(200).json(professores);
  }

  if (req.method === "POST") {
    // Criar novo professor
    if (!validateProfessor(req.body)) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }
    try {
      const novoProfessor = await prisma.professor.create({
        data: {
          nome: req.body.nome,
          email: req.body.email,
          senha: req.body.senha,
        },
      });
      return res.status(201).json(novoProfessor);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === "PUT") {
    // Atualizar dados do professor
    const { idProfessor, nome, email, senha } = req.body;
    if (!idProfessor) {
      return res.status(400).json({ error: "idProfessor obrigatório." });
    }
    try {
      const professorAtualizado = await prisma.professor.update({
        where: { idProfessor: Number(idProfessor) },
        data: { nome, email, senha },
      });
      return res.status(200).json(professorAtualizado);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    // Apagar professor pelo idProfessor
    const { idProfessor } = req.body;
    if (!idProfessor) {
      return res.status(400).json({ error: "idProfessor obrigatório." });
    }
    try {
      await prisma.professor.delete({
        where: { idProfessor: Number(idProfessor) },
      });
      return res.status(204).end();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Método não permitido
  return res.status(405).json({ error: "Método não permitido" });
}
