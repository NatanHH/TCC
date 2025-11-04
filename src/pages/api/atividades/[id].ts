import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);
  if (Number.isNaN(id) || !id)
    return res.status(400).json({ error: "id inválido" });

  // GET /api/atividades/:id
  if (req.method === "GET") {
    try {
      const atividade = await prisma.atividade.findUnique({
        where: { idAtividade: id },
        include: { arquivos: true, alternativas: true },
      });
      if (!atividade) return res.status(404).json({ error: "Não encontrado" });
      return res.status(200).json(atividade);
    } catch (err: any) {
      console.error("GET /api/atividades/[id] error:", err);
      return res.status(500).json({ error: err?.message ?? "Erro interno" });
    }
  }

  // PUT/PATCH /api/atividades/:id  <- corrige o 405 quando frontend fizer PUT
  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const { titulo, descricao, tipo, nota, script, linguagem } =
        req.body ?? {};
      const data: any = {};
      if (titulo !== undefined) data.titulo = titulo;
      if (descricao !== undefined) data.descricao = descricao;
      if (tipo !== undefined) data.tipo = tipo;
      if (nota !== undefined) data.nota = nota;
      if (script !== undefined) data.script = script;
      if (linguagem !== undefined) data.linguagem = linguagem;

      const updated = await prisma.atividade.update({
        where: { idAtividade: id },
        data,
      });
      return res.status(200).json(updated);
    } catch (err: any) {
      console.error("PUT /api/atividades/[id] error:", err);
      return res
        .status(500)
        .json({ error: err?.message ?? "Erro ao atualizar atividade" });
    }
  }

  // DELETE /api/atividades/:id
  if (req.method === "DELETE") {
    try {
      // tenta remover dependências antes de deletar (ignora erros caso tabelas não existam)
      await prisma.respostaAlunoAtividade
        ?.deleteMany?.({ where: { idAtividade: id } })
        .catch(() => {});
      await prisma.atividadeTurma
        ?.deleteMany?.({ where: { idAtividade: id } })
        .catch(() => {});
      await prisma.atividadeArquivo
        ?.deleteMany?.({
          where: { atividadeId: id },
        })
        .catch(() => {});
      await prisma.alternativa
        ?.deleteMany?.({ where: { idAtividade: id } })
        .catch(() => {});

      // por fim delete a atividade
      await prisma.atividade.delete({ where: { idAtividade: id } });

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("DELETE /api/atividades/[id] error:", err);
      return res
        .status(500)
        .json({ error: err?.message ?? "Erro interno ao deletar atividade" });
    }
  }

  res.setHeader("Allow", "GET, PUT, PATCH, DELETE");
  return res.status(405).end("Method Not Allowed");
}
