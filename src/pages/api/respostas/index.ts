import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // ...list responses...
    return res.status(200).json([]);
  }

  if (req.method === "POST") {
    const payload: unknown = req.body;
    if (typeof payload !== "object" || payload === null) {
      return res.status(400).json({ error: "Invalid body" });
    }
    const body = payload as {
      alunoId?: number;
      atividadeId?: number;
      respostas?: any[];
    };
    // validate fields before use
    // ...create response logic...
    return res.status(201).json({});
  }

  return res.status(405).json({ error: "Method not allowed" });
}
