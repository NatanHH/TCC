"use client";
import { useState } from "react";
import styles from "./page.module.css";

const atividadesAluno = {
  "Atividade 1": [
    {
      titulo: "Contagem Binária",
      resumo: "Aprenda a contar em binário de forma simples.",
      descricao:
        "Nesta atividade, são utilizadas cartas com uma cor em cada lado, organizadas em uma tabela quadrada de forma que, em cada linha e coluna, o número de cartas com o lado colorido virado para cima seja par. Após a organização, um dos jogadores vira uma carta sem que o outro veja, e o desafio é descobrir qual carta foi alterada apenas observando a nova disposição da tabela.",
    },
  ],
  "Atividade 2": [
    {
      titulo: "Lógica de Programação",
      resumo: "Introdução aos conceitos básicos de lógica.",
      descricao:
        "A atividade aborda operadores lógicos, estruturas condicionais e de repetição, com exemplos e desafios para desenvolver o raciocínio lógico em programação.",
    },
  ],
};

export default function Page() {
  const [atividadeSelecionada, setAtividadeSelecionada] = useState(null)//atividade selecionada
  const [atividadeDetalhe, setAtividadeDetalhe] = useState(null);// detalhes da atividade
  // estados para popup e modal
  const [popupAberto, setPopupAberto] = useState(false);// popup de detalhes do aluno
  const [modalAberto, setModalAberto] = useState(false);// modal de desempenho

  function selecionarAtividade(nome) {
    setAtividadeSelecionada(nome);
    setAtividadeDetalhe(null);
  }

  function mostrarDetalheAtividade(atividade) {
    setAtividadeDetalhe(atividade);
  }

  function voltarParaLista() {
    setAtividadeDetalhe(null);
  }

  function mostrarDesempenho() {
    setModalAberto(true);
  }

  function fecharModalDesempenho() {
    setModalAberto(false);
  }

  function toggleUserPopup() {// alterna o estado do popup de detalhes do aluno
    setPopupAberto((prev) => !prev);
  }

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
        <h2>Minhas Atividades</h2>
        <button
          className={`${styles.turmaBtn} ${
            atividadeSelecionada === "Atividade 1" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarAtividade("Atividade 1")}
        >
          Contagem Binária
        </button>
        <button
          className={`${styles.turmaBtn} ${
            atividadeSelecionada === "Atividade 2" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarAtividade("Atividade 2")}
        >
          Lógica de Programação
        </button>
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades{" "}
            <span className={styles.headerTitleSpan}>
              : {atividadeSelecionada || "Nenhuma Atividade Selecionada"}
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
                <span className={styles.userName}>Aluno Exemplo</span>
                <span className={styles.userEmail}>aluno@exemplo.com</span>
              </div>
            </div>
            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
            >
              <h3>Detalhes do Aluno</h3>
              <p>
                <strong>Nome:</strong> Aluno Exemplo
              </p>
              <p>
                <strong>Email:</strong> aluno@exemplo.com
              </p>
              <p>
                <strong>Matrícula:</strong> 123456
              </p>
              <button onClick={() => alert("Gerenciar conta clicado!")}>
                Gerenciar Conta
              </button>
              <button onClick={() => alert("Sair clicado!")}>Sair</button>
            </div>
          </div>
        </div>
        <div>
          {!atividadeSelecionada && (
            <p>Selecione uma atividade para ver as informações.</p>
          )}
          {atividadeSelecionada &&
            !atividadeDetalhe &&
            atividadesAluno[atividadeSelecionada].map((atividade, idx) => (
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
              <h1>{atividadeDetalhe.titulo}</h1>
              <p>{atividadeDetalhe.descricao}</p>
              <div className={styles.botoesAtividade}>
                <button
                  className={styles.btnFormulario}
                  onClick={() =>
                    alert(
                      `Abrindo formulário para ${atividadeDetalhe.titulo}...`
                    )
                  }
                >
                  Abrir Formulário
                </button>
                <button
                  className={styles.btnEnviar}
                  onClick={() =>
                    alert(
                      `Atividade ${atividadeDetalhe.titulo} enviada com sucesso!`
                    )
                  }
                >
                  Enviar Atividade
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

        {/* Modal de Desempenho */}
        <div
          className={`${styles.modal} ${modalAberto ? styles.modalActive : ""}`}
        >
          <div className={styles.modalContent}>
            <h2>
              Seu Desempenho na Atividade:
              <br />
              <span style={{ color: "#00bcd4" }}>Contagem Binária</span>
            </h2>
            <div className={styles.desempenhoLinha}>
              <span>Aluno Exemplo</span>
              <span>
                Acertos: <span className={styles.acertosBadge}>8/10</span>
              </span>
            </div>
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
