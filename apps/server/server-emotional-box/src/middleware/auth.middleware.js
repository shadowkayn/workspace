import jwt from "jsonwebtoken";
import { UserRepository } from "../repository/user.repository.js";

/**
 * JWT 密钥（生产环境应该从环境变量读取）
 */
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据
 * @param {string} payload.userId - 用户 ID
 * @param {string} payload.openid - 微信 openid
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * 验证 JWT Token
 * @param {string} token - JWT token
 * @returns {Object} 解码后的数据
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Token 无效或已过期");
  }
};

/**
 * 认证中间件 - 验证用户是否登录
 * 从请求头中提取 token 并验证，将用户信息挂载到 req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        code: 401,
        message: "未提供认证令牌",
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 2. 验证 token
    const decoded = verifyToken(token);

    // 3. 查询用户是否存在
    const user = await UserRepository.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "用户不存在",
      });
    }

    // 4. 将用户信息挂载到 req 对象
    req.user = {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: error.message || "认证失败",
    });
  }
};

/**
 * 可选认证中间件 - 如果有 token 则验证，没有也放行
 * 适用于某些接口既支持游客访问，也支持登录用户访问的场景
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // 没有 token，继续执行，但 req.user 为 undefined
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await UserRepository.findById(decoded.userId);
    
    if (user) {
      req.user = {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      };
    }

    next();
  } catch (error) {
    // token 无效，但不阻止请求，继续执行
    next();
  }
};

/**
 * 权限检查中间件 - 检查用户是否有权限访问资源
 * 必须在 authenticate 中间件之后使用
 * 
 * @param {Function} checkPermission - 权限检查函数，返回 true 表示有权限
 * @returns {Function} Express 中间件
 * 
 * @example
 * // 检查是否是资源所有者
 * router.put('/users/:id', authenticate, authorize((req) => {
 *   return req.user.id === req.params.id;
 * }), UserController.updateUser);
 */
export const authorize = (checkPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: "请先登录",
        });
      }

      const hasPermission = await checkPermission(req);

      if (!hasPermission) {
        return res.status(403).json({
          code: 403,
          message: "没有权限访问此资源",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        code: 403,
        message: error.message || "权限验证失败",
      });
    }
  };
};

/**
 * 检查是否是资源所有者
 * @param {string} userIdParam - 用户 ID 参数名（默认为 'id'）
 * @returns {Function} 权限检查函数
 */
export const isOwner = (userIdParam = "id") => {
  return (req) => {
    const resourceUserId = req.params[userIdParam] || req.body.userId;
    return req.user.id === resourceUserId;
  };
};

/**
 * 检查是否是管理员（示例，需要根据实际业务调整）
 * @returns {Function} 权限检查函数
 */
export const isAdmin = () => {
  return (req) => {
    // 这里需要根据实际业务逻辑判断
    // 例如：检查用户表中的 role 字段
    return req.user.role === "admin";
  };
};
