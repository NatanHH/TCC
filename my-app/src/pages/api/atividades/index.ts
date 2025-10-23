import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const atividades = await prisma.atividade.findMany({
        include: {
          alternativas: true,
          arquivos: true,
        },
        orderBy: { idAtividade: "desc" },
      });
      return res.status(200).json(atividades);
    }

    if (req.method === "POST") {
      const { titulo, descricao, tipo, nota, script, linguagem, alternativas } =
        req.body;
      if (!titulo || !tipo)
        return res
          .status(400)
          .json({ error: "titulo e tipo são obrigatórios" });

      const data: any = {
        titulo,
        descricao: descricao || null,
        tipo,
        script: script ?? null,
        linguagem: linguagem ?? null,
      };
      if (nota !== undefined && nota !== null) data.nota = Number(nota);

      if (Array.isArray(alternativas) && alternativas.length > 0) {
        data.alternativas = {
          create: alternativas.map((a: any, i: number) => ({
            texto: a.texto ?? String(a),
            correta: !!a.correta,
          })),
        };
      }

      const created = await prisma.atividade.create({ data });
      return res.status(201).json(created);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err: any) {
    console.error("atividades/index error:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}
