import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import prisma from "../../../lib/prisma";

export const config = { api: { bodyParser: false } };

const uploadDir = path.join(process.cwd(), "public", "upload");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

function runMulter(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    (upload.array("arquivos") as any)(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    await runMulter(req, res);

    const body: any = (req as any).body ?? {};
    const atividadeId = Number(
      body.atividadeId || body.atividade_id || body.id
    );
    const replace = body.replace === "true" || body.replace === true;

    if (!atividadeId || Number.isNaN(atividadeId)) {
      // cleanup uploaded files
      for (const f of (req as any).files ?? []) {
        try {
          fs.unlinkSync((f as any).path);
        } catch {}
      }
      return res.status(400).json({ error: "atividadeId inválido" });
    }

    // If replace=true, remove existing files (physical + DB) for this activity
    if (replace) {
      try {
        const existing = await prisma.atividadeArquivo.findMany({
          where: { atividadeId },
        });
        for (const ef of existing) {
          try {
            const filePath = path.join(
              process.cwd(),
              "public",
              ef.url.replace(/^\//, "")
            );
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("Erro apagando arquivo antigo:", e);
          }
        }
        await prisma.atividadeArquivo.deleteMany({ where: { atividadeId } });
      } catch (e) {
        console.warn("Falha ao remover arquivos antigos (continuando):", e);
      }
    }

    const files = (req as any).files as Express.Multer.File[] | undefined;
    const createdFiles: any[] = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const url = `/upload/${path.basename(f.filename)}`;
        const rec = await prisma.atividadeArquivo.create({
          data: {
            url,
            tipoArquivo: f.mimetype,
            atividadeId,
          },
        });
        createdFiles.push(rec);
      }
    }

    return res.status(201).json({ created: createdFiles });
  } catch (err: any) {
    console.error("upload-files error:", err);
    // cleanup physical files if multer saved them
    for (const f of (req as any).files ?? []) {
      try {
        fs.unlinkSync((f as any).path);
      } catch {}
    }
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}
