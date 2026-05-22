import { PrismaClient } from "@prisma/client";

// 初始实例化 Prisma 客户端
const prisma = new PrismaClient({
  // 开启查询日志，开发时能在控制台看到 SQL
  log: ["query", "info", "warn", "error"],
});

export default prisma;
