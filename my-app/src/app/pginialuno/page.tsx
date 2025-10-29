"use client";
import React, { JSX, useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ClientOnlyText from "../../components/ClientOnlyText";

// Dynamically load the plugged MCQ component (client-only)
type PluggedContagemMCQProps = {
  fetchEndpoint?: string;
  saveEndpoint?: string;
  alunoId?: number | null;
  initialLoad?: boolean;
  autoSave?: boolean;
  atividadeId?: number | null;
  turmaId?: number | null;
};
const PluggedContagemMCQ = dynamic<PluggedContagemMCQProps>(
  () => import("../../components/PluggedContagemMCQ").then((m) => m.default),
  { ssr: false }
);

type ArquivoResumo = {
  idArquivo: number;
  url: string;
  tipoArquivo?: string | null;
  nomeArquivo?: string | null;
};

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
  arquivos?: ArquivoResumo[];
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

export default function Page(): JSX.Element {
  const [atividades, setAtividades] = useState<AtividadeResumo[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] =
    useState<AtividadeResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupAberto, setPopupAberto] = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState<boolean>(false);

  // Estados para informação do aluno
  // lazy read from localStorage so values appear immediately on first render if present
  const [alunoId, setAlunoId] = useState<number | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const v = localStorage.getItem("idAluno");
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });
  const [alunoNome, setAlunoNome] = useState<string>(() => {
    try {
      if (typeof window === "undefined") return "";
      return localStorage.getItem("alunoNome") ?? "";
    } catch {
      return "";
    }
  });
  const [alunoEmail, setAlunoEmail] = useState<string>(() => {
    try {
      if (typeof window === "undefined") return "";
      return localStorage.getItem("alunoEmail") ?? "";
    } catch {
      return "";
    }
  });

  // --- Novos estados para o formulário de resolução (mesma página) ---
  const [resolverAberto, setResolverAberto] = useState<boolean>(false);
  const [respostaTexto, setRespostaTexto] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();

  // Estado para a resposta do aluno (nota + feedback) mostrada no modal de desempenho
  const [minhaResposta, setMinhaResposta] = useState<RespostaResumo | null>(
    null
  );
  const [loadingMinhaResposta, setLoadingMinhaResposta] = useState(false);

  // Keep local state in sync with storage if something else sets it later
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAlunoFromStorage = () => {
      try {
        const id = localStorage.getItem("idAluno");
        const nome = localStorage.getItem("alunoNome");
        const email = localStorage.getItem("alunoEmail");
        setAlunoId(id ? Number(id) : null);
        setAlunoNome(nome ?? "");
        setAlunoEmail(email ?? "");
      } catch {
        /* ignore */
      }
    };

    // initial sync
    syncAlunoFromStorage();

    // sync when localStorage changes in other tabs
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key || ev.key.startsWith("aluno")) syncAlunoFromStorage();
    };

    // custom event to sync inside same tab after we update localStorage programmatically
    const onAlunoUpdate = () => syncAlunoFromStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener("alunoUpdate", onAlunoUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("alunoUpdate", onAlunoUpdate as EventListener);
    };
  }, []);

  // Buscar atividades
  useEffect(() => {
    const idFromStore =
      typeof window !== "undefined" ? localStorage.getItem("idAluno") : null;
    const effectiveId = alunoId ?? (idFromStore ? Number(idFromStore) : null);

    if (!effectiveId) {
      setAtividades([]);
      return;
    }

    const ctrl = new AbortController();

    async function doFetch() {
      setLoading(true);
      try {
        const q = encodeURIComponent(String(effectiveId));
        const res = await fetch(`/api/listaratividades?alunoId=${q}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setAtividades([]);
            return;
          }
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${text}`);
        }

        const data = await res.json().catch(() => null);

        if (Array.isArray(data)) {
          setAtividades(data);
        } else if (data && Array.isArray((data as any).atividades)) {
          setAtividades((data as any).atividades);
        } else {
          console.warn("fetchAtividades: resposta inesperada:", data);
          setAtividades([]);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Erro ao buscar atividades:", err);
        setAtividades([]);
      } finally {
        setLoading(false);
      }
    }

    doFetch();
    return () => ctrl.abort();
  }, [alunoId]);

  // UI handlers
  const mostrarDetalhe = useCallback((atividade: AtividadeResumo) => {
    setAtividadeSelecionada(atividade);
  }, []);

  const voltarParaLista = useCallback(() => {
    setAtividadeSelecionada(null);
  }, []);

  const toggleUserPopup = useCallback(async () => {
    const opening = !popupAberto;
    if (opening) {
      try {
        if (typeof window !== "undefined") {
          const sId = localStorage.getItem("idAluno");
          const sNome = localStorage.getItem("alunoNome");
          const sEmail = localStorage.getItem("alunoEmail");
          if (sId && !alunoId) setAlunoId(Number(sId));
          if (sNome && (!alunoNome || alunoNome.length === 0))
            setAlunoNome(sNome);
          if (sEmail && (!alunoEmail || alunoEmail.length === 0))
            setAlunoEmail(sEmail);
        }
      } catch (err) {
        // ignore
      }

      if (
        (!alunoNome ||
          alunoNome.length === 0 ||
          !alunoEmail ||
          alunoEmail.length === 0) &&
        minhaResposta
      ) {
        const a = minhaResposta.aluno;
        if (a) {
          if (!alunoNome || alunoNome.length === 0) setAlunoNome(a.nome ?? "");
          if (!alunoEmail || alunoEmail.length === 0)
            setAlunoEmail(a.email ?? "");
        }
      }

      if (
        !alunoNome ||
        alunoNome.length === 0 ||
        !alunoEmail ||
        alunoEmail.length === 0
      ) {
        try {
          const res = await fetch("/api/aluno/me");
          if (res.ok) {
            const body = await res.json().catch(() => null);
            if (body) {
              if (!alunoNome || alunoNome.length === 0)
                setAlunoNome(body.nome ?? body.name ?? "");
              if (!alunoEmail || alunoEmail.length === 0)
                setAlunoEmail(body.email ?? "");
              try {
                if (typeof window !== "undefined") {
                  if (body.nome) localStorage.setItem("alunoNome", body.nome);
                  if (body.email)
                    localStorage.setItem("alunoEmail", body.email);
                  if (body.idAluno)
                    localStorage.setItem("idAluno", String(body.idAluno));
                }
              } catch {}
            }
          }
        } catch {
          // ignore errors; endpoint might not exist
        }
      }
    }

    setPopupAberto((p) => !p);
  }, [popupAberto, alunoId, alunoNome, alunoEmail, minhaResposta]);

  const fecharModalDesempenho = useCallback(() => {
    setModalAberto(false);
  }, []);

  // Abre o modal/section de resolver atividade (na mesma página)
  function abrirResolver(atividade: AtividadeResumo) {
    setAtividadeSelecionada(atividade);
    setRespostaTexto("");
    setResolverAberto(true);
  }

  function fecharResolver() {
    setResolverAberto(false);
    setRespostaTexto("");
  }

  // abrir anexo (mantido)
  function abrirAnexo(idArquivo?: number, url?: string) {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!idArquivo) {
      alert("Arquivo indisponível.");
      return;
    }
    window.open(
      `/api/attachments/${encodeURIComponent(String(idArquivo))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // envio do formulário inline (mesma página)
  async function handleEnviarResposta(e?: React.FormEvent) {
    try {
      setSubmitting(true);

      const payload = {
        idAtividade: atividadeSelecionada?.idAtividade ?? null,
        idAluno: alunoId ?? null,
        respostaTexto: respostaTexto ?? "",
      };

      const res = await fetch("/api/respostas/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error || `Erro ao enviar resposta (${res.status})`
        );
      }
      alert("Resposta enviada com sucesso!");
      const id = alunoId;
      const q = encodeURIComponent(String(id));
      fetch(`/api/listaratividades?alunoId=${q}`).then(async (r) => {
        try {
          if (r.ok) {
            const d = await r.json().catch(() => null);
            if (Array.isArray(d)) setAtividades(d);
            else if (d && Array.isArray(d.atividades))
              setAtividades(d.atividades);
          }
        } catch {}
      });
      fecharResolver();
      setAtividadeSelecionada(null);
    } catch (err: any) {
      console.error("Erro ao enviar resposta:", err);
      alert(err?.message || "Erro ao enviar resposta.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatarData = useCallback((dataString?: string | null) => {
    if (!dataString) return "";
    try {
      return new Date(dataString).toLocaleDateString("pt-BR");
    } catch {
      return dataString;
    }
  }, []);

  function sairSistema() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("idAluno");
      localStorage.removeItem("alunoNome");
      localStorage.removeItem("alunoEmail");
      window.location.href = "/login";
    }
  }

  async function fetchMinhaRespostaParaAtividade(atividadeId?: number) {
    if (!atividadeId || !alunoId) {
      setMinhaResposta(null);
      return;
    }
    setLoadingMinhaResposta(true);
    try {
      const res = await fetch(
        `/api/respostas?atividadeId=${encodeURIComponent(String(atividadeId))}`
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("fetchMinhaResposta: non-ok", res.status, data);
        setMinhaResposta(null);
        return;
      }
      if (Array.isArray(data)) {
        const found = data.find(
          (r: any) =>
            r.idAluno === alunoId ||
            (r.aluno && Number(r.aluno.idAluno) === Number(alunoId))
        );
        setMinhaResposta(found ?? null);
        if (found?.aluno) {
          if (!alunoNome || alunoNome.length === 0)
            setAlunoNome(found.aluno.nome ?? "");
          if (!alunoEmail || alunoEmail.length === 0)
            setAlunoEmail(found.aluno.email ?? "");
          try {
            if (typeof window !== "undefined") {
              if (found.aluno.nome)
                localStorage.setItem("alunoNome", found.aluno.nome);
              if (found.aluno.email)
                localStorage.setItem("alunoEmail", found.aluno.email);
              if (found.aluno.idAluno)
                localStorage.setItem("idAluno", String(found.aluno.idAluno));
              // notify same-tab listeners to refresh UI
              window.dispatchEvent(new Event("alunoUpdate"));
            }
          } catch {}
        }
      } else if (data && Array.isArray(data.respostas)) {
        const found = data.respostas.find(
          (r: any) =>
            r.idAluno === alunoId ||
            (r.aluno && Number(r.aluno.idAluno) === Number(alunoId))
        );
        setMinhaResposta(found ?? null);
        if (found?.aluno) {
          if (!alunoNome || alunoNome.length === 0)
            setAlunoNome(found.aluno.nome ?? "");
          if (!alunoEmail || alunoEmail.length === 0)
            setAlunoEmail(found.aluno.email ?? "");
          try {
            if (typeof window !== "undefined") {
              if (found.aluno.nome)
                localStorage.setItem("alunoNome", found.aluno.nome);
              if (found.aluno.email)
                localStorage.setItem("alunoEmail", found.aluno.email);
              window.dispatchEvent(new Event("alunoUpdate"));
            }
          } catch {}
        }
      } else {
        setMinhaResposta(null);
      }
    } catch (err) {
      console.error("Erro ao buscar minha resposta:", err);
      setMinhaResposta(null);
    } finally {
      setLoadingMinhaResposta(false);
    }
  }

  async function mostrarDesempenho() {
    if (!atividadeSelecionada) {
      alert("Selecione uma atividade antes de ver o desempenho.");
      return;
    }
    try {
      await fetchMinhaRespostaParaAtividade(atividadeSelecionada.idAtividade);
    } catch (err) {
      console.error("Erro ao buscar desempenho:", err);
      // continua — abrimos o modal para mostrar mensagem apropriada ao usuário
    } finally {
      setModalAberto(true);
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
                <span className={styles.userName}>
                  <ClientOnlyText
                    getText={() =>
                      alunoNome && alunoNome.length > 0
                        ? alunoNome
                        : typeof window !== "undefined"
                        ? localStorage.getItem("alunoNome") ?? "Aluno"
                        : "Aluno"
                    }
                    fallback="Aluno"
                  />
                </span>
                <span className={styles.userEmail}>
                  <ClientOnlyText
                    getText={() =>
                      alunoEmail && alunoEmail.length > 0
                        ? alunoEmail
                        : typeof window !== "undefined"
                        ? localStorage.getItem("alunoEmail") ??
                          "aluno@exemplo.com"
                        : "aluno@exemplo.com"
                    }
                    fallback="aluno@exemplo.com"
                  />
                </span>
              </div>
            </div>
            {/* user popup content uses client-only reads as well */}
            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
              aria-hidden={!popupAberto}
            >
              <h3>Detalhes</h3>
              <p>
                <strong>Nome:</strong>{" "}
                <ClientOnlyText
                  getText={() =>
                    (typeof window !== "undefined"
                      ? localStorage.getItem("alunoNome")
                      : null) ??
                    (alunoNome && alunoNome.length > 0 ? alunoNome : "—")
                  }
                  fallback="—"
                />
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <ClientOnlyText
                  getText={() =>
                    (typeof window !== "undefined"
                      ? localStorage.getItem("alunoEmail")
                      : null) ??
                    (alunoEmail && alunoEmail.length > 0 ? alunoEmail : "—")
                  }
                  fallback="—"
                />
              </p>
              <p>
                <button onClick={sairSistema}>Sair</button>
              </p>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 880, marginTop: 18 }}>
          {loading && <p style={{ color: "#fff" }}>Carregando atividades...</p>}

          {!loading && atividades.length === 0 && !atividadeSelecionada && (
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
                key={`${a.idAtividade}-${a.turma?.idTurma ?? "0"}`}
                className={styles.card}
                style={{ cursor: "pointer" }}
                onClick={() => mostrarDetalhe(a)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") mostrarDetalhe(a);
                }}
                aria-label={`Abrir detalhes da atividade ${a.titulo}`}
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
                    <div style={{ color: "#ff9800" }}>
                      Nota: {typeof a.nota === "number" ? `${a.nota}/10` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Detalhe da atividade selecionada */}
          {atividadeSelecionada && (
            <div className={styles.atividadeDetalhe}>
              <div style={{ marginBottom: 20 }}>
                <h1>{atividadeSelecionada.titulo}</h1>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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
                    Nota:{" "}
                    {typeof atividadeSelecionada.nota === "number"
                      ? `${atividadeSelecionada.nota}/10`
                      : "—"}
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
                    Turma: {atividadeSelecionada.turma?.nome ?? "—"}
                  </span>
                </div>
                {atividadeSelecionada.dataAplicacao && (
                  <div style={{ color: "#bdbdda", marginTop: 6 }}>
                    Aplicada em:{" "}
                    {formatarData(atividadeSelecionada.dataAplicacao)}
                  </div>
                )}
              </div>

              <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
                {atividadeSelecionada.descricao || "Sem descrição disponível."}
              </p>

              {/* If the applied activity is a PLUGGED type, render the interactive plugged component */}
              {atividadeSelecionada.tipo === "PLUGGED" ? (
                <div style={{ marginTop: 12 }}>
                  <PluggedContagemMCQ
                    fetchEndpoint="/api/atividades/plugged/contagem-instance"
                    saveEndpoint="/api/respostas/plugged"
                    alunoId={alunoId}
                    initialLoad={true}
                    autoSave={true}
                    atividadeId={atividadeSelecionada.idAtividade}
                    turmaId={atividadeSelecionada.turma?.idTurma ?? null}
                  />
                  <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                    <button className={styles.btn} onClick={voltarParaLista}>
                      ← Voltar para Lista
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Arquivos/Anexos */}
                  {atividadeSelecionada.arquivos &&
                  atividadeSelecionada.arquivos.length > 0 ? (
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
                              aria-label={`Abrir anexo ${
                                arquivo.nomeArquivo || arquivo.idArquivo
                              }`}
                            >
                              📥 Abrir / Baixar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#bdbdda", marginTop: 8 }}>
                      Nenhum anexo disponível para esta atividade.
                    </div>
                  )}

                  <div
                    className={styles.botoesAtividade}
                    style={{ marginTop: 30 }}
                  >
                    <button
                      className={styles.btnFormulario}
                      onClick={() => abrirResolver(atividadeSelecionada)}
                    >
                      📝 Resolver Atividade
                    </button>

                    <button
                      className={styles.btnVerdesempenho}
                      onClick={() => mostrarDesempenho()}
                    >
                      📊 Ver Meu Desempenho
                    </button>
                    <button className={styles.btn} onClick={voltarParaLista}>
                      ← Voltar para Lista
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal de resolução (mesma página) */}
        <div
          className={`${styles.modal} ${
            resolverAberto ? styles.modalActive : ""
          }`}
        >
          {resolverAberto && atividadeSelecionada && (
            <div className={styles.modalContent}>
              <h2>
                📝 Resolver: <br />
                <span style={{ color: "#00bcd4" }}>
                  {atividadeSelecionada.titulo}
                </span>
              </h2>
              <div style={{ marginTop: 8, color: "#bdbdda" }}>
                <div>
                  <strong>Aluno:</strong>{" "}
                  <ClientOnlyText
                    getText={() =>
                      (typeof window !== "undefined"
                        ? localStorage.getItem("alunoNome")
                        : null) ??
                      (alunoNome && alunoNome.length > 0 ? alunoNome : "—")
                    }
                    fallback="—"
                  />
                </div>
                <div>
                  <strong>Email:</strong>{" "}
                  <ClientOnlyText
                    getText={() =>
                      (typeof window !== "undefined"
                        ? localStorage.getItem("alunoEmail")
                        : null) ??
                      (alunoEmail && alunoEmail.length > 0 ? alunoEmail : "—")
                    }
                    fallback="—"
                  />
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEnviarResposta();
                }}
                style={{ marginTop: 12 }}
              >
                <label style={{ display: "block", marginBottom: 8 }}>
                  Sua resposta
                </label>
                <textarea
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  rows={8}
                  style={{ width: "100%", padding: 8 }}
                />

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.btn}
                    style={{ background: "#00bcd4", color: "#fff" }}
                  >
                    {submitting ? "Enviando..." : "Enviar Resposta"}
                  </button>
                  <button
                    type="button"
                    onClick={fecharResolver}
                    className={styles.btn}
                    style={{ background: "#b71c1c", color: "#fff" }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal de Desempenho (atualizado para mostrar feedback individual) */}
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

            <div style={{ marginTop: 12 }}>
              <strong>Turma:</strong> {atividadeSelecionada?.turma?.nome ?? "—"}
            </div>

            <div style={{ marginTop: 12 }}>
              {loadingMinhaResposta ? (
                <p>Carregando seu desempenho...</p>
              ) : minhaResposta ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ fontWeight: "bold", color: "#fff" }}>
                    {minhaResposta.aluno?.nome ??
                      `Você (ID ${minhaResposta.idAluno})`}
                  </div>

                  <div style={{ color: "#dcd7ee" }}>
                    <strong>Data de envio:</strong>{" "}
                    {minhaResposta.dataAplicacao
                      ? formatarData(minhaResposta.dataAplicacao)
                      : "—"}
                  </div>

                  <div style={{ color: "#dcd7ee" }}>
                    <strong>Nota:</strong>{" "}
                    {typeof minhaResposta.notaObtida === "number"
                      ? `${minhaResposta.notaObtida}/10`
                      : "Ainda não corrigido"}
                  </div>

                  <div>
                    <strong style={{ display: "block", marginBottom: 6 }}>
                      Feedback do professor
                    </strong>
                    <div
                      style={{
                        background: "#2b2745",
                        padding: 12,
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    >
                      {minhaResposta.feedback
                        ? minhaResposta.feedback
                        : "Nenhum feedback foi fornecido ainda."}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className={styles.btn}
                      onClick={() => {
                        setModalAberto(false);
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#bdbdda" }}>
                    Você ainda não enviou resposta para essa atividade ou ela
                    ainda não foi registrada.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className={styles.btn}
                      onClick={() => {
                        setModalAberto(false);
                      }}
                    >
                      Fechar
                    </button>
                    <button
                      className={styles.btnFormulario}
                      onClick={() => {
                        setModalAberto(false);
                        abrirResolver(atividadeSelecionada!);
                      }}
                    >
                      📝 Resolver agora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
