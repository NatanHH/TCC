import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const payload: unknown = req.body;
  if (typeof payload !== "object" || payload === null)
    return res.status(400).json({ error: "Invalid body" });

  const body = payload as { email?: string; senha?: string };
  const email = body.email ?? "";
  const senha = body.senha ?? "";

  // ...existing logic using email/senha and prisma...
  return res.status(200).json({ ok: true });
}
