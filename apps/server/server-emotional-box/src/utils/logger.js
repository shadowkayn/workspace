const { createLogger, format, transports } = require("winston");

// 创建一个 Winston 日志记录器实例
// 配置包括时间戳、错误堆栈跟踪和 JSON 格式化
export const logger = createLogger({
  level: "info", // 设置日志级别为 info
  format: format.combine(
    // 组合多种格式化选项
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // 添加时间戳格式
    format.errors({ stack: true }), // 记录错误时包含堆栈信息
    format.json(), // 以 JSON 格式输出日志
  ),
  transports: [
    // 定义日志传输目标
    new transports.Console(), // 控制台输出
    new transports.File({ filename: "logs/error.log", level: "error" }), // 错误日志文件
    new transports.File({ filename: "logs/combined.log" }), // 综合日志文件
  ],
});
