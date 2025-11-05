import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma"; // ajuste o caminho relativo conforme necessário

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const users = await (prisma as any).user.findMany();
  return res.status(200).json(users);
}
