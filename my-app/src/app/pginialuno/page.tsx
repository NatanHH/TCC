"use client";
import React, { JSX, useEffect, useState } from "react";
import styles from "./page.module.css";

type AtividadeResumo = {
  idAtividade: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  nota?: number | null;
  arquivos?: { idArquivo: number; url: string; tipoArquivo?: string | null }[];
  aplicacoes?: {
    idAtividadeTurma: number;
    idTurma: number;
    dataAplicacao?: string | null;
  }[];
};

export default function Page(): JSX.Element {
  const [atividades, setAtividades] = useState<AtividadeResumo[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] =
    useState<AtividadeResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupAberto, setPopupAberto] = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState<boolean>(false);

  // Pega id do aluno; ajuste se você usa sessão (next-auth) em vez de localStorage
  const alunoId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("idAluno"))
      : null;

  useEffect(() => {
    if (!alunoId) {
      // opcional: notificar que precisa estar logado
      console.warn(
        "Aluno não autenticado (idAluno não encontrado no localStorage)."
      );
      return;
    }
    fetchAtividades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  async function fetchAtividades() {
    if (!alunoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/aluno/${alunoId}/atividades`);
      if (!res.ok) {
        console.error("Erro ao buscar atividades:", res.statusText);
        setAtividades([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setAtividades(json.atividades || []);
    } catch (err) {
      console.error("Erro fetching atividades:", err);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }

  function mostrarDetalhe(atividade: AtividadeResumo) {
    setAtividadeSelecionada(atividade);
  }

  function voltarParaLista() {
    setAtividadeSelecionada(null);
  }

  function toggleUserPopup() {
    setPopupAberto((prev) => !prev);
  }

  function mostrarDesempenho() {
    setModalAberto(true);
  }
  function fecharModalDesempenho() {
    setModalAberto(false);
  }

  // helper download (abre em nova aba, supondo endpoint de download /api/attachments/:id)
  function abrirAnexo(idArquivo: number) {
    window.open(`/api/attachments/${idArquivo}`, "_blank");
  }

  return (
    <div className={styles.paginaAlunoBody}>
      <aside className={styles.paginaAlunoAside}>
        <div className={styles.logoContainer}>
          <img
            className={styles.logoImg}
            src="/images/logopng.png"
            alt="Logo Codificaax"
          />
        </div>
        <h2>Minhas Atividades Concluídas</h2>
        {/* você pode listar filtros ou turmas aqui se quiser */}
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades{" "}
            <span className={styles.headerTitleSpan}>
              : Minhas Atividades Concluídas
            </span>
          </h1>

          <div className={styles.userInfoWrapper}>
            <div
              className={styles.userInfo}
              onClick={toggleUserPopup}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
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

        <div style={{ width: "100%", maxWidth: 880, marginTop: 18 }}>
          {loading && <p style={{ color: "#fff" }}>Carregando atividades...</p>}
          {!loading && atividades.length === 0 && (
            <p style={{ color: "#fff" }}>
              Nenhuma atividade aplicada às suas turmas.
            </p>
          )}

          {!loading &&
            !atividadeSelecionada &&
            atividades.map((a) => (
              <div
                key={a.idAtividade}
                className={styles.card}
                style={{ cursor: "pointer" }}
                onClick={() => mostrarDetalhe(a)}
              >
                <h2>{a.titulo}</h2>
                <p style={{ color: "#dcd7ee" }}>
                  {a.descricao
                    ? a.descricao.substring(0, 200)
                    : "Sem descrição"}
                </p>
                <div style={{ marginTop: 8 }}>
                  <small style={{ color: "#bdbdda" }}>
                    {a.aplicacoes && a.aplicacoes.length > 0
                      ? `Aplicada em ${a.aplicacoes.length} turma(s)`
                      : ""}
                  </small>
                </div>
              </div>
            ))}

          {/* Detalhe da atividade selecionada */}
          {atividadeSelecionada && (
            <div className={styles.atividadeDetalhe}>
              <h1>{atividadeSelecionada.titulo}</h1>
              <p>{atividadeSelecionada.descricao}</p>

              {/* anexos */}
              {atividadeSelecionada.arquivos &&
                atividadeSelecionada.arquivos.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h3 style={{ color: "#dcd7ee" }}>Anexos</h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {atividadeSelecionada.arquivos.map((ar) => (
                        <div
                          key={ar.idArquivo}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 8,
                            background: "#3a2b4f",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ color: "#fff" }}>
                            {ar.url.split("/").pop()}
                          </div>
                          <div>
                            <button
                              className={styles.btnAplicar}
                              onClick={() => abrirAnexo(ar.idArquivo)}
                            >
                              Abrir / Baixar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className={styles.botoesAtividade} style={{ marginTop: 20 }}>
                <button
                  className={styles.btnFormulario}
                  onClick={() =>
                    alert(
                      `Abrindo formulário para ${atividadeSelecionada.titulo}...`
                    )
                  }
                >
                  Abrir Formulário
                </button>
                <button
                  className={styles.btnEnviar}
                  onClick={() =>
                    alert(
                      `Atividade ${atividadeSelecionada.titulo} enviada com sucesso!`
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
              <span style={{ color: "#00bcd4" }}>
                {atividadeSelecionada
                  ? atividadeSelecionada.titulo
                  : "Atividade"}
              </span>
            </h2>
            <div className={styles.desempenhoLinha}>
              <span>Aluno Exemplo</span>
              <span>
                Acertos: <span className={styles.acertosBadge}>0/0</span>
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
