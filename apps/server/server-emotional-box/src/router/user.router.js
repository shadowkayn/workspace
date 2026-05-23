import express from "express";
import { UserController } from "../controller/user.controller.js";
import { authenticate, authorize, isOwner } from "../middleware/auth.middleware.js";
import { validate, validationSchemas } from "../middleware/validation.middleware.js";
import { rateLimitPresets } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

/**
 * 用户相关路由
 */

// ==================== 公开接口（无需认证） ====================

// 微信小程序登录/注册（返回 token）
// 应用登录限流和参数验证
router.post(
  "/wechat-login",
  rateLimitPresets.login,
  validate(validationSchemas.wechatLogin),
  UserController.wechatLogin
);

// 测试登录（开发环境使用，返回 token）
router.post("/test-login", UserController.testLogin);

// ==================== 需要认证的接口 ====================

// 获取当前登录用户信息
router.get("/me", authenticate, UserController.getCurrentUser);

// 获取用户列表（支持分页）- 需要登录
router.get(
  "/",
  authenticate,
  validate(validationSchemas.getUserList),
  UserController.getUsers
);

// 获取单个用户详情 - 需要登录
router.get(
  "/:id",
  authenticate,
  validate(validationSchemas.getUserById),
  UserController.getUserById
);

// 更新用户信息 - 需要登录且只能更新自己的信息
router.put(
  "/:id",
  authenticate,
  authorize(isOwner("id")),
  validate(validationSchemas.updateUser),
  UserController.updateUser
);

// 创建用户（管理员功能，暂时开放）
router.post("/", UserController.createUser);

export default router;
