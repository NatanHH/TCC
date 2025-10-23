import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);
  if (!id || Number.isNaN(id))
    return res.status(400).json({ error: "id inválido" });

  try {
    if (req.method === "GET") {
      const atividade = await prisma.atividade.findUnique({
        where: { idAtividade: id },
        include: { alternativas: true, arquivos: true },
      });
      if (!atividade)
        return res.status(404).json({ error: "Atividade não encontrada" });
      return res.status(200).json(atividade);
    }

    if (req.method === "PUT") {
      const { titulo, descricao, tipo, nota, script, linguagem, alternativas } =
        req.body;
      const data: any = {
        titulo,
        descricao: descricao || null,
        tipo,
        script: script ?? null,
        linguagem: linguagem ?? null,
      };
      if (nota !== undefined && nota !== null) data.nota = Number(nota);

      const updated = await prisma.atividade.update({
        where: { idAtividade: id },
        data,
      });

      // Atualiza alternativas: simples - remove e recria (pode ser afinado)
      if (Array.isArray(alternativas)) {
        await prisma.alternativa.deleteMany({
          where: { atividade: { idAtividade: id } },
        });
        if (alternativas.length > 0) {
          for (const a of alternativas) {
            await prisma.alternativa.create({
              data: {
                texto: a.texto ?? String(a),
                correta: !!a.correta,
                atividade: { connect: { idAtividade: id } },
              },
            });
          }
        }
      }

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      // delete arquivos físicos e registros relacionados
      const arquivos = await prisma.atividadeArquivo.findMany({
        where: { atividadeId: id },
      });
      for (const a of arquivos) {
        try {
          const filePath = path.join(
            process.cwd(),
            "public",
            a.url.replace(/^\//, "")
          );
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Erro apagando arquivo:", e);
        }
      }

      // remove arquivo records, alternativas and the atividade
      await prisma.atividadeArquivo.deleteMany({ where: { atividadeId: id } });
      await prisma.alternativa.deleteMany({
        where: { atividade: { idAtividade: id } },
      });
      await prisma.atividade.delete({ where: { idAtividade: id } });

      return res.status(200).json({ message: "Atividade removida" });
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Método não permitido" });
  } catch (err: any) {
    console.error("atividades/[id] error:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}
