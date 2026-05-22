// 根据业务需求扩展更多具体错误类型

import AppError from "./AppError.js";

// 一般错误
export class CustomError extends AppError {
  constructor(message, statusCode) {
    super(message, statusCode);
  }
}

// 无权限
export class UnauthorizedError extends CustomError {
  constructor(message = "无权限") {
    super(message, 401);
  }
}

// 接口不存在
export class NotFoundError extends CustomError {
  constructor(message = "接口不存在") {
    super(message, 404);
  }
}

// 字段缺失
export class MissingFieldError extends CustomError {
  constructor(fieldName) {
    super(`${fieldName}字段缺失`, 400);
    this.fieldName = fieldName;
  }
}
