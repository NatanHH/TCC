import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const alunoIdRaw = url.searchParams.get("alunoId");
  const atividadeIdRaw = url.searchParams.get("atividadeId");

  const alunoId = alunoIdRaw ? Number(alunoIdRaw) : NaN;
  const atividadeId = atividadeIdRaw ? Number(atividadeIdRaw) : undefined;

  if (!Number.isInteger(alunoId)) {
    return NextResponse.json({ error: "alunoId required" }, { status: 400 });
  }

  try {
    // RespostaAlunoAtividade (clássico)
    const whereResposta: any = { idAluno: alunoId };
    if (atividadeId !== undefined) whereResposta.idAtividade = atividadeId;

    const totalRespostas = await prisma.respostaAlunoAtividade.count({
      where: whereResposta,
    });

    const corretasRespostas = await prisma.respostaAlunoAtividade.count({
      where: { ...whereResposta, notaObtida: { gt: 0 } },
    });

    // RealizacaoPlugged (plugged)
    const wherePluggedBase: any = { idAluno: alunoId };
    if (atividadeId !== undefined) wherePluggedBase.idAtividade = atividadeId;

    const totalPlugged = await (prisma as any).realizacaoPlugged.count({
      where: wherePluggedBase,
    });

    // Para contar corretas em plugged, buscamos apenas os registros relevantes
    // (com notaObtida>0 ou selectedValue não nulo) e comparamos selectedValue vs correctValue em JS.
    const pluggedCandidates = await (prisma as any).realizacaoPlugged.findMany({
      where: {
        ...wherePluggedBase,
        OR: [{ notaObtida: { gt: 0 } }, { selectedValue: { not: null } }],
      },
      select: {
        selectedValue: true,
        correctValue: true,
        notaObtida: true,
      },
    });

    let corretasPlugged = 0;
    for (const p of pluggedCandidates) {
      if (p.notaObtida != null && Number(p.notaObtida) > 0) {
        corretasPlugged++;
        continue;
      }
      // comparar valores como string para cobrir números/strings
      if (
        p.selectedValue != null &&
        p.correctValue != null &&
        String(p.selectedValue) === String(p.correctValue)
      ) {
        corretasPlugged++;
      }
    }

    const totalAttempts = totalRespostas + totalPlugged;
    const totalCorrect = corretasRespostas + corretasPlugged;

    return NextResponse.json({ totalAttempts, correct: totalCorrect });
  } catch (err) {
    console.error("failed to compute stats", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
