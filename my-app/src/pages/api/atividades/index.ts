import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("API /api/atividade", req.method);

  if (req.method === "GET") {
    try {
      const atividades = await prisma.atividade.findMany({
        include: { alternativas: true },
      });
      return res.status(200).json({ atividades });
    } catch (err: any) {
      console.error("GET /api/atividade error:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  if (req.method === "POST") {
    try {
      console.log("POST /api/atividade payload:", req.body);

      const {
        alternativas = [],
        correctIndex,
        titulo,
        descricao,
        tipo,
        linguagem,
        script,
      } = req.body ?? {};

      // montar payload apenas com campos permitidos
      const createData: any = {
        titulo: titulo ?? "",
        descricao: descricao ?? null,
        tipo: tipo ?? null,
        linguagem: linguagem ?? null,
      };

      // nested create de alternativas apenas com texto
      if (Array.isArray(alternativas) && alternativas.length > 0) {
        createData.alternativas = {
          create: alternativas
            .map((a: any) => ({ texto: String(a.texto ?? "") }))
            .filter((a: any) => a.texto.trim() !== ""),
        };
      }

      // opcional: script (se voce armazena)
      if (typeof script === "string" && script.trim() !== "") {
        createData.script = script;
      }

      const atividade = await prisma.atividade.create({
        data: createData,
        include: { alternativas: true },
      });

      // marca alternativa correta se veio correctIndex (e se campo correta existir)
      if (
        typeof correctIndex === "number" &&
        atividade.alternativas?.[correctIndex]
      ) {
        const altId = atividade.alternativas[correctIndex].idAlternativa;
        try {
          await prisma.alternativa.update({
            where: { idAlternativa: altId },
            data: { correta: true } as any,
          });
        } catch (e) {
          // ignora se o campo 'correta' não estiver no schema
          console.warn(
            "Não foi possível marcar 'correta' (campo pode não existir):",
            String(e)
          );
        }
      }

      return res.status(201).json({ success: true, atividade });
    } catch (err: any) {
      console.error("POST /api/atividade error:", err);
      return res.status(500).json({ error: err?.message || "Erro interno" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
