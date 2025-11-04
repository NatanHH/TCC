import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

// Nota: não precisa desabilitar bodyParser (envio em JSON)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idAtividade, idAluno, respostaTexto } = req.body ?? {};

    const idA = Number(idAtividade);
    const idAl = Number(idAluno);

    if (Number.isNaN(idA) || Number.isNaN(idAl)) {
      return res.status(400).json({ error: "idAtividade ou idAluno inválido" });
    }

    const created = await prisma.respostaAlunoAtividade.create({
      data: {
        idAtividade: idA,
        idAluno: idAl,
        respostaTexto: respostaTexto || null,
        // campos de arquivo removidos
      },
    });

    return res.status(201).json({ ok: true, created });
  } catch (err: any) {
    console.error("Error POST /api/respostas/submit:", err);
    return res.status(500).json({ error: err?.message ?? "Erro interno" });
  }
}
