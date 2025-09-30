-- CreateTable
CREATE TABLE "Administrador" (
    "idAdm" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Professor" (
    "idProfessor" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Aluno" (
    "idAluno" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Turma" (
    "idTurma" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "professorId" INTEGER NOT NULL,
    CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("idProfessor") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TurmaAluno" (
    "idTurma" INTEGER NOT NULL,
    "idAluno" INTEGER NOT NULL,

    PRIMARY KEY ("idTurma", "idAluno"),
    CONSTRAINT "TurmaAluno_idTurma_fkey" FOREIGN KEY ("idTurma") REFERENCES "Turma" ("idTurma") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TurmaAluno_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "Aluno" ("idAluno") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Atividade" (
    "idAtividade" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "nota" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "AtividadeTurma" (
    "idAtividadeTurma" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAtividade" INTEGER NOT NULL,
    "idTurma" INTEGER NOT NULL,
    "dataAplicacao" DATETIME,
    CONSTRAINT "AtividadeTurma_idAtividade_fkey" FOREIGN KEY ("idAtividade") REFERENCES "Atividade" ("idAtividade") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtividadeTurma_idTurma_fkey" FOREIGN KEY ("idTurma") REFERENCES "Turma" ("idTurma") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "idAlternativa" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAtividade" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,
    CONSTRAINT "Alternativa_idAtividade_fkey" FOREIGN KEY ("idAtividade") REFERENCES "Atividade" ("idAtividade") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RespostaAlunoAtividade" (
    "idResposta" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idAluno" INTEGER NOT NULL,
    "idAtividade" INTEGER NOT NULL,
    "respostaTexto" TEXT,
    "idAlternativaEscolhida" INTEGER,
    "notaObtida" REAL,
    "feedback" TEXT,
    "dataAplicacao" DATETIME,
    CONSTRAINT "RespostaAlunoAtividade_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "Aluno" ("idAluno") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RespostaAlunoAtividade_idAtividade_fkey" FOREIGN KEY ("idAtividade") REFERENCES "Atividade" ("idAtividade") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RespostaAlunoAtividade_idAlternativaEscolhida_fkey" FOREIGN KEY ("idAlternativaEscolhida") REFERENCES "Alternativa" ("idAlternativa") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_email_key" ON "Aluno"("email");
