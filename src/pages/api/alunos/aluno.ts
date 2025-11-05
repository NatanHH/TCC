import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // exemplo: listar alunos
    const alunos = await prisma.aluno.findMany();
    return res.status(200).json(alunos);
  }

  if (req.method === "POST") {
    const payload: unknown = req.body;
    if (typeof payload !== "object" || payload === null)
      return res.status(400).json({ error: "Invalid body" });
    const body = payload as { nome?: string; email?: string };
    // ...criar aluno com body.nome/body.email...
    return res.status(201).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
