import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma"; // ajuste o caminho se necessário

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }
  const { email, senha } = req.body;
  try {
    const adm = await prisma.administrador.findUnique({ where: { email } });
    if (!adm || adm.senha !== senha) {
      // Para produção, use bcrypt!
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }
    // Autenticado com sucesso!
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
