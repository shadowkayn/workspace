import { defineConfig } from "@prisma/config";
import "dotenv/config"; // 自动加载 .env 文件

export default defineConfig({
  schema: "prisma/schema.prisma", // 根据你的实际路径调整

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env.DATABASE_URL, // 这里读取环境变量
  },
});
