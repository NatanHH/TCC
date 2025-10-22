"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import React from "react";
import { useRouter } from "next/navigation";

// Tipos
type Turma = {
  idTurma: number;
  nome: string;
  alunos: { aluno: { idAluno: number; nome: string; email: string } }[];
};
type Atividade = {
  idAtividade: number;
  titulo: string;
  descricao?: string;
  tipo?: string;
  nota?: number;
};

const desempenhoFixo = {
  tituloAtividade: "Contagem Binária",
  alunos: [{ nome: "João", acertos: "8/10" }],
};

export default function PageProfessor() {
  // Pega o professorId do localStorage
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [professorNome, setProfessorNome] = useState<string>("");
  const [professorEmail, setProfessorEmail] = useState<string>("");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [atividadeDetalhe, setAtividadeDetalhe] = useState<Atividade | null>(
    null
  );

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [atividadesTurma, setAtividadesTurma] = useState<Atividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(false);

  const [popupAberto, setPopupAberto] = useState(false);
  const [modalTurmaAberto, setModalTurmaAberto] = useState(false);
  const [modalDesempenhoAberto, setModalDesempenhoAberto] = useState(false);

  // Estados para criar turma
  const [nomeTurma, setNomeTurma] = useState("");
  const [alunos, setAlunos] = useState<
    { nome: string; email: string; senha: string }[]
  >([]);
  const [showAlunoForm, setShowAlunoForm] = useState(false);
  const [formAluno, setFormAluno] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loadingTurmas, setLoadingTurmas] = useState(false);

  // Modal para aplicar atividade (seleção de turma)
  const [modalAplicarAberto, setModalAplicarAberto] = useState(false);
  const [atividadeParaAplicar, setAtividadeParaAplicar] =
    useState<Atividade | null>(null);

  // Estado para confirmar aplicação (após selecionar turma)
  const [turmaSelecionadaParaAplicacao, setTurmaSelecionadaParaAplicacao] =
    useState<Turma | null>(null);
  const [confirmApplyModalOpen, setConfirmApplyModalOpen] = useState(false);

  // Busca professorId do localStorage, e turmas do professor
  useEffect(() => {
    const id = localStorage.getItem("idProfessor");
    const nome = localStorage.getItem("nomeProfessor");
    const email = localStorage.getItem("emailProfessor");
    if (id) setProfessorId(Number(id));
    if (nome) setProfessorNome(nome);
    if (email) setProfessorEmail(email);
  }, []);

  useEffect(() => {
    if (professorId) {
      fetchTurmas();
    }
  }, [professorId]);

  useEffect(() => {
    if (!turmaSelecionada) {
      fetchAtividades();
    } else {
      fetchAtividadesTurma(turmaSelecionada.idTurma);
    }
  }, [turmaSelecionada, professorId]);

  async function fetchTurmas() {
    setLoadingTurmas(true);
    const res = await fetch(`/api/turmasprofessor?professorId=${professorId}`);
    const data = await res.json();
    if (res.ok) setTurmas(data);
    else setTurmas([]);
    setLoadingTurmas(false);
  }

  async function fetchAtividades() {
    setLoadingAtividades(true);
    const res = await fetch(`/api/atividadesprofessor`);
    const data = await res.json();
    if (res.ok) {
      if (Array.isArray(data)) setAtividades(data);
      else if (data && Array.isArray(data.atividades))
        setAtividades(data.atividades);
      else setAtividades([]);
    } else setAtividades([]);
    setLoadingAtividades(false);
  }

  async function fetchAtividadesTurma(idTurma: number) {
    setLoadingAtividades(true);
    const res = await fetch(`/api/atividadesturma?turmaId=${idTurma}`);
    const data = await res.json();
    if (res.ok) setAtividadesTurma(data);
    else setAtividadesTurma([]);
    setLoadingAtividades(false);
  }

  function selecionarTurmaById(idTurma: number) {
    const turma = turmas.find((t) => t.idTurma === idTurma) || null;
    setTurmaSelecionada(turma);
    setAtividadeDetalhe(null);
  }

  function mostrarDetalheAtividade(atividade: Atividade) {
    // abre o painel central de detalhe (como no frame 5 do Figma),
    // neste painel haverá APENAS o botão Aplicar em turma + Voltar
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
    setNomeTurma("");
    setAlunos([]);
    setShowAlunoForm(false);
    setFormAluno({ nome: "", email: "", senha: "", confirmarSenha: "" });
  }

  function fecharModalTurma() {
    setModalTurmaAberto(false);
    setShowAlunoForm(false);
  }

  async function criarTurma() {
    if (!nomeTurma || alunos.length === 0 || !professorId) {
      alert(
        "Nome da turma, um aluno e estar logado como professor são obrigatórios!"
      );
      return;
    }
    const res = await fetch("/api/turma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeTurma,
        professorId,
        alunos,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Turma criada!");
      fecharModalTurma();
      fetchTurmas();
    } else {
      alert(data.error || "Erro ao criar turma.");
    }
  }

  function mostrarDesempenho() {
    setModalDesempenhoAberto(true);
  }

  function fecharModalDesempenho() {
    setModalDesempenhoAberto(false);
  }

  function handleAlunoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormAluno({ ...formAluno, [e.target.name]: e.target.value });
  }

  function abrirAlunoForm() {
    setShowAlunoForm(true);
    setFormAluno({ nome: "", email: "", senha: "", confirmarSenha: "" });
  }

  function cancelarAlunoForm() {
    setShowAlunoForm(false);
    setFormAluno({ nome: "", email: "", senha: "", confirmarSenha: "" });
  }

  function adicionarAluno(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formAluno.senha !== formAluno.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    if (!formAluno.nome || !formAluno.email || !formAluno.senha) {
      alert("Preencha todos os campos do aluno!");
      return;
    }
    setAlunos([
      ...alunos,
      { nome: formAluno.nome, email: formAluno.email, senha: formAluno.senha },
    ]);
    setShowAlunoForm(false);
    setFormAluno({ nome: "", email: "", senha: "", confirmarSenha: "" });
  }

  function removerAluno(idx: number) {
    setAlunos(alunos.filter((_, i) => i !== idx));
  }

  // Modal Aplicar Atividade (abre seleção de turma)
  function abrirModalAplicar(atividade: Atividade) {
    setAtividadeParaAplicar(atividade);
    setModalAplicarAberto(true);
    // reset selected turma/confirm states
    setTurmaSelecionadaParaAplicacao(null);
    setConfirmApplyModalOpen(false);
  }
  function fecharModalAplicar() {
    setModalAplicarAberto(false);
    setAtividadeParaAplicar(null);
    setTurmaSelecionadaParaAplicacao(null);
    setConfirmApplyModalOpen(false);
  }

  // Ao selecionar uma turma no modal de aplicar, vou abrir o modal de confirmação
  function selecionarTurmaParaAplicar(turma: Turma) {
    setTurmaSelecionadaParaAplicacao(turma);
    // fecha o modal de seleção e abre o modal de confirmação
    setModalAplicarAberto(false);
    setConfirmApplyModalOpen(true);
  }

  async function confirmarEAplicar() {
    if (!atividadeParaAplicar || !turmaSelecionadaParaAplicacao) return;
    await aplicarAtividadeEmTurma(turmaSelecionadaParaAplicacao.idTurma);
    setConfirmApplyModalOpen(false);
    setTurmaSelecionadaParaAplicacao(null);
    setAtividadeParaAplicar(null);
  }

  async function aplicarAtividadeEmTurma(idTurma: number) {
    if (!atividadeParaAplicar) return;
    try {
      const res = await fetch("/api/aplicaratividade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idAtividade: atividadeParaAplicar.idAtividade,
          idTurma,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Atividade "${atividadeParaAplicar.titulo}" aplicada com sucesso na turma!`
        );
        if (turmaSelecionada && turmaSelecionada.idTurma === idTurma) {
          fetchAtividadesTurma(idTurma);
        }
        fetchTurmas();
      } else {
        alert(data.error || "Erro ao aplicar atividade.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de rede ao aplicar atividade.");
    } finally {
      setModalAplicarAberto(false);
      setConfirmApplyModalOpen(false);
      setAtividadeParaAplicar(null);
      setTurmaSelecionadaParaAplicacao(null);
    }
  }

  const router = useRouter();

  return (
    <div className={styles.paginaAlunoBody}>
      <aside className={styles.paginaAlunoAside}>
        <div className={styles.logoContainer}>
          <img
            className={styles.logoImg}
            src="/images/Logopng.png"
            alt="Logo Codemind"
          />
        </div>
        <h2>Minhas Turmas</h2>
        {loadingTurmas ? (
          <p style={{ color: "#fff" }}>Carregando turmas...</p>
        ) : turmas.length === 0 ? (
          <p style={{ color: "#fff" }}>Nenhuma turma cadastrada.</p>
        ) : (
          turmas.map((turma) => (
            <button
              key={turma.idTurma}
              className={`${styles.turmaBtn} ${
                turmaSelecionada?.idTurma === turma.idTurma
                  ? styles.turmaBtnActive
                  : ""
              }`}
              onClick={() => selecionarTurmaById(turma.idTurma)}
            >
              {turma.nome}
            </button>
          ))
        )}
        <button className={styles.criarBtn} onClick={abrirModalTurma}>
          Criar Turma
        </button>
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades
            <span className={styles.headerTitleSpan}>
              :{" "}
              {turmaSelecionada
                ? turmaSelecionada.nome
                : "Nenhuma turma selecionada"}
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
                <span className={styles.userName}>{professorNome}</span>
                <span className={styles.userEmail}>{professorEmail}</span>
              </div>
            </div>
            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
            >
              <h3>Detalhes do Professor</h3>
              <p>
                <strong>Nome:</strong> {professorNome}
              </p>
              <p>
                <strong>Email:</strong> {professorEmail}
              </p>
              <p>
                <button onClick={() => router.push("/loginprofessor")}>
                  Sair
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* CENTRAL - LISTAGEM DE ATIVIDADES */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            width: "100%",
          }}
        >
          {/* Se uma atividade estiver selecionada, exibe o detalhe central */}
          {atividadeDetalhe ? (
            <div
              className={styles.card}
              style={{
                width: "100%",
                maxWidth: 760,
                background: "#26263b",
                color: "#fff",
                padding: 28,
                borderRadius: 12,
              }}
            >
              <h2 style={{ marginBottom: 12 }}>{atividadeDetalhe.titulo}</h2>
              <p style={{ color: "#cfcfcf", marginBottom: 18 }}>
                {atividadeDetalhe.descricao ||
                  "Sem descrição fornecida para esta atividade."}
              </p>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => abrirModalAplicar(atividadeDetalhe)}
                  className={styles.btn}
                  style={{
                    background: "#00bcd4",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Aplicar Atividade
                </button>

                <button
                  onClick={voltarParaLista}
                  className={styles.btn}
                  style={{
                    background: "#b71c1c",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            // Lista principal - todas as atividades criadas pelo admin (SEM botões na lista)
            <>
              <h2 style={{ color: "#fff", margin: "20px 0" }}>
                Atividades disponíveis para aplicar
              </h2>
              {loadingAtividades ? (
                <p style={{ color: "#fff" }}>Carregando atividades...</p>
              ) : atividades.length === 0 ? (
                <p style={{ color: "#fff" }}>Nenhuma atividade cadastrada.</p>
              ) : (
                <ul style={{ width: "100%", maxWidth: 760, padding: 0 }}>
                  {atividades.map((atividade) => (
                    <li
                      key={atividade.idAtividade}
                      className={styles.card}
                      onClick={() => mostrarDetalheAtividade(atividade)}
                      style={{
                        listStyle: "none",
                        marginBottom: 18,
                        background: "#3a3360",
                        color: "#fff",
                        padding: 18,
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      aria-label={`Atividade ${atividade.titulo}`}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{atividade.titulo}</strong>
                        <br />
                        <span style={{ color: "#d1cde6" }}>
                          {atividade.descricao
                            ? atividade.descricao.substring(0, 140) +
                              (atividade.descricao.length > 140 ? "..." : "")
                            : "Sem descrição."}
                        </span>
                      </div>

                      {/* Removed quick action buttons from the list cards as requested.
                          The only action on the card now is clicking the card to open the detail view. */}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Modal para aplicar atividade em turma (seleção de turma) */}
        {modalAplicarAberto && atividadeParaAplicar && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Aplicar "{atividadeParaAplicar.titulo}" em qual turma?</h2>
              {turmas.length === 0 && <p>Nenhuma turma disponível.</p>}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {turmas.map((turma) => (
                  <button
                    key={turma.idTurma}
                    onClick={() => selecionarTurmaParaAplicar(turma)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: "#3a3360",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.06)",
                      textAlign: "left",
                    }}
                  >
                    {turma.nome}
                  </button>
                ))}
                <button onClick={fecharModalAplicar} style={{ marginTop: 12 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação - aparece após o usuário selecionar a turma */}
        {confirmApplyModalOpen &&
          atividadeParaAplicar &&
          turmaSelecionadaParaAplicacao && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Confirmar aplicação</h3>
                <p>
                  Deseja realmente aplicar a atividade{" "}
                  <strong>"{atividadeParaAplicar.titulo}"</strong> na turma{" "}
                  <strong>{turmaSelecionadaParaAplicacao.nome}</strong>?
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={confirmarEAplicar}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#00bcd4",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Sim, aplicar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmApplyModalOpen(false);
                      setTurmaSelecionadaParaAplicacao(null);
                      // mantemos a atividade para caso o professor queira reabrir seleção
                      setAtividadeParaAplicar(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#b71c1c",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Modal de criação de turma adaptado */}
        <div
          className={`${styles.modal} ${
            modalTurmaAberto ? styles.modalActive : ""
          }`}
        >
          <div className={styles.modalContent}>
            <h2>Criar Nova Turma</h2>
            <input
              type="text"
              placeholder="Nome da turma"
              value={nomeTurma}
              onChange={(e) => setNomeTurma(e.target.value)}
              className={styles.input}
            />
            <div>
              <h3>Alunos da Turma</h3>
              {alunos.length === 0 && <p>Nenhum aluno registrado.</p>}
              {alunos.map((aluno, idx) => (
                <div key={idx} className={styles.alunoItem}>
                  <span>
                    <strong>{aluno.nome}</strong> ({aluno.email})
                  </span>
                  <button
                    className={styles.btnRemoverAluno}
                    onClick={() => removerAluno(idx)}
                  >
                    Remover
                  </button>
                </div>
              ))}
              {!showAlunoForm && (
                <button
                  className={styles.btnAdicionarAluno}
                  onClick={abrirAlunoForm}
                >
                  Adicionar Aluno
                </button>
              )}
              {showAlunoForm && (
                <form
                  onSubmit={adicionarAluno}
                  className={styles.formAlunoModal}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <input
                    name="nome"
                    type="text"
                    placeholder="Nome do aluno"
                    required
                    value={formAluno.nome}
                    onChange={handleAlunoChange}
                    className={styles.input}
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email do aluno"
                    required
                    value={formAluno.email}
                    onChange={handleAlunoChange}
                    className={styles.input}
                  />
                  <input
                    name="senha"
                    type="password"
                    placeholder="Senha"
                    required
                    value={formAluno.senha}
                    onChange={handleAlunoChange}
                    className={styles.input}
                  />
                  <input
                    name="confirmarSenha"
                    type="password"
                    placeholder="Confirmar Senha"
                    required
                    value={formAluno.confirmarSenha}
                    onChange={handleAlunoChange}
                    className={styles.input}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className={styles.btnAdicionarAluno}
                      style={{ background: "#4caf50", color: "#fff" }}
                    >
                      Salvar Aluno
                    </button>
                    <button
                      type="button"
                      onClick={cancelarAlunoForm}
                      className={styles.btnRemoverAluno}
                      style={{ background: "#b71c1c", color: "#fff" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
            <button
              onClick={criarTurma}
              className={styles.btn}
              style={{ marginTop: 24, background: "#448aff", color: "#fff" }}
            >
              Confirmar
            </button>
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
                {atividadeDetalhe
                  ? atividadeDetalhe.titulo
                  : desempenhoFixo.tituloAtividade}
              </span>
            </h2>
            {(atividadeDetalhe
              ? desempenhoFixo.alunos
              : desempenhoFixo.alunos
            ).map((aluno, idx) => (
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
