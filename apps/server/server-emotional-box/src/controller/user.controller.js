import { UserService } from "../service/user.service.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * User Controller - 控制器层
 * 职责：处理 HTTP 请求/响应、参数提取、调用 Service 层
 */
export const UserController = {
  /**
   * 创建用户
   * POST /api/users
   */
  createUser: catchAsync(async (req, res) => {
    const userData = req.body;

    const user = await UserService.createUser(userData);

    res.status(201).json({
      code: 201,
      message: "用户创建成功",
      data: user,
    });
  }),

  /**
   * 获取用户列表（支持分页）
   * GET /api/users?page=1&limit=10
   */
  getUsers: catchAsync(async (req, res) => {
    const { page, limit } = req.query;

    const result = await UserService.getUserList({ page, limit });

    res.json({
      code: 200,
      message: "success",
      data: result,
    });
  }),

  /**
   * 获取单个用户详情
   * GET /api/users/:id
   */
  getUserById: catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await UserService.getUserById(id);

    res.json({
      code: 200,
      message: "success",
      data: user,
    });
  }),

  /**
   * 微信小程序登录/注册
   * POST /api/users/wechat-login
   * Body: { code, nickname?, avatarUrl? }
   */
  wechatLogin: catchAsync(async (req, res) => {
    const loginData = req.body;

    const result = await UserService.wechatLogin(loginData);

    res.json({
      code: 200,
      message: "登录成功",
      data: result, // 包含 user 和 token
    });
  }),

  /**
   * 获取当前登录用户信息
   * GET /api/users/me
   */
  getCurrentUser: catchAsync(async (req, res) => {
    // req.user 由 authenticate 中间件注入
    res.json({
      code: 200,
      message: "success",
      data: req.user,
    });
  }),

  /**
   * 更新用户信息
   * PUT /api/users/:id
   */
  updateUser: catchAsync(async (req, res) => {
    const { id } = req.params;
    const userData = req.body;

    const user = await UserService.updateUser(id, userData);

    res.json({
      code: 200,
      message: "用户信息更新成功",
      data: user,
    });
  }),
};
