import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const atividades = await prisma.atividade.findMany({
        include: { arquivos: true, alternativas: true, turmas: true },
        orderBy: { idAtividade: "desc" },
      });
      return res.status(200).json({ atividades });
    }

    if (req.method === "POST") {
      const {
        titulo,
        descricao,
        tipo,
        nota,
        professorId,
        linguagem,
        script,
        alternativas,
      } = req.body;

      if (!titulo || !tipo)
        return res.status(400).json({ error: "Campos obrigatórios faltando" });

      const data: any = {
        titulo,
        descricao,
        tipo,
        nota: nota ?? 1.0,
        professorId: professorId ?? null,
        linguagem: linguagem ?? null,
        script: script ?? null,
      };

      const atividade = await prisma.atividade.create({
        data: {
          ...data,
          alternativas: alternativas
            ? {
                create: alternativas.map((a: any) => ({
                  texto: a.texto,
                  correta: !!a.correta,
                })),
              }
            : undefined,
        },
        include: { alternativas: true },
      });

      return res.status(201).json(atividade);
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (e: any) {
    console.error("Erro /api/atividade:", e);
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
