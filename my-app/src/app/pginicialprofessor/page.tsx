"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import React from "react";
import { useRouter } from "next/navigation";

// Tipos (mantidos)
type Arquivo = { idArquivo?: number; url: string; tipoArquivo?: string };
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
  arquivos?: Arquivo[];
};

type RespostaResumo = {
  idResposta: number;
  idAluno: number;
  aluno?: { idAluno: number; nome: string; email: string } | null;
  respostaTexto?: string | null;
  dataAplicacao?: string | null;
  notaObtida?: number | null;
  feedback?: string | null;
};

const desempenhoFixo = {
  tituloAtividade: "Contagem Binária",
  alunos: [{ nome: "João", acertos: "8/10" }],
};

export default function PageProfessor() {
  // --- estados existentes (preservados) ---
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

  // Novos estados para respostas/desempenho (preservados)
  const [respostas, setRespostas] = useState<RespostaResumo[]>([]);
  const [loadingRespostas, setLoadingRespostas] = useState(false);
  const [respostaDetalhe, setRespostaDetalhe] = useState<RespostaResumo | null>(
    null
  );

  // criar turma
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

  // aplicar atividade
  const [modalAplicarAberto, setModalAplicarAberto] = useState(false);
  const [atividadeParaAplicar, setAtividadeParaAplicar] =
    useState<Atividade | null>(null);

  const [turmaSelecionadaParaAplicacao, setTurmaSelecionadaParaAplicacao] =
    useState<Turma | null>(null);
  const [confirmApplyModalOpen, setConfirmApplyModalOpen] = useState(false);

  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const [isCreatingTurma, setIsCreatingTurma] = useState(false);

  const router = useRouter();

  // preserva a leitura do localStorage
  useEffect(() => {
    const id = localStorage.getItem("idProfessor");
    const nome = localStorage.getItem("nomeProfessor");
    const email = localStorage.getItem("emailProfessor");
    if (id) setProfessorId(Number(id));
    if (nome) setProfessorNome(nome);
    if (email) setProfessorEmail(email);
  }, []);

  // --- funções existentes preservadas (fetchTurmas, fetchAtividades, fetchAtividadesTurma, etc.) ---
  async function fetchTurmas() {
    if (!professorId) return;
    setLoadingTurmas(true);
    try {
      const res = await fetch(`/api/turma?professorId=${professorId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) setTurmas(data);
      else setTurmas([]);
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  }

  useEffect(() => {
    if (professorId) fetchTurmas();
  }, [professorId]);

  useEffect(() => {
    if (!turmaSelecionada) {
      fetchAtividades();
      setAtividadesTurma([]);
    } else {
      fetchAtividadesTurma(turmaSelecionada.idTurma);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada, professorId]);

  async function fetchAtividades() {
    setLoadingAtividades(true);
    try {
      const res = await fetch(`/api/professores/atividadesprofessor`);
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (Array.isArray(data)) setAtividades(data);
        else if (data && Array.isArray(data.atividades))
          setAtividades(data.atividades);
        else setAtividades([]);
      } else setAtividades([]);
    } catch (err) {
      console.error("Erro fetching atividades:", err);
      setAtividades([]);
    } finally {
      setLoadingAtividades(false);
    }
  }

  // fetchAtividadesTurma agora usa /api/atividades/turma
  async function fetchAtividadesTurma(idTurma: number) {
    setLoadingAtividades(true);
    try {
      const res = await fetch(
        `/api/atividades/turma?turmaId=${encodeURIComponent(String(idTurma))}`
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("fetchAtividadesTurma non-ok:", res.status, data);
        setAtividadesTurma([]);
        return;
      }
      let arr = data;
      if (!Array.isArray(arr)) {
        if (data && Array.isArray(data.atividades)) arr = data.atividades;
        else {
          setAtividadesTurma([]);
          return;
        }
      }
      const normalized: Atividade[] = arr.map((item: any) => {
        if (item.atividade || item.idAtividadeTurma) {
          const at = item.atividade ?? {
            idAtividade: item.idAtividade,
            titulo: item.titulo,
            descricao: item.descricao,
            tipo: item.tipo,
            nota: item.nota,
            arquivos: item.atividade?.arquivos ?? item.arquivos ?? [],
          };
          return {
            idAtividade: Number(at.idAtividade),
            titulo: at.titulo,
            descricao: at.descricao,
            tipo: at.tipo,
            nota: at.nota,
            arquivos: at.arquivos ?? [],
          } as Atividade;
        } else {
          return {
            idAtividade: Number(item.idAtividade),
            titulo: item.titulo,
            descricao: item.descricao,
            tipo: item.tipo,
            nota: item.nota,
            arquivos: item.arquivos ?? [],
          } as Atividade;
        }
      });
      setAtividadesTurma(normalized);
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
    setRespostas([]); // limpa respostas quando troca turma
  }

  function mostrarDetalheAtividade(atividade: Atividade) {
    setAtividadeDetalhe(atividade);
  }
  function voltarParaLista() {
    setAtividadeDetalhe(null);
  }
  function toggleUserPopup() {
    setPopupAberto((p) => !p);
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
    setIsCreatingTurma(true);
    try {
      const res = await fetch("/api/turma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeTurma, professorId, alunos }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        alert("Turma criada!");
        fecharModalTurma();
        fetchTurmas();
      } else {
        alert(data?.error || "Erro ao criar turma.");
      }
    } catch (err) {
      console.error("Erro ao criar turma:", err);
      alert("Erro de conexão ao criar turma.");
    } finally {
      setIsCreatingTurma(false);
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

  async function abrirModalAplicar(atividade: Atividade) {
    if (professorId) {
      await fetchTurmas();
    }
    setAtividadeParaAplicar(atividade);
    setTurmasSelecionadas([]);
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

  function toggleTurmaSelection(turmaId: number) {
    setTurmasSelecionadas((prev) =>
      prev.includes(turmaId)
        ? prev.filter((id) => id !== turmaId)
        : [...prev, turmaId]
    );
  }

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
      if (sucessos.length > 0)
        alert(
          `Atividade "${atividadeParaAplicar.titulo}" aplicada em ${sucessos.length} turma(s).`
        );
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
      setTurmasSelecionadas([]);
      setModalAplicarAberto(false);
      setAtividadeParaAplicar(null);
      if (
        turmaSelecionada &&
        turmasSelecionadas.includes(turmaSelecionada.idTurma)
      )
        fetchAtividadesTurma(turmaSelecionada.idTurma);
      fetchTurmas();
    } finally {
      setIsApplying(false);
    }
  }

  // abrirAtividadeArquivo e excluirTurma preservados (mantidos)
  function openAtividadeArquivo(atividade: Atividade) {
    try {
      const arquivos = atividade.arquivos ?? [];
      if (arquivos.length === 0) {
        alert("Nenhum arquivo anexado para esta atividade.");
        return;
      }
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

  async function excluirTurma(turmaId: number, nomeTurma: string) {
    const confirmacao = window.confirm(
      `Você tem certeza que deseja excluir a turma "${nomeTurma}"?\n\nEsta ação irá:\n• Remover todos os alunos desta turma\n• Remover todas as atividades aplicadas\n• Excluir permanentemente a turma\n\nEsta ação NÃO pode ser desfeita!`
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

  // --- NOVO: buscar respostas para a atividade aplicada na turma selecionada (preservado) ---
  const fetchRespostasParaAtividade = useCallback(
    async (idAtividade: number, idTurma?: number) => {
      if (!idAtividade) return;
      setLoadingRespostas(true);
      try {
        const turmaQuery = idTurma
          ? `&turmaId=${encodeURIComponent(String(idTurma))}`
          : "";
        const res = await fetch(
          `/api/respostas?atividadeId=${encodeURIComponent(
            String(idAtividade)
          )}${turmaQuery}`
        );
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data))
          setRespostas(data as RespostaResumo[]);
        else if (res.ok && data && Array.isArray(data.respostas))
          setRespostas(data.respostas as RespostaResumo[]);
        else setRespostas([]);
      } catch (err) {
        console.error("Erro ao buscar respostas:", err);
        setRespostas([]);
      } finally {
        setLoadingRespostas(false);
      }
    },
    []
  );

  async function mostrarDesempenhoParaAtividadeAplicada(atividade: Atividade) {
    if (!turmaSelecionada) {
      alert("Selecione uma turma primeiro.");
      return;
    }
    setAtividadeDetalhe(atividade);
    await fetchRespostasParaAtividade(
      atividade.idAtividade,
      turmaSelecionada.idTurma
    );
    setModalDesempenhoAberto(true);
  }

  function abrirRespostaDetalhe(r: RespostaResumo) {
    setRespostaDetalhe(r);
  }
  function fecharRespostaDetalhe() {
    setRespostaDetalhe(null);
  }

  // --- NOVO: correção inline (modal) ---
  const [correcaoModalAberto, setCorrecaoModalAberto] = useState(false);
  const [respostaParaCorrigir, setRespostaParaCorrigir] =
    useState<RespostaResumo | null>(null);
  const [notaCorrecao, setNotaCorrecao] = useState<number | "">("");
  const [feedbackCorrecao, setFeedbackCorrecao] = useState<string>("");
  const [isSubmittingCorrecao, setIsSubmittingCorrecao] = useState(false);

  function abrirModalCorrecao(resposta: RespostaResumo) {
    setRespostaParaCorrigir(resposta);
    setNotaCorrecao(resposta.notaObtida ?? "");
    setFeedbackCorrecao(resposta.feedback ?? "");
    setCorrecaoModalAberto(true);
  }

  async function enviarCorrecao() {
    if (!respostaParaCorrigir) return;
    // validação simples
    if (
      notaCorrecao !== "" &&
      (Number(notaCorrecao) < 0 || Number(notaCorrecao) > 10)
    ) {
      alert("Nota deve estar entre 0 e 10.");
      return;
    }
    setIsSubmittingCorrecao(true);
    try {
      const payload: any = {};
      if (notaCorrecao !== "") payload.notaObtida = Number(notaCorrecao);
      payload.feedback = feedbackCorrecao ?? null;

      const res = await fetch(
        `/api/respostas/${encodeURIComponent(
          String(respostaParaCorrigir.idResposta)
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || `Erro ao salvar correção (${res.status})`);
        return;
      }
      // Atualiza o estado local de respostas para refletir a correcao imediatamente
      setRespostas((prev) =>
        prev.map((r) =>
          r.idResposta === data.idResposta
            ? { ...r, notaObtida: data.notaObtida, feedback: data.feedback }
            : r
        )
      );
      alert("Correção salva com sucesso.");
      setCorrecaoModalAberto(false);
      // manter modal desempenho aberto para visualização
      // opcional: atualizar lista de respostas recarregando do servidor:
      if (atividadeDetalhe && turmaSelecionada) {
        await fetchRespostasParaAtividade(
          atividadeDetalhe.idAtividade,
          turmaSelecionada.idTurma
        );
      }
    } catch (err) {
      console.error("Erro enviarCorrecao:", err);
      alert("Erro ao enviar correção.");
    } finally {
      setIsSubmittingCorrecao(false);
    }
  }

  function sairSistema() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("idProfessor");
      localStorage.removeItem("nomeProfessor");
      localStorage.removeItem("emailProfessor");
      router.push("/loginprofessor");
    }
  }

  // RENDER (preservei layout e comportamentos)
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
        <button
          className={styles.criarBtn}
          type="button"
          onClick={abrirModalTurma}
        >
          Criar Turma
        </button>
      </aside>

      <main className={styles.paginaAlunoMain}>
        <div className={styles.header}>
          <h1>
            Atividades{" "}
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

        {/* central listagem (preservada) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "60vh",
            width: "100%",
          }}
        >
          {turmaSelecionada ? (
            <>
              <h2 style={{ color: "#fff", margin: "20px 0" }}>
                Atividades aplicadas na turma "{turmaSelecionada.nome}"
              </h2>
              {loadingAtividades ? (
                <p style={{ color: "#fff" }}>
                  Carregando atividades aplicadas...
                </p>
              ) : atividadesTurma.length === 0 ? (
                <p style={{ color: "#fff" }}>
                  Nenhuma atividade aplicada nesta turma.
                </p>
              ) : (
                <ul style={{ width: "100%", maxWidth: 760, padding: 0 }}>
                  {atividadesTurma.map((atividade) => (
                    <li
                      key={atividade.idAtividade}
                      className={styles.card}
                      style={{
                        listStyle: "none",
                        marginBottom: 18,
                        background: "#3a3360",
                        color: "#fff",
                        padding: 18,
                        borderRadius: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className={styles.btn}
                          onClick={() => abrirModalAplicar(atividade)}
                          style={{ background: "#00bcd4", color: "#fff" }}
                        >
                          Aplicar em outras turmas
                        </button>
                        <button
                          className={styles.btn}
                          onClick={() =>
                            mostrarDesempenhoParaAtividadeAplicada(atividade)
                          }
                          style={{ background: "#4caf50", color: "#fff" }}
                        >
                          Ver Desempenho
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
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
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* modal aplicar (preservado) */}
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

        {/* modal criar turma (preservado) */}
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
                  type="button"
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
              type="button"
              onClick={criarTurma}
              className={styles.btn}
              style={{ marginTop: 24, background: "#448aff", color: "#fff" }}
              disabled={isCreatingTurma || !nomeTurma || alunos.length === 0}
            >
              {isCreatingTurma ? "Criando..." : "Confirmar"}
            </button>
          </div>
        </div>

        {/* Modal Desempenho (preservado) */}
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
            <div style={{ marginTop: 12 }}>
              <strong>Turma:</strong> {turmaSelecionada?.nome ?? "—"}
            </div>
            <div style={{ marginTop: 12 }}>
              {loadingRespostas ? (
                <p>Carregando respostas...</p>
              ) : respostas.length === 0 ? (
                <p>Nenhuma resposta registrada ainda.</p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {respostas.map((r) => (
                    <div
                      key={r.idResposta}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 12,
                        background: "#2b2745",
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", color: "#fff" }}>
                          {r.aluno?.nome ?? `Aluno ${r.idAluno}`}
                        </div>
                        <div style={{ color: "#bdbdda", fontSize: "0.9em" }}>
                          {r.aluno?.email ?? ""}
                        </div>
                        <div style={{ marginTop: 6, color: "#dcd7ee" }}>
                          {r.respostaTexto
                            ? r.respostaTexto.length > 120
                              ? r.respostaTexto.substring(0, 120) + "..."
                              : r.respostaTexto
                            : "Sem resposta escrita"}
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: "flex-end",
                        }}
                      >
                        <div>
                          Status:{" "}
                          <strong
                            style={{
                              color:
                                r.notaObtida != null ? "#4caf50" : "#ff9800",
                            }}
                          >
                            {r.notaObtida != null ? "Corrigido" : "Pendente"}
                          </strong>
                        </div>
                        {r.notaObtida != null && (
                          <div>Nota: {r.notaObtida}/10</div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className={styles.btn}
                            onClick={() => abrirRespostaDetalhe(r)}
                          >
                            Ver Resposta
                          </button>
                          {/* agora abre modal de correção inline */}
                          <button
                            className={styles.btn}
                            onClick={() => abrirModalCorrecao(r)}
                          >
                            Corrigir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className={styles.btnVoltarModal}
                onClick={() => setModalDesempenhoAberto(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>

        {/* Modal: detalhe de resposta (preservado) */}
        {respostaDetalhe && (
          <div
            className={`${styles.modal} ${styles.modalActive}`}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalContent}>
              <h3>
                Resposta de{" "}
                {respostaDetalhe.aluno?.nome ?? respostaDetalhe.idAluno}
              </h3>
              <div
                style={{
                  marginTop: 12,
                  color: "#dcd7ee",
                  whiteSpace: "pre-wrap",
                }}
              >
                {respostaDetalhe.respostaTexto ?? "Sem texto enviado."}
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  className={styles.btn}
                  onClick={() => {
                    /* opcional: abrir histórico de feedback */
                  }}
                >
                  Ver histórico / dar feedback
                </button>
                <button
                  className={styles.btnVoltarModal}
                  onClick={fecharRespostaDetalhe}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal de Correcao Inline (NOVO) --- */}
        {correcaoModalAberto && respostaParaCorrigir && (
          <div
            className={`${styles.modal} ${styles.modalActive}`}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalContent}>
              <h3>
                Corrigir resposta —{" "}
                {respostaParaCorrigir.aluno?.nome ??
                  `Aluno ${respostaParaCorrigir.idAluno}`}
              </h3>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Nota (0-10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={notaCorrecao}
                  onChange={(e) =>
                    setNotaCorrecao(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  style={{ width: 120, padding: 8 }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Feedback
                </label>
                <textarea
                  rows={6}
                  value={feedbackCorrecao}
                  onChange={(e) => setFeedbackCorrecao(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  className={styles.btn}
                  onClick={enviarCorrecao}
                  disabled={isSubmittingCorrecao}
                  style={{ background: "#4caf50", color: "#fff" }}
                >
                  {isSubmittingCorrecao ? "Salvando..." : "Salvar correção"}
                </button>
                <button
                  className={styles.btn}
                  onClick={() => {
                    setCorrecaoModalAberto(false);
                  }}
                  style={{ background: "#b71c1c", color: "#fff" }}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btn}
                  onClick={() =>
                    router.push(
                      `/professor/resposta/${respostaParaCorrigir.idResposta}`
                    )
                  }
                  style={{ marginLeft: "auto" }}
                >
                  Abrir página de correção
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
