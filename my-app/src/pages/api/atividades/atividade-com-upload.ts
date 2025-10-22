import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
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

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const handler = (nextConnect as any)({
  onError(err: Error, _req: NextApiRequest, res: NextApiResponse) {
    console.error("atividade-com-upload error:", err);
    res.status(500).json({ error: "Erro interno" });
  },
  onNoMatch(_req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Método não permitido" });
  },
});

handler.use(upload.array("arquivos"));

handler.post(async (req: any, res: NextApiResponse) => {
  try {
    const {
      titulo,
      descricao,
      tipo,
      script,
      linguagem,
      alternativas: alternativasCampo,
      correctIndex,
      nota,
    } = req.body;

    if (!titulo || !tipo) {
      for (const f of req.files ?? [])
        try {
          fs.unlinkSync(f.path);
        } catch {}
      return res.status(400).json({ error: "titulo e tipo são obrigatórios" });
    }

    let alternativasParsed: any[] = [];
    if (alternativasCampo) {
      if (typeof alternativasCampo === "string") {
        try {
          alternativasParsed = JSON.parse(alternativasCampo);
        } catch {
          alternativasParsed = [];
        }
      } else {
        alternativasParsed = alternativasCampo;
      }
    }

    const atividadeData: any = {
      titulo,
      descricao: descricao || null,
      tipo,
      script: script || null,
      linguagem: linguagem || null,
    };

    if (nota) atividadeData.nota = Number(nota);

    if (Array.isArray(alternativasParsed) && alternativasParsed.length > 0) {
      atividadeData.alternativas = {
        create: alternativasParsed.map((a: any, i: number) => ({
          texto: a.texto ?? String(a),
          correta:
            typeof a.correta === "boolean"
              ? a.correta
              : Number(correctIndex) === i,
        })),
      };
    }

    const atividadeCriada = await prisma.atividade.create({
      data: atividadeData,
    });

    const createdFiles: any[] = [];
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (const f of files) {
        const url = `/upload/${path.basename(f.filename)}`;
        const rec = await prisma.atividadeArquivo.create({
          data: {
            url,
            tipoArquivo: f.mimetype,
            atividadeId: atividadeCriada.idAtividade,
          },
        });
        createdFiles.push(rec);
      }
    }

    return res
      .status(201)
      .json({ atividade: atividadeCriada, arquivos: createdFiles });
  } catch (err: any) {
    console.error("atividade-com-upload unexpected:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
});

export default handler;
