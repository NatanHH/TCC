import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { withTimeout } from "../../../../lib/timeout";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const alunoIdRaw = url.searchParams.get("alunoId");
  const atividadeIdRaw = url.searchParams.get("atividadeId");
  const turmaIdRaw = url.searchParams.get("turmaId");

  const alunoId = alunoIdRaw ? Number(alunoIdRaw) : NaN;
  const atividadeId = atividadeIdRaw ? Number(atividadeIdRaw) : undefined;
  const turmaId = turmaIdRaw ? Number(turmaIdRaw) : undefined;

  if (!Number.isInteger(alunoId)) {
    return NextResponse.json({ error: "alunoId required" }, { status: 400 });
  }

  try {
    // === UNPLUGGED: RespostaAlunoAtividade ===
    const whereResposta: any = { idAluno: alunoId };
    if (atividadeId !== undefined) whereResposta.idAtividade = atividadeId;

    const totalRespostas = await withTimeout(
      prisma.respostaAlunoAtividade.count({ where: whereResposta }),
      5000
    );

    const corretasRespostas = await withTimeout(
      prisma.respostaAlunoAtividade.count({
        where: {
          ...whereResposta,
          OR: [{ notaObtida: { gt: 0 } }, { alternativa: { correta: true } }],
        },
      }),
      5000
    );

    // === PLUGGED: RealizacaoPlugged ===
    const wherePluggedBase: any = { idAluno: alunoId };
    if (atividadeId !== undefined) wherePluggedBase.idAtividade = atividadeId;
    if (turmaId !== undefined) wherePluggedBase.idTurma = turmaId;

    const totalPlugged = await withTimeout(
      (prisma as any).realizacaoPlugged.count({ where: wherePluggedBase }),
      5000
    );

    // Conta corretas por nota (rápido no DB)
    const corretasByNota = await withTimeout(
      (prisma as any).realizacaoPlugged.count({
        where: { ...wherePluggedBase, notaObtida: { gt: 0 } },
      }),
      5000
    );

    // Buscar candidatos com selectedValue para comparar em JS (em batches)
    const batchSize = 1000;
    let offset = 0;
    let corretasByMatch = 0;

    while (true) {
      const batch = (await withTimeout(
        (prisma as any).realizacaoPlugged.findMany({
          where: {
            ...wherePluggedBase,
            // evitar recontar os que já tem notaObtida>0
            AND: [
              { OR: [{ notaObtida: { lte: 0 } }, { notaObtida: null }] },
              { selectedValue: { not: null } },
            ],
          },
          select: { selectedValue: true, correctValue: true, notaObtida: true },
          skip: offset,
          take: batchSize,
        }),
        5000
      )) as Array<{
        selectedValue: unknown;
        correctValue: unknown;
        notaObtida: number | null;
      }>;

      if (batch.length === 0) break;

      for (const p of batch) {
        // nota já coberta no corretasByNota, mas mantemos segurança
        if (p.notaObtida != null && Number(p.notaObtida) > 0) {
          corretasByMatch++;
          continue;
        }
        if (
          p.selectedValue != null &&
          p.correctValue != null &&
          String(p.selectedValue) === String(p.correctValue)
        ) {
          corretasByMatch++;
        }
      }

      offset += batch.length;
      if (batch.length < batchSize) break;
    }

    // Evita duplicar contagem: corretasByNota já conta todos com nota>0,
    // corretasByMatch só considerou registros com nota<=0 ou null e selectedValue not null,
    // então somamos diretamente.
    const corretasPlugged = Number(corretasByNota) + Number(corretasByMatch);

    const totalAttempts = Number(totalRespostas) + Number(totalPlugged);
    const totalCorrect = Number(corretasRespostas) + Number(corretasPlugged);

    return NextResponse.json({ totalAttempts, correct: totalCorrect });
  } catch (err: any) {
    console.error(
      "failed to compute stats:",
      err?.message ?? err,
      err?.stack ?? ""
    );
    return NextResponse.json(
      { error: err?.message ?? "internal", stack: err?.stack ?? "" },
      { status: 500 }
    );
  }
}
