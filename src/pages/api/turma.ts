import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Buscar turmas do professor
  if (req.method === "GET") {
    const { professorId } = req.query;

    if (!professorId) {
      return res.status(400).json({ error: "professorId é obrigatório" });
    }

    try {
      const turmas = await prisma.turma.findMany({
        where: {
          professorId: Number(professorId),
        },
        include: {
          alunos: {
            include: {
              aluno: {
                select: {
                  idAluno: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: { alunos: true },
          },
        },
        orderBy: {
          nome: "asc",
        },
      });

      return res.status(200).json(turmas);
    } catch (error: any) {
      console.error("Erro ao buscar turmas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // POST: Criar turma
  if (req.method === "POST") {
    const { nomeTurma, professorId, alunos } = req.body;

    if (!nomeTurma || !professorId || !Array.isArray(alunos)) {
      return res.status(400).json({
        error: "nomeTurma, professorId e alunos (array) são obrigatórios",
      });
    }

    try {
      // operação atômica para evitar duplicação
      const result = await prisma.$transaction(async (tx) => {
        // 1) verifica se já existe turma com mesmo nome e professor
        let turma = await tx.turma.findFirst({
          where: {
            nome: nomeTurma,
            professorId: Number(professorId),
          },
        });

        // 2) se não existir, cria a turma (uma única criação)
        if (!turma) {
          turma = await tx.turma.create({
            data: {
              nome: nomeTurma,
              professorId: Number(professorId),
            },
          });
        }

        // 3) para cada aluno: upsert (por email) e criar relação turmaAluno se ainda não existir
        const alunosCriados: any[] = [];
        for (const a of alunos) {
          if (!a || !a.email) continue;

          // assume que Aluno.email é único no schema
          const aluno = await tx.aluno.upsert({
            where: { email: a.email },
            update: { nome: a.nome ?? a.email },
            create: {
              nome: a.nome ?? a.email,
              email: a.email,
              senha: a.senha ?? "", // ajuste conforme seu modelo (ou remova senha se não fornecer)
            },
          });

          // cria relação apenas se ainda não existir
          const rel = await tx.turmaAluno.findFirst({
            where: {
              idTurma: turma.idTurma,
              idAluno: aluno.idAluno,
            },
          });

          if (!rel) {
            await tx.turmaAluno.create({
              data: {
                idTurma: turma.idTurma,
                idAluno: aluno.idAluno,
              },
            });
          }

          alunosCriados.push(aluno);
        }

        return { turma, alunos: alunosCriados };
      }); // end transaction

      return res.status(201).json({
        message: "Turma criada/atualizada com sucesso",
        turma: result.turma,
        alunos: result.alunos,
      });
    } catch (e: any) {
      console.error("Erro ao criar turma:", e);
      return res
        .status(500)
        .json({ error: "Erro interno", details: e.message });
    }
  }

  // DELETE: Excluir turma
  if (req.method === "DELETE") {
    const { turmaId } = req.body;

    if (!turmaId) {
      return res.status(400).json({ error: "turmaId é obrigatório" });
    }

    try {
      // Verificar se a turma existe e se pertence a algum professor
      const turmaExistente = await prisma.turma.findUnique({
        where: { idTurma: Number(turmaId) },
        include: {
          alunos: true,
          atividades: true,
        },
      });

      if (!turmaExistente) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      // Remover relacionamentos primeiro
      // 1. Capturar ids dos alunos vinculados antes de remover as relações
      const alunoIds =
        turmaExistente.alunos?.map((ta: any) => ta.idAluno) || [];

      // 2. Remover alunos da turma (tabela de junção)
      await prisma.turmaAluno.deleteMany({
        where: { idTurma: Number(turmaId) },
      });

      // 3. Remover associações atividade <-> turma (tabela de junção)
      await prisma.atividadeTurma.deleteMany({
        where: { idTurma: Number(turmaId) },
      });

      // 4. Deletar alunos que ficaram sem nenhuma turma (remover logins)
      if (alunoIds.length > 0) {
        const alunosParaDeletar: number[] = [];

        for (const idAluno of alunoIds) {
          const relacionamentos = await prisma.turmaAluno.count({
            where: { idAluno: idAluno },
          });

          // se não existem mais relações com turmas, marcar para deletar
          if (relacionamentos === 0) {
            alunosParaDeletar.push(idAluno);
          }
        }

        if (alunosParaDeletar.length > 0) {
          await prisma.aluno.deleteMany({
            where: { idAluno: { in: alunosParaDeletar } },
          });
        }
      }

      // 5. Finalmente, excluir a turma
      await prisma.turma.delete({
        where: { idTurma: Number(turmaId) },
      });

      return res.status(200).json({
        message: "Turma excluída com sucesso",
        turmaExcluida: turmaExistente.nome,
      });
    } catch (error: any) {
      console.error("Erro ao excluir turma:", error);
      return res.status(500).json({
        error: "Erro interno ao excluir turma",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
