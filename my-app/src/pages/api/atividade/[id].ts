import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const atividadeId = Number(id);
  if (Number.isNaN(atividadeId))
    return res.status(400).json({ error: "ID inválido" });

  try {
    if (req.method === "GET") {
      const atividade = await prisma.atividade.findUnique({
        where: { idAtividade: atividadeId },
        include: { arquivos: true, alternativas: true, turmas: true },
      });
      if (!atividade)
        return res.status(404).json({ error: "Atividade não encontrada" });
      return res.status(200).json(atividade);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const { titulo, descricao, tipo, nota, linguagem, script, alternativas } =
        req.body;

      // Atualiza campos básicos
      const updateData: any = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (nota !== undefined) updateData.nota = nota;
      if (linguagem !== undefined) updateData.linguagem = linguagem;
      if (script !== undefined) updateData.script = script;

      // Se alternativas for fornecido, substitui (delete/create simples)
      if (alternativas !== undefined) {
        // Remove existentes e recria
        await prisma.alternativa.deleteMany({
          where: { idAtividade: atividadeId },
        });
        updateData.alternativas = {
          create: alternativas.map((a: any) => ({
            texto: a.texto,
            correta: !!a.correta,
          })),
        };
      }

      const atividade = await prisma.atividade.update({
        where: { idAtividade: atividadeId },
        data: updateData,
        include: { alternativas: true, arquivos: true },
      });

      return res.status(200).json(atividade);
    }

    if (req.method === "DELETE") {
      // delete related alternativas and arquivos via cascade if not set; explicit removal for safety
      await prisma.alternativa.deleteMany({
        where: { idAtividade: atividadeId },
      });
      await prisma.atividadeArquivo.deleteMany({ where: { atividadeId } });
      await prisma.atividade.delete({ where: { idAtividade: atividadeId } });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (e: any) {
    console.error("Erro GET /api/atividade/[id]:", e);
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
