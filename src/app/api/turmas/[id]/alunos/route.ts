import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const turmaId = params.id;
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload: unknown = await req.json().catch(() => undefined);
  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const body = payload as { alunoId?: number };
  return NextResponse.json({}); // placeholder
}
