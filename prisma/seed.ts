import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixSequence() {
  try {
    const ag = await prisma.atividade.aggregate({
      _max: { idAtividade: true },
    });
    const maxId = (ag._max.idAtividade ?? 0) as number;
    const dbUrl = process.env.DATABASE_URL ?? "";

    if (dbUrl.startsWith("postgres")) {
      // ajusta sequência para Postgres (next value será maxId+1)
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('atividade','idAtividade'), ${maxId}, true);`
      );
      console.log("Postgres: sequence ajustada para", maxId);
    } else if (dbUrl.startsWith("mysql")) {
      // MYSQL: auto_increment deve ser max+1
      const next = maxId + 1;
      await prisma.$executeRawUnsafe(
        `ALTER TABLE atividade AUTO_INCREMENT = ${next};`
      );
      console.log("MySQL: AUTO_INCREMENT ajustado para", next);
    } else if (dbUrl.includes("sqlite")) {
      // SQLite: sqlite_sequence.seq = maxId
      await prisma.$executeRawUnsafe(
        `UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'atividade';`
      );
      console.log("SQLite: sqlite_sequence atualizado para", maxId);
    } else {
      console.log("DB provider não identificado, pulei ajuste de sequência.");
    }
  } catch (e) {
    console.error("Erro ao ajustar sequência:", e);
  }
}

async function main() {
  const titulo = "Contando os pontos (Plugged)";
  const descricao = `Jogo: Contando os pontos — cartas com valores em potências de 2 (1,2,4,8,16,...).
O aluno vira cartas para representar bits 1 e 0 e soma os valores para formar o número decimal correspondente.
A cada abertura da atividade um número binário aleatório será gerado e o aluno escolherá a alternativa correta.`;

  // Procura por uma atividade existente com esse título
  const existente = await prisma.atividade.findFirst({
    where: { titulo: { contains: titulo } },
  });

  if (existente) {
    // Atualiza campos relevantes (mantendo outras propriedades)
    const updated = await prisma.atividade.update({
      where: { idAtividade: existente.idAtividade },
      data: {
        titulo,
        descricao,
        tipo: "PLUGGED",
        // marcar como estática (se o campo existir no schema)
        isStatic: true as any,
        source: "builtin" as any,
        // nota obrigatória para atividade PLUGGED
        nota: 10 as any,
      } as any,
    });
    console.log(`Seed: atividade atualizada (id: ${updated.idAtividade})`);
  } else {
    // Cria a atividade
    const created = await prisma.atividade.create({
      data: {
        titulo,
        descricao,
        tipo: "PLUGGED",
        // marque como estática se o schema tiver estes campos
        isStatic: true as any,
        source: "builtin" as any,
        // nota padrão para esta atividade
        nota: 10 as any,
      } as any,
    });
    console.log(`Seed: atividade criada (id: ${created.idAtividade})`);
  }

  // Garante que a sequência do DB esteja sincronizada com o maior id atual
  await fixSequence();
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
