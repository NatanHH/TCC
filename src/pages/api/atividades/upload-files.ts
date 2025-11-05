import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const payload: unknown = req.body;
  if (typeof payload === "object" && payload !== null) {
    const body = payload as { atividadeId?: number };
    // ...lógica de upload...
  }

  return res.status(200).json({ ok: true });
}
