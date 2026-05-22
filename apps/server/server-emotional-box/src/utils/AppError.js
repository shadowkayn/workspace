// 创建自定义错误类

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // 标识是否为操作性错误

    Error.captureStackTrace(this, this.constructor);
  }
}
