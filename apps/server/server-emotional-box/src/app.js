import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./db/index.js";
import routes from "./router/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware.js";
import { requestLogger, detailedLogger } from "./middleware/logger.middleware.js";
import { rateLimitPresets } from "./middleware/rateLimit.middleware.js";

const app = express();

// ==================== 基础中间件 ====================

// CORS 配置
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // 生产环境应该设置具体的域名
    credentials: true,
  })
);

// 解析 JSON 请求体（限制 10MB）
app.use(express.json({ limit: "10mb" }));

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==================== 日志中间件 ====================

// 根据环境选择日志级别
if (process.env.NODE_ENV === "development") {
  app.use(detailedLogger); // 开发环境：详细日志
} else {
  app.use(requestLogger); // 生产环境：简单日志
}

// ==================== 全局限流 ====================

// 对所有接口应用宽松限流（1 小时 1000 次）
app.use(rateLimitPresets.loose);

// ==================== 健康检查 ====================

app.get("/", (req, res) => {
  res.json({
    name: "Emotional Box API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "connected", // 可以添加数据库连接检查
  });
});

// ==================== API 路由 ====================

// 动态注册所有路由
Object.entries(routes).forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  console.log(`✓ 路由已注册: /api${path}`);
});

// ==================== 数据库连接测试 ====================

// 测试数据库连接
app.get("/api/db-test", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      code: 200,
      message: "数据库连接成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 错误处理 ====================

// 404 处理（必须在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理（必须在最后）
app.use(errorHandler);

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Emotional Box API Server                        ║
║                                                       ║
║   📍 地址: http://localhost:${PORT}                     ║
║   🌍 环境: ${process.env.NODE_ENV || "development"}                    ║
║   📝 健康检查: http://localhost:${PORT}/health          ║
║   📚 API 文档: http://localhost:${PORT}/api/users       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
  
  console.log("\n已注册的路由:");
  Object.keys(routes).forEach((path) => {
    console.log(`  → /api${path}`);
  });
  console.log("");
});

// ==================== 优雅关闭 ====================

// 处理 SIGTERM 信号（Docker、Kubernetes 等会发送此信号）
process.on("SIGTERM", async () => {
  console.log("\n⚠️  收到 SIGTERM 信号，开始优雅关闭...");
  
  server.close(async () => {
    console.log("✓ HTTP 服务器已关闭");
    
    // 关闭数据库连接
    await prisma.$disconnect();
    console.log("✓ 数据库连接已关闭");
    
    console.log("✓ 服务器已完全关闭");
    process.exit(0);
  });
  
  // 如果 30 秒后还没关闭，强制退出
  setTimeout(() => {
    console.error("❌ 强制关闭服务器（超时）");
    process.exit(1);
  }, 30000);
});

// 处理 SIGINT 信号（Ctrl+C）
process.on("SIGINT", async () => {
  console.log("\n⚠️  收到 SIGINT 信号，开始优雅关闭...");
  
  server.close(async () => {
    console.log("✓ HTTP 服务器已关闭");
    
    await prisma.$disconnect();
    console.log("✓ 数据库连接已关闭");
    
    console.log("✓ 服务器已完全关闭");
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on("uncaughtException", (error) => {
  console.error("❌ 未捕获的异常:", error);
  process.exit(1);
});

// 处理未处理的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ 未处理的 Promise 拒绝:", reason);
  process.exit(1);
});

export default app;
