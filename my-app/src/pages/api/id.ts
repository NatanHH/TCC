import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import fs from "fs";
import path from "path";

/**
 * GET /api/attachments/:id
 * - Demo auth: header x-professor-id (substitua pela sua sessão)
 * - Lê arquivo em UPLOADS_ROOT (ou ./uploads) e faz stream com Content-Disposition
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query;
  const idArquivo = Number(id);
  if (!idArquivo) return res.status(400).json({ error: "id inválido" });

  // autenticação demo (troque por next-auth / JWT / cookie)
  const professorIdHeader = (req.headers["x-professor-id"] ||
    req.headers["x-professor_id"]) as string | undefined;
  const professorId = professorIdHeader ? Number(professorIdHeader) : null;
  if (!professorId)
    return res.status(401).json({
      error: "autenticação necessária (demo: enviar header x-professor-id)",
    });

  // buscar metadados do anexo
  const arquivo = await prisma.atividadeArquivo.findUnique({
    where: { idArquivo },
    include: { atividade: true },
  });
  if (!arquivo)
    return res.status(404).json({ error: "Arquivo não encontrado" });

  // autorização mínima: (1) professor criador, (2) vínculo AtividadeProfessor, (3) professor dono da turma aplicada
  const atividade = arquivo.atividade;
  let autorizado = false;
  if (atividade.professorId && atividade.professorId === professorId)
    autorizado = true;

  if (!autorizado) {
    const vinc = await (prisma as any).atividadeProfessor
      .findUnique({
        where: {
          idAtividade_idProfessor: {
            idAtividade: atividade.idAtividade,
            idProfessor: professorId,
          },
        },
      })
      .catch(() => null);
    if (vinc) autorizado = true;
  }

  if (!autorizado) {
    const aplicacao = await prisma.atividadeTurma.findFirst({
      where: { idAtividade: atividade.idAtividade },
      include: { turma: true },
    });
    if (aplicacao && aplicacao.turma.professorId === professorId)
      autorizado = true;
  }

  if (!autorizado) return res.status(403).json({ error: "Acesso negado" });

  // localizar arquivo no filesystem
  const uploadsRoot =
    process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");
  let filePath = arquivo.url || "";
  if (!path.isAbsolute(filePath))
    filePath = path.join(uploadsRoot, arquivo.url);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Arquivo físico não encontrado" });

  const stat = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const contentType = arquivo.tipoArquivo || "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(filename)}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.on("error", (err) => {
    console.error("Erro streaming arquivo:", err);
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  stream.pipe(res);
}
