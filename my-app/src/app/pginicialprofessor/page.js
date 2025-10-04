"use client";
import { useState } from "react";
import styles from "./page.module.css";

const atividadesPorTurma = {
  "Turma 1": [
    {
      titulo: "Contagem Binária",
      resumo: "Aprenda a contar em binário de forma simples.",
      descricao:
        "Nesta atividade, são utilizadas cartas com uma cor em cada lado, organizadas em uma tabela quadrada de forma que, em cada linha e coluna, o número de cartas com o lado colorido virado para cima seja par. Após a organização, um dos jogadores vira uma carta sem que o outro veja, e o desafio é descobrir qual carta foi alterada apenas observando a nova disposição da tabela.",
    },
    {
      titulo: "Lógica de Programação",
      resumo: "Introdução aos conceitos básicos de lógica.",
      descricao:
        "A atividade aborda operadores lógicos, estruturas condicionais e de repetição, com exemplos e desafios para desenvolver o raciocínio lógico em programação.",
    },
  ],
  "Turma 2": [
    {
      titulo: "Contagem Binária",
      resumo: "Entenda o sistema binário e sua aplicação.",
      descricao:
        "Atividade voltada para a compreensão do sistema binário, conversão de números e exercícios para praticar a lógica envolvida.",
    },
    {
      titulo: "Lógica de Programação",
      resumo: "Conceitos fundamentais de lógica para programar.",
      descricao:
        "Exercícios e explicações sobre lógica de programação, incluindo fluxogramas, pseudocódigo e resolução de problemas.",
    },
  ],
};

const desempenhoFixo = {
  tituloAtividade: "Contagem Binária",
  alunos: [{ nome: "João", acertos: "8/10" }],
};

export default function PageProfessor() {
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [atividadeDetalhe, setAtividadeDetalhe] = useState(null);
  const [popupAberto, setPopupAberto] = useState(false);
  const [modalTurmaAberto, setModalTurmaAberto] = useState(false);
  const [modalDesempenhoAberto, setModalDesempenhoAberto] = useState(false);

  function selecionarTurma(nome) {
    setTurmaSelecionada(nome);
    setAtividadeDetalhe(null);
  }

  function mostrarDetalheAtividade(atividade) {
    setAtividadeDetalhe(atividade);
  }

  function voltarParaLista() {
    setAtividadeDetalhe(null);
  }

  function toggleUserPopup() {
    setPopupAberto((prev) => !prev);
  }

  function abrirModalTurma() {
    setModalTurmaAberto(true);
  }

  function fecharModalTurma() {
    setModalTurmaAberto(false);
  }

  function criarTurma() {
    fecharModalTurma();
    alert("Turma criada!");
  }

  function mostrarDesempenho() {
    setModalDesempenhoAberto(true);
  }

  function fecharModalDesempenho() {
    setModalDesempenhoAberto(false);
  }

  const handleOutsideClick = (event) => {
    if (popupAberto && !event.target.closest(`.${styles.userInfoWrapper}`)) {
      setPopupAberto(false);
    }
  };

  return (
    <div className={styles.paginaAlunoBody}>
      <aside className={styles.paginaAlunoAside}>
        <div className={styles.logoContainer}>
          <img
            className={styles.logoImg}
            src="/images/Logopng.png"
            alt="Logo Codificaax"
          />
        </div>
        <h2>Minhas Turmas</h2>
        <button
          className={`${styles.turmaBtn} ${
            turmaSelecionada === "Turma 1" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarTurma("Turma 1")}
        >
          Turma 1
        </button>
        <button
          className={`${styles.turmaBtn} ${
            turmaSelecionada === "Turma 2" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarTurma("Turma 2")}
        >
          Turma 2
        </button>
        <button className={styles.criarBtn} onClick={abrirModalTurma}>
          Criar Turma
        </button>
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades
            <span className={styles.headerTitleSpan}>
              : {turmaSelecionada || "Nenhuma turma selecionada"}
            </span>
          </h1>
          <div className={styles.userInfoWrapper}>
            <div
              className={styles.userInfo}
              onClick={toggleUserPopup}
              style={{ cursor: "pointer" }}
            >
              <img
                className={styles.userAvatar}
                src="https://www.gravatar.com/avatar/?d=mp"
                alt="Avatar"
              />
              <div className={styles.userDetails}>
                <span className={styles.userName}>Professor Exemplo</span>
                <span className={styles.userEmail}>professor@exemplo.com</span>
              </div>
            </div>
            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
            >
              <h3>Detalhes do Professor</h3>
              <p>
                <strong>Nome:</strong> Professor Exemplo
              </p>
              <p>
                <strong>Email:</strong> professor@exemplo.com
              </p>
              <p>
                <strong>ID:</strong> P001
              </p>
              <button onClick={() => alert("Gerenciar conta clicado!")}>
                Gerenciar Conta
              </button>
              <button onClick={() => alert("Sair clicado!")}>Sair</button>
            </div>
          </div>
        </div>

        <div>
          {!turmaSelecionada && (
            <button className={styles.criarCentral} onClick={abrirModalTurma}>
              Criar Turma
            </button>
          )}

          {turmaSelecionada &&
            !atividadeDetalhe &&
            atividadesPorTurma[turmaSelecionada].map((atividade, idx) => (
              <div
                className={styles.card}
                key={idx}
                onClick={() => mostrarDetalheAtividade(atividade)}
                style={{ cursor: "pointer" }}
              >
                <h2>{atividade.titulo}</h2>
                <p>{atividade.resumo}</p>
              </div>
            ))}

          {atividadeDetalhe && (
            <div className={styles.atividadeDetalhe}>
              <h2>{atividadeDetalhe.titulo}</h2>
              <p>{atividadeDetalhe.descricao}</p>
              <div className={styles.botoesAtividade}>
                <button
                  className={styles.btnAplicar}
                  onClick={() => alert("Atividade aplicada!")}
                >
                  Aplicar Atividade
                </button>
                <button
                  className={styles.btnVerdesempenho}
                  onClick={mostrarDesempenho}
                >
                  Ver Desempenho
                </button>
                <button className={styles.btn} onClick={voltarParaLista}>
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de criação de turma */}
        <div
          className={`${styles.modal} ${
            modalTurmaAberto ? styles.modalActive : ""
          }`}
        >
          <div className={styles.modalContent}>
            <h2>Criar Nova Turma</h2>
            <input type="text" placeholder="Nome da turma" />
            <textarea
              rows="4"
              placeholder="E-mails dos alunos, separados por vírgula"
            ></textarea>
            <button onClick={criarTurma}>Confirmar</button>
          </div>
        </div>

        {/* Modal de Desempenho */}
        <div
          className={`${styles.modal} ${
            modalDesempenhoAberto ? styles.modalActive : ""
          }`}
        >
          <div
            className={`${styles.modalContent} ${styles.desempenhoModalContent}`}
          >
            <h2>
              Desempenho da Turma na Atividade:
              <br />
              <span style={{ color: "#00bcd4" }}>
                {desempenhoFixo.tituloAtividade}
              </span>
            </h2>
            {desempenhoFixo.alunos.map((aluno, idx) => (
              <div className={styles.desempenhoLinha} key={idx}>
                <span>{aluno.nome}</span>
                <span>
                  Acertos:
                  <span className={styles.acertosBadge}>{aluno.acertos}</span>
                </span>
              </div>
            ))}
            <button
              className={styles.btnVoltarModal}
              onClick={fecharModalDesempenho}
            >
              Voltar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
