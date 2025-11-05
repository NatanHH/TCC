import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // If using multipart parser, parse files here. Otherwise validate body:
  const payload: unknown = req.body;
  if (typeof payload === "object" && payload !== null) {
    const body = payload as { atividadeId?: number };
    // ...use body safely...
  }

  // ...existing upload logic...
  return res.status(200).json({});
}
