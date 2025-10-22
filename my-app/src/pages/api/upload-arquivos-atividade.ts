import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
// Use PrismaClient directly to avoid a missing local import; ensure @prisma/client is installed
import { PrismaClient } from "@prisma/client";

// ensure callable nextConnect regardless of CommonJS/ESM interop
const nc = (nextConnect as any).default ?? (nextConnect as any);

const prisma = (global as any).prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") (global as any).prisma = prisma;

export const config = {
  api: {
    bodyParser: false, // obrigatório para multer
  },
};

// pasta pública para armazenar uploads
const uploadDir = path.join(process.cwd(), "public", "upload");

// garante que a pasta exista
fs.mkdirSync(uploadDir, { recursive: true });

// configura storage do multer
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// fileFilter para validar tipo
function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(null, false); // rejeita mas não quebra todo upload; vamos reportar no handler
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const apiRoute = nc({
  onError(error: unknown, _req: NextApiRequest, res: NextApiResponse) {
    console.error("API upload error:", error);
    res.status(500).json({ error: "Erro interno no upload" });
  },
  onNoMatch(_req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: `Método não permitido` });
  },
}) as any;

// middleware multer: campo 'arquivos' (vários)
apiRoute.use(upload.array("arquivos"));

// handler POST
apiRoute.post(async (req: any, res: NextApiResponse) => {
  try {
    const atividadeId = Number(req.body?.atividadeId ?? req.body?.atividade_id);
    if (!atividadeId || Number.isNaN(atividadeId)) {
      // remover arquivos temporários gravados se inválido (cleanup)
      const filesToRemove = (req.files ?? []).map((f: any) =>
        path.join(uploadDir, f.filename)
      );
      for (const fp of filesToRemove) {
        try {
          fs.unlinkSync(fp);
        } catch {}
      }
      return res
        .status(400)
        .json({ error: "atividadeId é obrigatório e deve ser numérico" });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const created: any[] = [];
    const errors: any[] = [];

    // opcional: verificar se a atividade existe antes de salvar registros
    const atividadeExists = await prisma.atividade.findUnique({
      where: { idAtividade: atividadeId },
    });
    if (!atividadeExists) {
      // cleanup files
      for (const f of files) {
        try {
          fs.unlinkSync(path.join(uploadDir, f.filename));
        } catch {}
      }
      return res.status(400).json({ error: "Atividade não encontrada" });
    }

    for (const f of files) {
      // Multer já aplicou filtro e tamanho; ainda assim checamos
      if (!allowedMimes.includes(f.mimetype)) {
        // remove arquivo rejeitado
        try {
          fs.unlinkSync(f.path);
        } catch {}
        errors.push({
          filename: f.originalname,
          message: "Tipo de arquivo não permitido",
        });
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        try {
          fs.unlinkSync(f.path);
        } catch {}
        errors.push({
          filename: f.originalname,
          message: "Arquivo excede o tamanho máximo (5MB)",
        });
        continue;
      }

      // Se chegou aqui, arquivo válido: criar registro no DB
      const fileUrl = `/upload/${path.basename(f.filename)}`; // URL pública
      try {
        const record = await prisma.atividadeArquivo.create({
          data: {
            url: fileUrl,
            tipoArquivo: f.mimetype,
            atividadeId: atividadeId,
          },
        });
        created.push(record);
      } catch (dbErr: any) {
        console.error("Erro ao gravar DB para arquivo:", f.originalname, dbErr);
        errors.push({
          filename: f.originalname,
          message: "Erro ao salvar no banco",
        });
        // opcional: remover arquivo físico se falhar DB
        try {
          fs.unlinkSync(f.path);
        } catch {}
      }
    }

    if (created.length === 0) {
      return res.status(400).json({ uploaded: 0, arquivos: [], errors });
    }

    return res
      .status(201)
      .json({ uploaded: created.length, arquivos: created, errors });
  } catch (err: any) {
    console.error("Unexpected upload handler error:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default apiRoute;
