import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

/**
 * API para gerenciar uma atividade específica por ID
 * Rota: /api/atividade/[id] onde [id] é o ID da atividade
 * Suporta operações CRUD completas: GET, PUT/PATCH, DELETE
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Extrai o ID da atividade da URL e converte para número
  const { id } = req.query;
  const atividadeId = Number(id);

  // Valida se o ID é um número válido
  if (Number.isNaN(atividadeId))
    return res.status(400).json({ error: "ID inválido" });

  try {
    // GET: Busca uma atividade específica por ID
    if (req.method === "GET") {
      const atividade = await prisma.atividade.findUnique({
        where: { idAtividade: atividadeId },
        // Inclui dados relacionados: arquivos, alternativas e turmas vinculadas
        include: { arquivos: true, alternativas: true, turmas: true },
      });

      if (!atividade)
        return res.status(404).json({ error: "Atividade não encontrada" });
      return res.status(200).json(atividade);
    }

    // PUT/PATCH: Atualiza uma atividade existente
    if (req.method === "PUT" || req.method === "PATCH") {
      const { titulo, descricao, tipo, nota, linguagem, script, alternativas } =
        req.body;

      // Monta objeto com apenas os campos que foram enviados para atualização
      const updateData: any = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (nota !== undefined) updateData.nota = nota;
      if (linguagem !== undefined) updateData.linguagem = linguagem;
      if (script !== undefined) updateData.script = script;

      // Se alternativas foram enviadas, substitui completamente as existentes
      if (alternativas !== undefined) {
        // Remove todas as alternativas existentes desta atividade
        await prisma.alternativa.deleteMany({
          where: { idAtividade: atividadeId },
        });
        // Cria as novas alternativas
        updateData.alternativas = {
          create: alternativas.map((a: any) => ({
            texto: a.texto,
            correta: !!a.correta, // Converte para boolean
          })),
        };
      }

      // Executa a atualização no banco
      const atividade = await prisma.atividade.update({
        where: { idAtividade: atividadeId },
        data: updateData,
        include: { alternativas: true, arquivos: true },
      });

      return res.status(200).json(atividade);
    }

    // DELETE: Remove uma atividade e todos os dados relacionados
    if (req.method === "DELETE") {
      // Remove alternativas relacionadas (por segurança, mesmo que haja cascade)
      await prisma.alternativa.deleteMany({
        where: { idAtividade: atividadeId },
      });
      // Remove arquivos relacionados
      await prisma.atividadeArquivo.deleteMany({ where: { atividadeId } });
      // Remove a atividade principal
      await prisma.atividade.delete({ where: { idAtividade: atividadeId } });

      return res.status(204).end(); // 204 = No Content (sucesso sem retorno)
    }

    // Método HTTP não suportado
    return res.status(405).json({ error: "Método não permitido" });
  } catch (e: any) {
    console.error("Erro GET /api/atividade/[id]:", e);
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
