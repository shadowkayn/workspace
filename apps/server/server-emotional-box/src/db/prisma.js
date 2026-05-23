import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client 实例
 * 单例模式，确保整个应用只有一个实例
 */

// 根据环境配置日志级别
const logLevels = process.env.NODE_ENV === "production" 
  ? ["error", "warn"] 
  : ["query", "info", "warn", "error"];

// 创建 Prisma Client 实例
const prisma = new PrismaClient({
  log: logLevels,
  errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
});

// 开发环境：打印连接信息
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    console.log(`[Prisma Query] ${e.query}`);
    console.log(`[Prisma Params] ${e.params}`);
    console.log(`[Prisma Duration] ${e.duration}ms`);
  });
}

export default prisma;
