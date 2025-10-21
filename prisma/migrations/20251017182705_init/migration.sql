-- CreateTable
CREATE TABLE "AtividadeProfessor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAtividade" INTEGER NOT NULL,
    "idProfessor" INTEGER NOT NULL,
    "dataVinculo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AtividadeProfessor_idAtividade_fkey" FOREIGN KEY ("idAtividade") REFERENCES "Atividade" ("idAtividade") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtividadeProfessor_idProfessor_fkey" FOREIGN KEY ("idProfessor") REFERENCES "Professor" ("idProfessor") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AtividadeProfessor_idAtividade_idx" ON "AtividadeProfessor"("idAtividade");

-- CreateIndex
CREATE INDEX "AtividadeProfessor_idProfessor_idx" ON "AtividadeProfessor"("idProfessor");

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeProfessor_idAtividade_idProfessor_key" ON "AtividadeProfessor"("idAtividade", "idProfessor");
