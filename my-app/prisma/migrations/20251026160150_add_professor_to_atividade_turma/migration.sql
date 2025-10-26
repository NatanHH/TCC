-- AlterTable
ALTER TABLE "Atividade" ADD COLUMN "wasmUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtividadeTurma" (
    "idAtividadeTurma" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAtividade" INTEGER NOT NULL,
    "idTurma" INTEGER NOT NULL,
    "idProfessor" INTEGER,
    "dataAplicacao" DATETIME,
    CONSTRAINT "AtividadeTurma_idAtividade_fkey" FOREIGN KEY ("idAtividade") REFERENCES "Atividade" ("idAtividade") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtividadeTurma_idTurma_fkey" FOREIGN KEY ("idTurma") REFERENCES "Turma" ("idTurma") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtividadeTurma_idProfessor_fkey" FOREIGN KEY ("idProfessor") REFERENCES "Professor" ("idProfessor") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AtividadeTurma" ("dataAplicacao", "idAtividade", "idAtividadeTurma", "idTurma") SELECT "dataAplicacao", "idAtividade", "idAtividadeTurma", "idTurma" FROM "AtividadeTurma";
DROP TABLE "AtividadeTurma";
ALTER TABLE "new_AtividadeTurma" RENAME TO "AtividadeTurma";
CREATE INDEX "AtividadeTurma_idAtividade_idx" ON "AtividadeTurma"("idAtividade");
CREATE INDEX "AtividadeTurma_idTurma_idx" ON "AtividadeTurma"("idTurma");
CREATE INDEX "AtividadeTurma_idProfessor_idx" ON "AtividadeTurma"("idProfessor");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
