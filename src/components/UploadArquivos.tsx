"use client";
import React, { useState } from "react";

export default function UploadArquivos({
  atividadeId,
}: {
  atividadeId: number;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files));
  }

  async function handleUpload() {
    if (!atividadeId) return alert("atividadeId necessário");
    if (files.length === 0) return alert("Selecione arquivos");

    const fd = new FormData();
    files.forEach((f) => fd.append("arquivos", f));
    fd.append("atividadeId", String(atividadeId));

    setLoading(true);
    try {
      const res = await fetch("/api/upload-arquivos-atividade", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setResult(data);
      if (!res.ok) {
        alert(data?.error || "Erro no upload");
      } else {
        alert(`Upload finalizado: ${data.uploaded} arquivos`);
      }
    } catch (err) {
      console.error("Erro upload cliente:", err);
      alert("Erro de rede no upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={handleChange}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Enviando..." : "Enviar Arquivos"}
      </button>
      {result && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
