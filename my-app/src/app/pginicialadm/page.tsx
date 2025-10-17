"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./page.module.css";

// Painel do Administrador - Professores CRUD + Atividades CRUD (PLUGGED/UNPLUGGED)
export default function PainelAdm() {
  const [professores, setProfessores] = useState([]);
  const [funcaoSelecionada, setFuncaoSelecionada] = useState<string | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [editingProfessor, setEditingProfessor] = useState<null | {
    idProfessor: number;
    nome: string;
    email: string;
  }>(null);
  const [editFormData, setEditFormData] = useState({
    nome: "",
    senha: "",
    confirmarSenha: "",
  });
  const [popupAberto, setPopupAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  // Atividades
  const [atividades, setAtividades] = useState([]);
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [formAtividade, setFormAtividade] = useState({
    titulo: "",
    descricao: "",
    tipo: "PLUGGED",
    nota: 10,
    script: "",
    linguagem: "",
  });
  const [arquivos, setArquivos] = useState<File[]>([]);

  // Buscar professores quando abrir painel ou fechar formulário
  useEffect(() => {
    if (funcaoSelecionada === "Professores") {
      fetchProfessores();
    }
  }, [funcaoSelecionada, showForm, editingProfessor]);

  async function fetchProfessores() {
    setLoading(true);
    try {
      const res = await fetch("/api/professor");
      const data = await res.json();
      setProfessores(data);
    } catch {
      setProfessores([]);
    }
    setLoading(false);
  }

  // Buscar atividades quando abrir painel de atividades
  useEffect(() => {
    if (funcaoSelecionada === "Atividades") {
      fetchAtividades();
    }
  }, [funcaoSelecionada]);

  async function fetchAtividades() {
    setLoadingAtividades(true);
    try {
      const res = await fetch("/api/atividade");
      const data = await res.json();
      if (res.ok) setAtividades(data);
      else setAtividades([]);
    } catch {
      setAtividades([]);
    }
    setLoadingAtividades(false);
  }

  function selecionarFuncao(funcao: string) {
    setFuncaoSelecionada(funcao);
    setShowForm(false);
    setEditingProfessor(null);
  }

  function voltarMenu() {
    setFuncaoSelecionada(null);
    setShowForm(false);
    setEditingProfessor(null);
  }

  function toggleUserPopup() {
    setPopupAberto((prev) => !prev);
  }

  // EDITAR PROFESSOR
  function handleEditar(prof: {
    idProfessor: number;
    nome: string;
    email: string;
  }) {
    setEditingProfessor(prof);
    setEditFormData({
      nome: prof.nome,
      senha: "",
      confirmarSenha: "",
    });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editFormData.senha !== editFormData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    const res = await fetch("/api/professor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idProfessor: editingProfessor?.idProfessor,
        nome: editFormData.nome,
        senha: editFormData.senha,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Professor atualizado!");
      setEditingProfessor(null);
      await fetchProfessores();
    } else {
      alert(data.error || "Erro ao atualizar professor.");
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;
    const res = await fetch("/api/professor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idProfessor: id }),
    });
    if (res.ok) {
      await fetchProfessores();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir professor.");
    }
  }

  function handleShowForm() {
    setShowForm(true);
    setFormData({ nome: "", email: "", senha: "", confirmarSenha: "" });
    setEditingProfessor(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    const res = await fetch("/api/professor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Professor criado!");
      setShowForm(false);
      await fetchProfessores();
    } else {
      alert(data.error || "Erro ao criar professor.");
    }
  }

  function handleFormAtividadeChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setFormAtividade({ ...formAtividade, [e.target.name]: e.target.value });
  }

  function handleArquivosChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
    }
  }

  async function handleFormAtividadeSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    // 1. Cria a atividade
    const res = await fetch("/api/atividade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: formAtividade.titulo,
        descricao: formAtividade.descricao,
        tipo: formAtividade.tipo,
        nota: formAtividade.nota,
        script: formAtividade.tipo === "PLUGGED" ? formAtividade.script : null,
        linguagem:
          formAtividade.tipo === "PLUGGED" && formAtividade.linguagem
            ? formAtividade.linguagem
            : null,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      // 2. Se for UNPLUGGED, faz upload dos arquivos
      if (formAtividade.tipo === "UNPLUGGED" && arquivos.length > 0) {
        const formDataUpload = new FormData();
        arquivos.forEach((file) => formDataUpload.append("arquivos", file));
        formDataUpload.append("atividadeId", data.idAtividade);

        await fetch("/api/upload-arquivos-atividade", {
          method: "POST",
          body: formDataUpload,
        });
      }
      alert("Atividade criada!");
      setFormAtividade({
        titulo: "",
        descricao: "",
        tipo: "PLUGGED",
        nota: 10,
        script: "",
        linguagem: "",
      });
      setArquivos([]);
      fetchAtividades();
    } else {
      alert(data.error || "Erro ao criar atividade.");
    }
  }

  return (
    <div className={styles.paginaAlunoBody}>
      {/* Sidebar */}
      <aside className={styles.paginaAlunoAside}>
        <div className={styles.logoContainer}>
          <img
            className={styles.logoImg}
            src="/images/Logopng.png"
            alt="Logo Codemind"
          />
        </div>
        <h2>Minhas Funções</h2>
        <button
          className={`${styles.turmaBtn} ${
            funcaoSelecionada === "Professores" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarFuncao("Professores")}
        >
          Professores
        </button>
        <button
          className={`${styles.turmaBtn} ${
            funcaoSelecionada === "Atividades" ? styles.turmaBtnActive : ""
          }`}
          onClick={() => selecionarFuncao("Atividades")}
        >
          Atividades
        </button>
      </aside>

      {/* Main */}
      <main className={styles.paginaAlunoMain}>
        {/* Header */}
        <div className={styles.header}>
          <h1>
            ADM: <span className={styles.headerTitleSpan}>Funções do ADM</span>
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
                <span className={styles.userName}>ADM</span>
                <span className={styles.userEmail}>adm@exemplo.com</span>
              </div>
            </div>
            <div
              className={`${styles.userPopup} ${
                popupAberto ? styles.userPopupActive : ""
              }`}
            >
              <h3>Detalhes do ADM</h3>
              <p>
                <strong>Nome:</strong> ADM
              </p>
              <p>
                <strong>Email:</strong> adm@exemplo.com
              </p>
              <p>
                <strong>ID:</strong> A001
              </p>
              <button onClick={() => alert("Gerenciar conta clicado!")}>
                Gerenciar Conta
              </button>
              <button onClick={() => alert("Sair clicado!")}>Sair</button>
            </div>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        {!funcaoSelecionada && (
          <div style={{ margin: "auto", color: "#fff", fontSize: "1.3rem" }}>
            <h2>Selecione uma Função</h2>
          </div>
        )}

        {/* Listagem de Professores */}
        {funcaoSelecionada === "Professores" &&
          !showForm &&
          !editingProfessor && (
            <div className={styles.card}>
              <h2>Professores</h2>
              {loading ? (
                <p>Carregando...</p>
              ) : (
                <div>
                  {professores.length === 0 && (
                    <p>Nenhum professor cadastrado.</p>
                  )}
                  {professores.map((prof: any) => (
                    <div
                      key={prof.idProfessor}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#2b1544",
                        borderRadius: 8,
                        marginBottom: 10,
                        padding: "10px 18px",
                      }}
                    >
                      <span>{prof.nome}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className={styles.turmaBtn}
                          style={{
                            background: "#00bcd4",
                            color: "#fff",
                            borderColor: "#00bcd4",
                          }}
                          onClick={() => handleEditar(prof)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.turmaBtn}
                          style={{
                            background: "#b71c1c",
                            color: "#fff",
                            borderColor: "#b71c1c",
                          }}
                          onClick={() => handleExcluir(prof.idProfessor)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
                <button
                  style={{ background: "#4caf50", color: "#fff" }}
                  className={styles.btn}
                  onClick={handleShowForm}
                >
                  Criar Professor
                </button>
                <button className={styles.btn} onClick={voltarMenu}>
                  Voltar
                </button>
              </div>
            </div>
          )}

        {/* Formulário de Criação */}
        {funcaoSelecionada === "Professores" && showForm && (
          <div className={styles.card}>
            <h2>Criar Professor</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <input
                name="nome"
                type="text"
                placeholder="Nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className={styles.input}
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
              />
              <input
                name="senha"
                type="password"
                placeholder="Senha"
                required
                value={formData.senha}
                onChange={handleChange}
                className={styles.input}
              />
              <input
                name="confirmarSenha"
                type="password"
                placeholder="Confirmar Senha"
                required
                value={formData.confirmarSenha}
                onChange={handleChange}
                className={styles.input}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  type="submit"
                  style={{ background: "#4caf50" }}
                  className={styles.btn}
                >
                  Criar Professor
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.btn}
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulário de Edição */}
        {funcaoSelecionada === "Professores" && editingProfessor && (
          <div className={styles.card}>
            <h2>Editar Professor</h2>
            <form
              onSubmit={handleEditSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <input
                name="nome"
                type="text"
                placeholder="Nome"
                required
                value={editFormData.nome}
                onChange={handleEditChange}
                className={styles.input}
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={editingProfessor.email}
                disabled
                className={styles.input}
                style={{ backgroundColor: "#eee", color: "#999" }}
              />
              <input
                name="senha"
                type="password"
                placeholder="Nova Senha"
                required
                value={editFormData.senha}
                onChange={handleEditChange}
                className={styles.input}
              />
              <input
                name="confirmarSenha"
                type="password"
                placeholder="Confirmar Nova Senha"
                required
                value={editFormData.confirmarSenha}
                onChange={handleEditChange}
                className={styles.input}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  type="submit"
                  style={{ background: "#2196f3" }}
                  className={styles.btn}
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfessor(null)}
                  className={styles.btn}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Painel de Atividades CRUD */}
        {funcaoSelecionada === "Atividades" && (
          <div className={styles.card}>
            <h2>Criar Nova Atividade</h2>
            <form
              onSubmit={handleFormAtividadeSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
              encType={
                formAtividade.tipo === "UNPLUGGED"
                  ? "multipart/form-data"
                  : "application/json"
              }
            >
              <input
                name="titulo"
                type="text"
                placeholder="Título"
                required
                value={formAtividade.titulo}
                onChange={handleFormAtividadeChange}
                className={styles.input}
              />
              <textarea
                name="descricao"
                placeholder="Descrição"
                required
                value={formAtividade.descricao}
                onChange={handleFormAtividadeChange}
                className={styles.input}
              />
              <select
                name="tipo"
                value={formAtividade.tipo}
                onChange={handleFormAtividadeChange}
                className={styles.input}
              >
                <option value="PLUGGED">Plugged</option>
                <option value="UNPLUGGED">Unplugged</option>
              </select>
              <input
                name="nota"
                type="number"
                min={0}
                max={100}
                required
                value={formAtividade.nota}
                onChange={handleFormAtividadeChange}
                className={styles.input}
              />

              {/* Se for PLUGGED, aparece o campo de script e linguagem */}
              {formAtividade.tipo === "PLUGGED" && (
                <>
                  <textarea
                    name="script"
                    placeholder="Script da atividade (código)"
                    required
                    value={formAtividade.script}
                    onChange={handleFormAtividadeChange}
                    className={styles.input}
                  />
                  <input
                    name="linguagem"
                    type="text"
                    placeholder="Linguagem (ex: python, javascript)"
                    required
                    value={formAtividade.linguagem}
                    onChange={handleFormAtividadeChange}
                    className={styles.input}
                  />
                </>
              )}

              {/* Se for UNPLUGGED, aparece o campo de upload */}
              {formAtividade.tipo === "UNPLUGGED" && (
                <>
                  <label>
                    Anexar arquivos (imagens ou PDFs):
                    <input
                      type="file"
                      name="arquivos"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleArquivosChange}
                      className={styles.input}
                    />
                  </label>
                  {arquivos.length > 0 && (
                    <ul>
                      {arquivos.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              <button
                type="submit"
                style={{ background: "#4caf50", color: "#fff" }}
                className={styles.btn}
              >
                Criar Atividade
              </button>
            </form>
            <hr />
            <h2>Atividades Criadas</h2>
            {loadingAtividades ? (
              <p>Carregando atividades...</p>
            ) : (
              <ul>
                {atividades.length === 0 && (
                  <li>Nenhuma atividade cadastrada.</li>
                )}
                {atividades.map((a: any) => (
                  <li key={a.idAtividade}>
                    <strong>{a.titulo}</strong> ({a.tipo}) - Nota: {a.nota}
                    <br />
                    {a.descricao}
                  </li>
                ))}
              </ul>
            )}
            <button className={styles.btn} onClick={voltarMenu}>
              Voltar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
