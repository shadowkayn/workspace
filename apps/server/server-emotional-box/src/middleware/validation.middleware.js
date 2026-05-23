import { createError } from "./errorHandler.middleware.js";

/**
 * 请求参数验证中间件工厂函数
 * @param {Object} schema - 验证规则
 * @param {Object} schema.body - 请求体验证规则
 * @param {Object} schema.query - 查询参数验证规则
 * @param {Object} schema.params - 路由参数验证规则
 * @returns {Function} Express 中间件
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // 验证请求体
    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body, "body");
      errors.push(...bodyErrors);
    }

    // 验证查询参数
    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query, "query");
      errors.push(...queryErrors);
    }

    // 验证路由参数
    if (schema.params) {
      const paramsErrors = validateObject(req.params, schema.params, "params");
      errors.push(...paramsErrors);
    }

    if (errors.length > 0) {
      throw createError.badRequest("参数验证失败", errors);
    }

    next();
  };
};

/**
 * 验证对象
 * @param {Object} data - 要验证的数据
 * @param {Object} rules - 验证规则
 * @param {string} location - 数据位置（body/query/params）
 * @returns {Array} 错误列表
 */
const validateObject = (data, rules, location) => {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // 检查必填字段
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors.push({
        field,
        location,
        message: `${field} 是必填字段`,
      });
      continue;
    }

    // 如果字段不存在且非必填，跳过后续验证
    if (value === undefined || value === null) {
      continue;
    }

    // 类型验证
    if (rule.type) {
      const typeError = validateType(value, rule.type, field, location);
      if (typeError) {
        errors.push(typeError);
        continue;
      }
    }

    // 字符串长度验证
    if (rule.type === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          location,
          message: `${field} 长度不能少于 ${rule.minLength} 个字符`,
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          location,
          message: `${field} 长度不能超过 ${rule.maxLength} 个字符`,
        });
      }
    }

    // 数字范围验证
    if (rule.type === "number") {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          location,
          message: `${field} 不能小于 ${rule.min}`,
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          location,
          message: `${field} 不能大于 ${rule.max}`,
        });
      }
    }

    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        location,
        message: `${field} 必须是以下值之一: ${rule.enum.join(", ")}`,
      });
    }

    // 正则表达式验证
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        field,
        location,
        message: rule.patternMessage || `${field} 格式不正确`,
      });
    }

    // 自定义验证函数
    if (rule.custom) {
      const customError = rule.custom(value, data);
      if (customError) {
        errors.push({
          field,
          location,
          message: customError,
        });
      }
    }
  }

  return errors;
};

/**
 * 验证数据类型
 * @param {*} value - 要验证的值
 * @param {string} expectedType - 期望的类型
 * @param {string} field - 字段名
 * @param {string} location - 数据位置
 * @returns {Object|null} 错误对象或 null
 */
const validateType = (value, expectedType, field, location) => {
  const actualType = Array.isArray(value) ? "array" : typeof value;

  if (expectedType === "number") {
    const num = Number(value);
    if (isNaN(num)) {
      return {
        field,
        location,
        message: `${field} 必须是数字类型`,
      };
    }
    return null;
  }

  if (expectedType === "boolean") {
    if (value !== true && value !== false && value !== "true" && value !== "false") {
      return {
        field,
        location,
        message: `${field} 必须是布尔类型`,
      };
    }
    return null;
  }

  if (actualType !== expectedType) {
    return {
      field,
      location,
      message: `${field} 必须是 ${expectedType} 类型`,
    };
  }

  return null;
};

/**
 * 常用验证规则
 */
export const commonRules = {
  // ID 验证（CUID 格式）
  id: {
    required: true,
    type: "string",
    minLength: 20,
    maxLength: 30,
  },

  // 微信 openid 验证
  openid: {
    required: true,
    type: "string",
    minLength: 28,
    maxLength: 28,
  },

  // 昵称验证
  nickname: {
    type: "string",
    minLength: 1,
    maxLength: 50,
  },

  // URL 验证
  url: {
    type: "string",
    pattern: /^https?:\/\/.+/,
    patternMessage: "必须是有效的 URL",
  },

  // 分页参数
  page: {
    type: "number",
    min: 1,
  },

  limit: {
    type: "number",
    min: 1,
    max: 100,
  },
};

/**
 * 预设的验证 schema
 */
export const validationSchemas = {
  // 微信登录
  wechatLogin: {
    body: {
      code: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 100,
        messages: {
          required: "code 不能为空",
          type: "code 必须是字符串",
          minLength: "code 不能为空",
          maxLength: "code 长度不能超过 100",
        },
      },
      nickname: commonRules.nickname,
      avatarUrl: commonRules.url,
    },
  },

  // 更新用户
  updateUser: {
    params: {
      id: commonRules.id,
    },
    body: {
      nickname: commonRules.nickname,
      avatarUrl: commonRules.url,
    },
  },

  // 获取用户列表
  getUserList: {
    query: {
      page: commonRules.page,
      limit: commonRules.limit,
    },
  },

  // 获取用户详情
  getUserById: {
    params: {
      id: commonRules.id,
    },
  },
};
