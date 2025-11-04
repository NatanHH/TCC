-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Atividade" (
    "idAtividade" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "nota" REAL NOT NULL,
    "professorId" INTEGER,
    "isStatic" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "script" TEXT,
    "linguagem" TEXT,
    "wasmUrl" TEXT,
    CONSTRAINT "Atividade_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("idProfessor") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Atividade" ("descricao", "idAtividade", "linguagem", "nota", "professorId", "script", "tipo", "titulo") SELECT "descricao", "idAtividade", "linguagem", "nota", "professorId", "script", "tipo", "titulo" FROM "Atividade";
DROP TABLE "Atividade";
ALTER TABLE "new_Atividade" RENAME TO "Atividade";
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
