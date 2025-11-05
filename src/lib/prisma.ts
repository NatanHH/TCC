import { PrismaClient } from "@prisma/client";

declare global {
  // evita criar múltiplos clientes em HMR (dev)
   
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ??= new PrismaClient({
  log: ["warn", "error"],
});

export default prisma;
