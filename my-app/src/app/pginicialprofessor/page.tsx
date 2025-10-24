"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import React from "react";
import { useRouter } from "next/navigation";

// Tipos
type Arquivo = {
  idArquivo?: number;
  url: string;
  tipoArquivo?: string;
};

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
  arquivos?: Arquivo[]; // ADICIONADO: possíveis arquivos anexados (UNPLUGGED)
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

  // ADICIONAR estes novos estados:
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [isApplying, setIsApplying] = useState(false); // indica se está aplicando (loading)

  // Busca professorId do localStorage, e turmas do professor
  useEffect(() => {
    const id = localStorage.getItem("idProfessor");
    const nome = localStorage.getItem("nomeProfessor");
    const email = localStorage.getItem("emailProfessor");
    if (id) setProfessorId(Number(id));
    if (nome) setProfessorNome(nome);
    if (email) setProfessorEmail(email);
  }, []);

  async function fetchTurmas() {
    if (!professorId) return;

    setLoadingTurmas(true);
    try {
      const res = await fetch(`/api/turma?professorId=${professorId}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // A API retorna array de turmas diretamente
      if (Array.isArray(data)) {
        setTurmas(data);
      } else {
        console.error("Resposta não é um array:", data);
        setTurmas([]);
      }
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  }

  // Chama fetchTurmas quando professorId estiver disponível
  useEffect(() => {
    if (professorId) {
      fetchTurmas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId]);

  useEffect(() => {
    if (!turmaSelecionada) {
      fetchAtividades();
    } else {
      fetchAtividadesTurma(turmaSelecionada.idTurma);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada, professorId]);

  async function fetchAtividades() {
    setLoadingAtividades(true);
    try {
      const res = await fetch(`/api/professores/atividadesprofessor`);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (res.ok) {
        if (Array.isArray(data)) setAtividades(data);
        else if (data && Array.isArray(data.atividades))
          setAtividades(data.atividades);
        else setAtividades([]);
      } else {
        setAtividades([]);
      }
    } catch (err) {
      console.error("Erro fetching atividades:", err);
      setAtividades([]);
    } finally {
      setLoadingAtividades(false);
    }
  }

  async function fetchAtividadesTurma(idTurma: number) {
    setLoadingAtividades(true);
    try {
      const res = await fetch(`/api/atividadesturma?turmaId=${idTurma}`);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (res.ok) {
        if (Array.isArray(data)) setAtividadesTurma(data);
        else if (data && Array.isArray(data.atividades))
          setAtividadesTurma(data.atividades);
        else setAtividadesTurma([]);
      } else {
        setAtividadesTurma([]);
      }
    } catch (err) {
      console.error("Erro fetching atividades da turma:", err);
      setAtividadesTurma([]);
    } finally {
      setLoadingAtividades(false);
    }
  }

  function selecionarTurmaById(idTurma: number) {
    const turma = turmas.find((t) => t.idTurma === idTurma) || null;
    setTurmaSelecionada(turma);
    setAtividadeDetalhe(null);
  }

  function mostrarDetalheAtividade(atividade: Atividade) {
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
  async function abrirModalAplicar(atividade: Atividade) {
    // fetch turmas to ensure we display up-to-date list (and show loading)
    if (professorId) {
      // very small debug helper to see the flow
      console.log(
        "abrirModalAplicar: professorId",
        professorId,
        "atividade",
        atividade?.idAtividade
      );
      await fetchTurmas();
    }
    setAtividadeParaAplicar(atividade);
    setTurmasSelecionadas([]); // limpar seleções
    setConfirmApplyModalOpen(false);
    setModalAplicarAberto(true);
  }
  function fecharModalAplicar() {
    setModalAplicarAberto(false);
    setAtividadeParaAplicar(null);
    setTurmasSelecionadas([]);
    setTurmaSelecionadaParaAplicacao(null);
    setConfirmApplyModalOpen(false);
  }

  // NOVA função para toggle de seleção múltipla
  function toggleTurmaSelection(turmaId: number) {
    setTurmasSelecionadas((prev) =>
      prev.includes(turmaId)
        ? prev.filter((id) => id !== turmaId)
        : [...prev, turmaId]
    );
  }

  // NOVA função para aplicar em múltiplas turmas com debug + loading state
  async function aplicarEmMultiplasTurmas() {
    if (!atividadeParaAplicar) return;

    if (turmasSelecionadas.length === 0) {
      alert("Selecione pelo menos uma turma para aplicar a atividade!");
      return;
    }

    setIsApplying(true);
    try {
      const promessas = turmasSelecionadas.map(async (idTurma) => {
        try {
          const res = await fetch("/api/aplicaratividade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idAtividade: atividadeParaAplicar.idAtividade,
              idTurma,
            }),
          });

          let data: any = null;
          try {
            data = await res.json();
          } catch {
            data = { raw: await res.text().catch(() => "") };
          }

          return { idTurma, ok: res.ok, status: res.status, data };
        } catch (err) {
          return { idTurma, ok: false, err };
        }
      });

      const resultados = await Promise.all(promessas);

      const sucessos = resultados.filter((r) => r.ok);
      const falhas = resultados.filter((r) => !r.ok);

      if (sucessos.length > 0) {
        alert(
          `Atividade "${atividadeParaAplicar.titulo}" aplicada em ${sucessos.length} turma(s).`
        );
      }
      if (falhas.length > 0) {
        const msgs = falhas
          .map((f) => {
            const turma = turmas.find((t) => t.idTurma === f.idTurma);
            const nome = turma?.nome ?? `Turma ${f.idTurma}`;
            const errMsg =
              f.data?.error || (f.err && String(f.err)) || `status ${f.status}`;
            return `${nome}: ${errMsg}`;
          })
          .join("\n");
        alert(`Falhas em ${falhas.length} turma(s):\n${msgs}`);
      }

      // limpar e fechar
      setTurmasSelecionadas([]);
      setModalAplicarAberto(false);
      setAtividadeParaAplicar(null);

      // atualizar dados
      if (
        turmaSelecionada &&
        turmasSelecionadas.includes(turmaSelecionada.idTurma)
      ) {
        fetchAtividadesTurma(turmaSelecionada.idTurma);
      }
      fetchTurmas();
    } finally {
      setIsApplying(false);
    }
  }

  const router = useRouter();

  // --- NOVO: função para abrir o arquivo anexado da atividade (abre em nova aba)
  function openAtividadeArquivo(atividade: Atividade) {
    try {
      const arquivos = atividade.arquivos ?? [];
      if (arquivos.length === 0) {
        alert("Nenhum arquivo anexado para esta atividade.");
        return;
      }
      // abre o primeiro arquivo
      const url = arquivos[0].url;
      const finalUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Erro ao abrir arquivo da atividade:", err);
      alert("Não foi possível abrir o arquivo. Veja o console.");
    }
  }

  // Função para excluir turma
  async function excluirTurma(turmaId: number, nomeTurma: string) {
    const confirmacao = window.confirm(
      `Você tem certeza que deseja excluir a turma "${nomeTurma}"?\n\n` +
        `Esta ação irá:\n` +
        `• Remover todos os alunos desta turma\n` +
        `• Remover todas as atividades aplicadas\n` +
        `• Excluir permanentemente a turma\n\n` +
        `Esta ação NÃO pode ser desfeita!`
    );

    if (!confirmacao) return;

    try {
      const res = await fetch("/api/turma", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Turma "${nomeTurma}" foi excluída com sucesso!`);

        if (turmaSelecionada?.idTurma === turmaId) {
          setTurmaSelecionada(null);
          setAtividadesTurma([]);
        }

        fetchTurmas();
      } else {
        alert(` Erro ao excluir turma: ${data.error}`);
      }
    } catch (err) {
      console.error("Erro ao excluir turma:", err);
      alert(" Erro de conexão ao excluir turma");
    }
  }

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
              <div className={styles.turmaContent}>
                <span className={styles.turmaInfo}>
                  {turma.nome}({turma.alunos?.length || 0} alunos)
                </span>

                <span
                  className={styles.deleteIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    excluirTurma(turma.idTurma, turma.nome);
                  }}
                  title={`Excluir turma "${turma.nome}"`}
                >
                  🗑️
                </span>
              </div>
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
                {/* Novo botão ABRIR - só aparece se atividade for UNPLUGGED e houver arquivos */}
                {atividadeDetalhe.tipo === "UNPLUGGED" &&
                  (atividadeDetalhe.arquivos ?? []).length > 0 && (
                    <button
                      onClick={() => openAtividadeArquivo(atividadeDetalhe)}
                      className={styles.btn}
                      style={{
                        background: "#4caf50",
                        color: "#fff",
                        padding: "8px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      title="Abrir arquivo anexado"
                    >
                      ABRIR
                    </button>
                  )}

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

                      {/* Quick action removed - only detail "Aplicar Atividade" remains */}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Modal para aplicar atividade em turma (seleção de turma) */}
        <div
          className={`${styles.modal} ${
            modalAplicarAberto ? styles.modalActive : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!modalAplicarAberto}
          style={{ display: modalAplicarAberto ? undefined : "none" }}
        >
          {modalAplicarAberto && atividadeParaAplicar && (
            <div className={styles.modalContent}>
              <h2>Aplicar "{atividadeParaAplicar.titulo}" em quais turmas?</h2>

              {loadingTurmas ? (
                <p>Carregando turmas...</p>
              ) : turmas.length === 0 ? (
                <p>Nenhuma turma disponível.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {turmas.map((turma) => {
                    const selected = turmasSelecionadas.includes(turma.idTurma);
                    return (
                      <label
                        key={turma.idTurma}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: selected
                            ? "rgba(0, 188, 212, 0.08)"
                            : "#3a3360",
                          color: "#fff",
                          border: `1px solid ${
                            selected ? "#00bcd4" : "rgba(255,255,255,0.06)"
                          }`,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          name={`turma_${turma.idTurma}`}
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTurmaSelection(turma.idTurma);
                          }}
                          style={{
                            marginRight: 8,
                            cursor: "pointer",
                            accentColor: "#00bcd4",
                          }}
                        />
                        <span style={{ flex: 1 }}>
                          {turma.nome} ({turma.alunos?.length || 0} alunos)
                        </span>
                      </label>
                    );
                  })}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button
                      onClick={() => aplicarEmMultiplasTurmas()}
                      disabled={turmasSelecionadas.length === 0 || isApplying}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        background:
                          turmasSelecionadas.length > 0 && !isApplying
                            ? "#00bcd4"
                            : "#666",
                        color: "#fff",
                        border: "none",
                        cursor:
                          turmasSelecionadas.length > 0 && !isApplying
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          turmasSelecionadas.length > 0 && !isApplying
                            ? 1
                            : 0.6,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isApplying
                        ? "Aplicando..."
                        : `Aplicar em ${turmasSelecionadas.length} turma(s)`}
                    </button>

                    <button
                      onClick={fecharModalAplicar}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        background: "#b71c1c",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                      disabled={isApplying}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                  Acertos:{" "}
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
