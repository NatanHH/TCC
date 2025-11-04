import { PrismaClient } from "@prisma/client";

declare global {
  // evita criar múltiplos clientes em HMR (dev)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ??= new PrismaClient({
  log: ["warn", "error"],
});

export default prisma;
