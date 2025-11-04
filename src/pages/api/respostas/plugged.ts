import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildInstanceFromSeed(seed: number) {
  const rand = mulberry32(seed);
  const cards = [8, 4, 2, 1];
  const bits = cards.map(() => (rand() > 0.5 ? 1 : 0));
  const decimal = bits.reduce<number>((acc, b, i) => acc + b * cards[i], 0);

  const opts = new Set<number>();
  opts.add(decimal);
  while (opts.size < 4) {
    const delta = Math.floor((rand() - 0.5) * 6);
    opts.add(Math.max(0, decimal + delta));
  }
  const alternatives = Array.from(opts).map((v, i) => ({
    id: `opt${i}`,
    value: v,
    label: String(v),
  }));
  for (let i = alternatives.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
  }

  return { cards, bits, decimal, alternatives };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const body = req.body ?? {};
    const idAtividade = Number(body.idAtividade) || 0;
    const idAluno = body.idAluno ? Number(body.idAluno) : null;
    const idTurma = body.idTurma ? Number(body.idTurma) : null;
    const seed = Number(body.seed);
    const selectedValue =
      body.selectedValue !== undefined ? Number(body.selectedValue) : null;

    if (!idAtividade || Number.isNaN(seed) || selectedValue === null) {
      return res.status(400).json({ error: "payload inválido" });
    }

    // recalcula a partir do seed para saber qual é o correto
    const instance = buildInstanceFromSeed(seed);
    const correctValue = instance.decimal;
    const correta = selectedValue === correctValue;
    const notaObtida = correta ? 10 : 0;

    // grava apenas dados essenciais
    const saved = await (prisma as any).realizacaoPlugged.create({
      data: {
        idAtividade,
        idAluno,
        idTurma,
        seed,
        correctValue,
        selectedValue,
        notaObtida,
      },
    });

    return res
      .status(200)
      .json({ ok: true, id: saved.id, correta, correctValue, notaObtida });
  } catch (err: any) {
    console.error("respostas/plugged error:", err);
    return res.status(500).json({ error: err?.message ?? "Erro interno" });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
