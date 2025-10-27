import type { NextApiRequest, NextApiResponse } from "next";
// ajuste se seu prisma está em src/lib/prisma.ts ou lib/prisma.ts
import prisma from "../../../../src/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);
  if (Number.isNaN(id) || !id)
    return res.status(400).json({ error: "id inválido" });

  if (req.method === "DELETE") {
    try {
      await prisma.$transaction(async (tx) => {
        // remover dependências — tente remover cada uma, ignore se não existir
        try {
          await tx.respostaAlunoAtividade.deleteMany({
            where: { idAtividade: id },
          });
        } catch {}
        try {
          await tx.atividadeTurma.deleteMany({ where: { idAtividade: id } });
        } catch {}
        try {
          await (tx as any).arquivo?.deleteMany({ where: { idAtividade: id } });
        } catch {}
        try {
          await tx.alternativa.deleteMany({ where: { idAtividade: id } });
        } catch {}

        // por fim delete a atividade
        await tx.atividade.delete({ where: { idAtividade: id } });
      });

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("DELETE /api/atividades/[id] error:", err);
      return res
        .status(500)
        .json({ error: err?.message ?? "Erro interno ao deletar atividade" });
    }
  }

  res.setHeader("Allow", "DELETE");
  return res.status(405).end("Method Not Allowed");
}
