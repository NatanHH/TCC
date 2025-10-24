"use client";
import React, { JSX, useEffect, useState } from "react";
import styles from "./page.module.css";

type AtividadeResumo = {
  idAtividade: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  nota?: number | null;
  dataAplicacao?: string | null;
  turma?: {
    idTurma: number;
    nome: string;
  };
  arquivos?: {
    idArquivo: number;
    url: string;
    tipoArquivo?: string | null;
    nomeArquivo?: string | null;
  }[];
};

export default function Page(): JSX.Element {
  const [atividades, setAtividades] = useState<AtividadeResumo[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] =
    useState<AtividadeResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupAberto, setPopupAberto] = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState<boolean>(false);

  // Estados para informações do aluno
  const [alunoId, setAlunoId] = useState<number | null>(null);
  const [alunoNome, setAlunoNome] = useState<string>("Aluno");
  const [alunoEmail, setAlunoEmail] = useState<string>("aluno@exemplo.com");

  // Carregar dados do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("idAluno");
      const nome = localStorage.getItem("alunoNome");
      const email = localStorage.getItem("alunoEmail");

      if (id) setAlunoId(Number(id));
      if (nome) setAlunoNome(nome);
      if (email) setAlunoEmail(email);
    }
  }, []);

  // Buscar atividades quando alunoId estiver disponível
  useEffect(() => {
    if (alunoId) {
      fetchAtividades();
    }
  }, [alunoId]);

  // FUNÇÃO SIMPLES igual ao professor
  async function fetchAtividades() {
    if (!alunoId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/aluno/atividades?alunoId=${alunoId}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setAtividades(data);
      } else {
        console.error("Resposta não é um array:", data);
        setAtividades([]);
      }
    } catch (err) {
      console.error("Erro ao buscar atividades:", err);
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

  function abrirAnexo(idArquivo: number) {
    window.open(`/api/attachments/${idArquivo}`, "_blank");
  }

  function formatarData(dataString?: string | null) {
    if (!dataString) return "";
    return new Date(dataString).toLocaleDateString("pt-BR");
  }

  function sairSistema() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("idAluno");
      localStorage.removeItem("alunoNome");
      localStorage.removeItem("alunoEmail");
      window.location.href = "/login";
    }
  }

  return (
    <div className={styles.paginaAlunoBody}>
      <aside className={styles.paginaAlunoAside}>
        <div className={styles.logoContainer}>
          <img
            className={styles.logoImg}
            src="/images/logopng.png"
            alt="Logo Codemind"
          />
        </div>
        <h2>Minhas Atividades</h2>
        <p style={{ color: "#bdbdda", fontSize: "0.9em", marginTop: 8 }}>
          Atividades das minhas turmas
        </p>
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades{" "}
            <span className={styles.headerTitleSpan}>: Minhas Atividades</span>
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
                <span className={styles.userName}>{alunoNome}</span>
                <span className={styles.userEmail}>{alunoEmail}</span>
              </div>
            </div>

            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
            >
              <h3>Detalhes do Aluno</h3>
              <p>
                <strong>Nome:</strong> {alunoNome}
              </p>
              <p>
                <strong>Email:</strong> {alunoEmail}
              </p>
              <p>
                <strong>ID:</strong> {alunoId}
              </p>
              <button onClick={sairSistema}>Sair</button>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 880, marginTop: 18 }}>
          {loading && <p style={{ color: "#fff" }}>Carregando atividades...</p>}

          {!loading && atividades.length === 0 && (
            <div className={styles.card} style={{ textAlign: "center" }}>
              <h2 style={{ color: "#ff9800" }}>
                📚 Nenhuma Atividade Disponível
              </h2>
              <p style={{ color: "#dcd7ee" }}>
                Você ainda não possui atividades aplicadas em suas turmas.
              </p>
            </div>
          )}

          {!loading &&
            !atividadeSelecionada &&
            atividades.map((a) => (
              <div
                key={`${a.idAtividade}-${a.turma?.idTurma}`}
                className={styles.card}
                style={{ cursor: "pointer" }}
                onClick={() => mostrarDetalhe(a)}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div style={{ flex: 1 }}>
                    <h2>{a.titulo}</h2>
                    <p style={{ color: "#dcd7ee" }}>
                      {a.descricao || "Sem descrição"}
                    </p>
                    <small style={{ color: "#bdbdda" }}>
                      Turma: {a.turma?.nome || "N/A"}
                    </small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        background: "#00bcd4",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.8em",
                        marginBottom: 4,
                      }}
                    >
                      {a.tipo || "GERAL"}
                    </div>
                    <div style={{ color: "#ff9800" }}>Nota: {a.nota}/10</div>
                  </div>
                </div>
              </div>
            ))}

          {/* Detalhe da atividade selecionada */}
          {atividadeSelecionada && (
            <div className={styles.atividadeDetalhe}>
              <div style={{ marginBottom: 20 }}>
                <h1>{atividadeSelecionada.titulo}</h1>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      background: "#00bcd4",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 16,
                      fontSize: "0.9em",
                    }}
                  >
                    {atividadeSelecionada.tipo || "GERAL"}
                  </span>
                  <span
                    style={{
                      background: "#ff9800",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 16,
                      fontSize: "0.9em",
                    }}
                  >
                    Nota: {atividadeSelecionada.nota}/10
                  </span>
                  <span
                    style={{
                      background: "#4caf50",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 16,
                      fontSize: "0.9em",
                    }}
                  >
                    Turma: {atividadeSelecionada.turma?.nome}
                  </span>
                </div>
              </div>

              <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
                {atividadeSelecionada.descricao || "Sem descrição disponível."}
              </p>

              {/* Arquivos/Anexos */}
              {atividadeSelecionada.arquivos &&
                atividadeSelecionada.arquivos.length > 0 && (
                  <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <h3 style={{ color: "#dcd7ee", marginBottom: 12 }}>
                      📎 Arquivos da Atividade (
                      {atividadeSelecionada.arquivos.length})
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {atividadeSelecionada.arquivos.map((arquivo) => (
                        <div
                          key={arquivo.idArquivo}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 12,
                            background: "#3a2b4f",
                            borderRadius: 8,
                            border: "1px solid #555",
                          }}
                        >
                          <div style={{ color: "#fff" }}>
                            <div style={{ fontWeight: "bold" }}>
                              {arquivo.nomeArquivo ||
                                arquivo.url.split("/").pop()}
                            </div>
                            <div style={{ fontSize: "0.8em", color: "#bbb" }}>
                              {arquivo.tipoArquivo || "Arquivo"}
                            </div>
                          </div>
                          <button
                            className={styles.btnAplicar}
                            onClick={() => abrirAnexo(arquivo.idArquivo)}
                          >
                            📥 Abrir / Baixar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className={styles.botoesAtividade} style={{ marginTop: 30 }}>
                <button
                  className={styles.btnFormulario}
                  onClick={() =>
                    alert(
                      `Abrindo formulário para resolver: ${atividadeSelecionada.titulo}`
                    )
                  }
                >
                  📝 Resolver Atividade
                </button>
                <button
                  className={styles.btnEnviar}
                  onClick={() =>
                    alert(
                      `Enviando solução da atividade: ${atividadeSelecionada.titulo}`
                    )
                  }
                >
                  📤 Enviar Solução
                </button>
                <button
                  className={styles.btnVerdesempenho}
                  onClick={mostrarDesempenho}
                >
                  📊 Ver Meu Desempenho
                </button>
                <button className={styles.btn} onClick={voltarParaLista}>
                  ← Voltar para Lista
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
              📊 Seu Desempenho na Atividade:
              <br />
              <span style={{ color: "#00bcd4" }}>
                {atividadeSelecionada
                  ? atividadeSelecionada.titulo
                  : "Atividade"}
              </span>
            </h2>
            <div className={styles.desempenhoLinha}>
              <span>{alunoNome}</span>
              <span>
                Status: <span className={styles.acertosBadge}>Pendente</span>
              </span>
            </div>
            <p style={{ color: "#bdbdda", marginTop: 12 }}>
              Resolva a atividade para ver seu desempenho aqui.
            </p>
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
