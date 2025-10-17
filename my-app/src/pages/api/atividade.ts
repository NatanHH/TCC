import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { titulo, descricao, tipo, nota, script, linguagem } = req.body;
    try {
      const atividade = await prisma.atividade.create({
        data: {
          titulo,
          descricao,
          tipo,
          nota: Number(nota),
          script: tipo === "PLUGGED" ? script : null,
          linguagem: tipo === "PLUGGED" ? linguagem : null,
        },
      });
      return res.status(201).json(atividade);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  } else if (req.method === "GET") {
    
    try {
      const atividades = await prisma.atividade.findMany({
        include: {
          arquivos: true,
        },
      });
      return res.status(200).json(atividades);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
  return res.status(405).json({ error: "Método não permitido" });
}
