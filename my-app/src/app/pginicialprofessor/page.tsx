"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DesempenhoAlunos from "../../components/DesempenhoAlunos";

// Load the MCQ component dynamically (client component)
type PluggedContagemMCQProps = {
  fetchEndpoint: string;
  saveEndpoint: string;
  alunoId?: number | null;
  initialLoad?: boolean;
};
// Use the props generic so Next's dynamic loader signature aligns with the component props
const PluggedContagemMCQ = dynamic<PluggedContagemMCQProps>(
  () =>
    import("../../components/PluggedContagemMCQ").then((mod) => mod.default),
  { ssr: false }
);

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
  isStatic?: boolean;
  source?: string;
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

export default function PageProfessor() {
  // --- estados existentes (preservados) ---
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [professorNome, setProfessorNome] = useState<string>("");
  const [professorEmail, setProfessorEmail] = useState<string>("");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);

  // New: expanded activity id - shows details inline where the activity is listed
  const [expandedAtividadeId, setExpandedAtividadeId] = useState<number | null>(
    null
  );

  // keep atividadeDetalhe for compatibility with modals that reference it
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

  const [correcaoModalAberto, setCorrecaoModalAberto] = useState(false);
  const [respostaParaCorrigir, setRespostaParaCorrigir] =
    useState<RespostaResumo | null>(null);
  const [notaCorrecao, setNotaCorrecao] = useState<number | "">("");
  const [feedbackCorrecao, setFeedbackCorrecao] = useState<string>("");
  const [isSubmittingCorrecao, setIsSubmittingCorrecao] = useState(false);

  const router = useRouter();

  // studentId (optional) read from localStorage so we can send to save endpoint
  const [studentId, setStudentId] = useState<number | null>(null);
  useEffect(() => {
    const idAluno = localStorage.getItem("idAluno");
    if (idAluno) setStudentId(Number(idAluno));
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
            isStatic: item.isStatic,
            source: item.source,
            arquivos: item.atividade?.arquivos ?? item.arquivos ?? [],
          };
          return {
            idAtividade: Number(at.idAtividade),
            titulo: at.titulo,
            descricao: at.descricao,
            tipo: at.tipo,
            nota: at.nota,
            isStatic: at.isStatic,
            source: at.source,
            arquivos: at.arquivos ?? [],
          } as Atividade;
        } else {
          return {
            idAtividade: Number(item.idAtividade),
            titulo: item.titulo,
            descricao: item.descricao,
            tipo: item.tipo,
            nota: item.nota,
            isStatic: item.isStatic,
            source: item.source,
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
    // collapse expanded activity when switching turma
    setExpandedAtividadeId(null);
    setAtividadeDetalhe(null);
    setRespostas([]); // limpa respostas quando troca turma
  }

  // Toggle expand/collapse inline
  function toggleExpandAtividade(id: number) {
    setExpandedAtividadeId((prev) => (prev === id ? null : id));
    // ensure turmas are loaded so actions inside can work
    if (professorId) fetchTurmas();
    // clear atividadeDetalhe to avoid confusion (we show inline)
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
          `Atividade "${atividadeParaAplicar!.titulo}" aplicada em ${
            sucessos.length
          } turma(s).`
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
        else if (res.ok && data && Array.isArray((data as any).respostas))
          setRespostas((data as any).respostas as RespostaResumo[]);
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
    // keep inline expanded for context
    setExpandedAtividadeId(atividade.idAtividade);
    setAtividadeDetalhe(atividade);
    // o componente DesempenhoAlunos fará as requisições necessárias
    setModalDesempenhoAberto(true);
  }

  function abrirRespostaDetalhe(r: RespostaResumo) {
    setRespostaDetalhe(r);
  }
  function fecharRespostaDetalhe() {
    setRespostaDetalhe(null);
  }

  // --- NOVO: correção inline (modal) ---
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

  // ActivityItem: collapsible card rendered inline and centered width
  function ActivityItem({ atividade }: { atividade: Atividade }) {
    const isExpanded = expandedAtividadeId === atividade.idAtividade;

    const onToggle = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      toggleExpandAtividade(atividade.idAtividade);
    };

    return (
      <li
        key={atividade.idAtividade}
        style={{ listStyle: "none", marginBottom: 18 }}
      >
        <div
          className={styles.card}
          onClick={onToggle}
          style={{
            display: "block",
            background: "#3a3360",
            color: "#fff",
            padding: 18,
            borderRadius: 8,
            cursor: "pointer",
            maxWidth: 960,
            margin: "0 auto",
            boxShadow: isExpanded
              ? "0 30px 60px rgba(0,0,0,0.6)"
              : "0 8px 20px rgba(0,0,0,0.45)",
            transform: isExpanded ? "translateY(-6px)" : "none",
            transition: "all 180ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{atividade.titulo}</strong>
              <div style={{ color: "#d1cde6", marginTop: 6 }}>
                {atividade.descricao
                  ? atividade.descricao.substring(0, 160) +
                    (atividade.descricao.length > 160 ? "…" : "")
                  : "Sem descrição."}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {turmaSelecionada && (
                <button
                  className={styles.btn}
                  onClick={(e) => {
                    e.stopPropagation();
                    aplicarEmTurmaAtualQuick(atividade);
                  }}
                  style={{ background: "#00bcd4", color: "#042027" }}
                >
                  Aplicar
                </button>
              )}

              <button
                className={styles.btn}
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModalAplicar(atividade);
                }}
                style={{ background: "#2196f3", color: "#fff" }}
              >
                Outras
              </button>

              <button
                className={styles.btn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!turmaSelecionada) {
                    alert("Selecione uma turma primeiro.");
                    return;
                  }
                  mostrarDesempenhoParaAtividadeAplicada(atividade);
                }}
                style={{ background: "#4caf50", color: "#fff" }}
              >
                Desempenho
              </button>
            </div>
          </div>

          {isExpanded && (
            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 12,
                color: "#dcd7ee",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* If the activity is a PLUGGED static activity, render the MCQ component inline */}
              {atividade.tipo === "PLUGGED" ? (
                <div>
                  <PluggedContagemMCQ
                    fetchEndpoint="/api/atividades/plugged/contagem-instance"
                    saveEndpoint="/api/respostas/plugged"
                    alunoId={studentId}
                    initialLoad={true}
                  />
                </div>
              ) : (
                <>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {atividade.descricao ?? "Sem descrição disponível."}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <strong>Arquivos</strong>
                    {atividade.arquivos && atividade.arquivos.length > 0 ? (
                      <ul
                        style={{ listStyle: "none", padding: 0, marginTop: 8 }}
                      >
                        {atividade.arquivos.map((a) => (
                          <li
                            key={a.idArquivo}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 0",
                            }}
                          >
                            <span style={{ color: "#fff" }}>
                              {a.url.split("/").pop()}
                            </span>
                            <button
                              className={styles.btn}
                              onClick={(e) => {
                                e.stopPropagation();
                                const finalUrl = a.url.startsWith("http")
                                  ? a.url
                                  : `${window.location.origin}${a.url}`;
                                window.open(
                                  finalUrl,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }}
                              style={{
                                background: "#00bcd4",
                                color: "#042027",
                              }}
                            >
                              Abrir
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: "#bdbdda", marginTop: 8 }}>
                        Nenhum anexo.
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {turmaSelecionada && (
                      <button
                        className={styles.btn}
                        onClick={() => aplicarEmTurmaAtualQuick(atividade)}
                        style={{ background: "#00bcd4", color: "#042027" }}
                      >
                        Aplicar nesta turma ({turmaSelecionada.nome})
                      </button>
                    )}
                    <button
                      className={styles.btn}
                      onClick={() => abrirModalAplicar(atividade)}
                      style={{ background: "#2196f3", color: "#fff" }}
                    >
                      Aplicar em outras turmas
                    </button>
                    <button
                      className={styles.btn}
                      onClick={() => {
                        if (!turmaSelecionada) {
                          alert("Selecione uma turma para ver desempenho.");
                          return;
                        }
                        mostrarDesempenhoParaAtividadeAplicada(atividade);
                      }}
                      style={{ background: "#4caf50", color: "#fff" }}
                    >
                      Ver Desempenho
                    </button>
                    <button
                      className={styles.btn}
                      onClick={() =>
                        router.push(
                          `/professor/atividade/${atividade.idAtividade}`
                        )
                      }
                      style={{ background: "#666", color: "#fff" }}
                    >
                      Abrir página
                    </button>

                    <button
                      className={styles.btnVoltarModal}
                      onClick={() => setExpandedAtividadeId(null)}
                      style={{ marginLeft: "auto" }}
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </li>
    );
  }

  // quick apply function separated to preserve original aplicar logic but provide single-click UX
  async function aplicarEmTurmaAtualQuick(atividade: Atividade) {
    if (!turmaSelecionada) {
      alert("Selecione uma turma primeiro.");
      return;
    }
    setIsApplying(true);
    try {
      const res = await fetch("/api/aplicaratividade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idAtividade: atividade.idAtividade,
          idTurma: turmaSelecionada.idTurma,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || `Erro ao aplicar (${res.status})`);
        return;
      }
      alert(
        `Atividade "${atividade.titulo}" aplicada na turma "${turmaSelecionada.nome}"`
      );
      await fetchAtividadesTurma(turmaSelecionada.idTurma);
    } catch (err) {
      console.error("Erro aplicarNaTurmaAtual:", err);
      alert("Erro ao aplicar atividade.");
    } finally {
      setIsApplying(false);
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

        <button
          className={styles.criarBtn}
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            abrirModalTurma();
          }}
          aria-label="Criar Turma"
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

        <section style={{ padding: 24 }}>
          <h2 style={{ color: "#fff", textAlign: "center", marginBottom: 18 }}>
            {turmaSelecionada
              ? `Atividades aplicadas na turma "${turmaSelecionada.nome}"`
              : "Atividades disponíveis para aplicar"}
          </h2>

          {loadingAtividades ? (
            <p style={{ color: "#fff", textAlign: "center" }}>
              Carregando atividades...
            </p>
          ) : (
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <ul style={{ padding: 0, margin: 0 }}>
                {(turmaSelecionada ? atividadesTurma : atividades).map(
                  (atividade) => (
                    <ActivityItem
                      key={atividade.idAtividade}
                      atividade={atividade}
                    />
                  )
                )}
              </ul>
            </div>
          )}
        </section>

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

        {/* modal criar turma */}
        <div
          className={`${styles.modal} ${
            modalTurmaAberto ? styles.modalActive : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!modalTurmaAberto}
          style={{ display: modalTurmaAberto ? undefined : "none" }}
        >
          {modalTurmaAberto && (
            <div className={styles.modalContent}>
              <h2 style={{ marginBottom: 8 }}>Criar Turma</h2>

              <div style={{ marginTop: 8 }}>
                <label
                  style={{ display: "block", marginBottom: 6, color: "#fff" }}
                >
                  Nome da turma
                </label>
                <input
                  type="text"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#fff" }}>Alunos</strong>
                {alunos.length === 0 ? (
                  <div style={{ color: "#bdbdda", marginTop: 8 }}>
                    Nenhum aluno adicionado.
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                    {alunos.map((a, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ color: "#fff" }}>
                          {a.nome} — {a.email}
                        </span>
                        <button
                          className={styles.btn}
                          onClick={() => removerAluno(i)}
                          style={{ background: "#b71c1c", color: "#fff" }}
                          type="button"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {showAlunoForm ? (
                <form onSubmit={adicionarAluno} style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      name="nome"
                      placeholder="Nome"
                      value={formAluno.nome}
                      onChange={handleAlunoChange}
                      style={{ flex: 1, padding: 8 }}
                    />
                    <input
                      name="email"
                      placeholder="Email"
                      value={formAluno.email}
                      onChange={handleAlunoChange}
                      style={{ flex: 1, padding: 8 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      name="senha"
                      placeholder="Senha"
                      value={formAluno.senha}
                      onChange={handleAlunoChange}
                      style={{ flex: 1, padding: 8 }}
                    />
                    <input
                      name="confirmarSenha"
                      placeholder="Confirmar senha"
                      value={formAluno.confirmarSenha}
                      onChange={handleAlunoChange}
                      style={{ flex: 1, padding: 8 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className={styles.btn}
                      style={{ background: "#00bcd4" }}
                    >
                      Adicionar aluno
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={cancelarAlunoForm}
                      style={{ background: "#b71c1c" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={abrirAlunoForm}
                    style={{ background: "#2196f3", color: "#fff" }}
                  >
                    Adicionar aluno
                  </button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className={styles.btn}
                  onClick={criarTurma}
                  disabled={isCreatingTurma}
                  style={{ background: "#4caf50", color: "#fff" }}
                >
                  {isCreatingTurma ? "Criando..." : "Criar Turma"}
                </button>
                <button
                  type="button"
                  className={styles.btnVoltarModal}
                  onClick={fecharModalTurma}
                  style={{ background: "#b71c1c" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* restante dos modals (respostaDetalhe, correcao, desempenho) permanecem iguais (preservados) */}
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
                    /* opcional */
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
                  onClick={() => setCorrecaoModalAberto(false)}
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

        <div
          className={`${styles.modal} ${
            modalDesempenhoAberto ? styles.modalActive : ""
          }`}
        >
          <div
            className={`${styles.modalContent} ${styles.desempenhoModalContent}`}
          >
            <h2>Desempenho da Turma na Atividade</h2>
            <div style={{ marginTop: 12 }}>
              <strong>Turma:</strong> {turmaSelecionada?.nome ?? "—"}
            </div>
            <div style={{ marginTop: 12 }}>
              {turmaSelecionada ? (
                <DesempenhoAlunos
                  turmaId={turmaSelecionada.idTurma}
                  atividadeId={atividadeDetalhe?.idAtividade ?? null}
                />
              ) : (
                <p>Selecione uma turma para ver desempenho.</p>
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
      </main>
    </div>
  );
}
