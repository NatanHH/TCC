import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma"; // ajuste o caminho se necessário

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Buscar o administrador (por email, se enviado)
    const { email } = req.query;
    try {
      if (email) {
        const adm = await prisma.administrador.findUnique({
          where: { email: String(email) },
        });
        if (!adm)
          return res
            .status(404)
            .json({ error: "Administrador não encontrado." });
        return res.status(200).json(adm);
      } else {
        // Retorna o único ADM existente
        const adm = await prisma.administrador.findFirst();
        if (!adm)
          return res
            .status(404)
            .json({ error: "Administrador não encontrado." });
        return res.status(200).json(adm);
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "PUT") {
    // Atualizar dados do administrador
    const { idAdm, nome, email, senha } = req.body;
    if (!idAdm) return res.status(400).json({ error: "idAdm obrigatório." });

    try {
      const admAtualizado = await prisma.administrador.update({
        where: { idAdm: Number(idAdm) },
        data: { nome, email, senha },
      });
      return res.status(200).json(admAtualizado);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Métodos não permitidos
  return res.status(405).json({ error: "Método não permitido" });
}
