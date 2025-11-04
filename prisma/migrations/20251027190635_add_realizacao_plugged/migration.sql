-- CreateTable
CREATE TABLE "RealizacaoPlugged" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAtividade" INTEGER NOT NULL,
    "idAluno" INTEGER,
    "idTurma" INTEGER,
    "seed" INTEGER NOT NULL,
    "correctValue" INTEGER NOT NULL,
    "selectedValue" INTEGER,
    "notaObtida" INTEGER,
    "dataAplicacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
