export function downloadAttachmentOpen(attachmentId: number) {
  // se a autenticação utilizar cookies/session, abrir a url basta
  const url = `/api/attachments/${attachmentId}`;
  window.open(url, "_blank");
}

export async function downloadAttachmentFetch(
  attachmentId: number,
  professorId?: number
) {
  const headers: Record<string, string> = {};
  if (professorId) headers["x-professor-id"] = String(professorId); // apenas para testes
  const res = await fetch(`/api/attachments/${attachmentId}`, { headers });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    alert(json.error || "Erro ao baixar arquivo");
    return;
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  let filename = `anexo-${attachmentId}`;
  const m = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/);
  if (m) filename = decodeURIComponent(m[1]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
