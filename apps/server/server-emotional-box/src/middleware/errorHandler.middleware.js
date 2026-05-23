/**
 * 全局错误处理中间件
 * 统一处理应用中的所有错误
 */
export const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // 默认错误状态码
  const statusCode = err.statusCode || 500;

  // 开发环境返回详细错误信息，生产环境返回简化信息
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    code: statusCode,
    message: err.message || "服务器内部错误",
    ...(isDevelopment && {
      stack: err.stack,
      details: err.details,
    }),
  });
};

/**
 * 异步处理器包装函数
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 错误处理中间件
 * 处理未匹配到的路由
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    code: 404,
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
  });
};

/**
 * 自定义错误类
 * 用于在业务逻辑中抛出带有状态码的错误
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 常用错误快捷方法
 */
export const createError = {
  badRequest: (message = "请求参数错误", details = null) => {
    return new AppError(message, 400, details);
  },
  unauthorized: (message = "未授权，请先登录") => {
    return new AppError(message, 401);
  },
  forbidden: (message = "没有权限访问此资源") => {
    return new AppError(message, 403);
  },
  notFound: (message = "资源不存在") => {
    return new AppError(message, 404);
  },
  conflict: (message = "资源冲突") => {
    return new AppError(message, 409);
  },
  internal: (message = "服务器内部错误") => {
    return new AppError(message, 500);
  },
};
