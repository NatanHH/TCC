import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(request: Request, { params }: { params: any }) {
  const { id: turmaId } = await params;
  if (!turmaId)
    return NextResponse.json({ error: "turmaId required" }, { status: 400 });

  try {
    const rels = await prisma.turmaAluno.findMany({
      where: { idTurma: Number(turmaId) },
      include: {
        aluno: { select: { idAluno: true, nome: true, email: true } },
      },
      orderBy: { aluno: { nome: "asc" } },
    });

    const alunos = rels.map((r) => ({
      id: r.aluno.idAluno,
      nome: r.aluno.nome,
      email: r.aluno.email,
    }));

    return NextResponse.json(alunos);
  } catch (err) {
    console.error("failed to fetch alunos", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
