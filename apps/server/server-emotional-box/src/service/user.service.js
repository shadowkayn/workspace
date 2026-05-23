import { UserRepository } from "../repository/user.repository.js";
import { generateToken } from "../middleware/auth.middleware.js";
import wechatService from "./wechat.service.js";
import { AppError } from "../middleware/errorHandler.middleware.js";

/**
 * User Service - 业务逻辑层
 * 职责：业务逻辑、数据验证、事务处理、调用 Repository
 */
export const UserService = {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.openid - 微信 openid（必填）
   * @param {string} [userData.nickname] - 昵称
   * @param {string} [userData.avatarUrl] - 头像 URL
   * @returns {Promise<Object>} 创建的用户对象
   * @throws {Error} 参数验证失败或用户已存在
   */
  async createUser(userData) {
    // 1. 参数验证
    if (!userData.openid) {
      throw new Error("openid 不能为空");
    }

    // 2. 业务规则：检查用户是否已存在
    const existingUser = await UserRepository.findByOpenid(userData.openid);
    if (existingUser) {
      throw new Error("用户已存在");
    }

    // 3. 数据清洗：只保留允许的字段
    const allowedFields = ["openid", "nickname", "avatarUrl"];
    const cleanedData = {};
    allowedFields.forEach((field) => {
      if (userData[field] !== undefined) {
        cleanedData[field] = userData[field];
      }
    });

    // 4. 调用 Repository 层创建用户
    const user = await UserRepository.create(cleanedData);

    // 5. 返回时过滤敏感信息（如果有的话）
    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  },

  /**
   * 获取用户列表（支持分页）
   * @param {Object} options - 查询选项
   * @param {number} [options.page=1] - 页码
   * @param {number} [options.limit=10] - 每页数量
   * @returns {Promise<Object>} 包含用户列表和分页信息
   */
  async getUserList({ page = 1, limit = 10 } = {}) {
    // 1. 参数验证
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // 限制最大 100 条

    // 2. 计算分页参数
    const skip = (pageNum - 1) * limitNum;

    // 3. 并行查询用户列表和总数
    const [users, total] = await Promise.all([
      UserRepository.findMany({ skip, take: limitNum }),
      UserRepository.count(),
    ]);

    // 4. 返回结构化数据
    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * 根据 ID 获取用户详情
   * @param {string} id - 用户 ID
   * @returns {Promise<Object>} 用户对象
   * @throws {Error} 用户不存在
   */
  async getUserById(id) {
    if (!id) {
      throw new Error("用户 ID 不能为空");
    }

    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }

    return user;
  },

  /**
   * 微信小程序登录
   * @param {Object} loginData - 登录数据
   * @param {string} loginData.code - 微信登录 code
   * @param {string} [loginData.nickname] - 用户昵称
   * @param {string} [loginData.avatarUrl] - 用户头像
   * @returns {Promise<Object>} 用户对象和 token
   */
  async wechatLogin(loginData) {
    const { code, nickname, avatarUrl } = loginData;

    if (!code) {
      throw new AppError("code 不能为空", 400);
    }

    // 1. 调用微信 API 获取 openid
    const { openid, session_key, unionid } = await wechatService.code2Session(code);

    // 2. 查找或创建用户
    let user = await UserRepository.findByOpenid(openid);

    if (!user) {
      // 新用户，创建账号
      user = await UserRepository.create({
        openid,
        nickname: nickname || "微信用户",
        avatarUrl: avatarUrl || null,
      });
    } else {
      // 老用户，更新信息（如果提供了新的）
      const updateData = {};
      if (nickname && nickname !== user.nickname) {
        updateData.nickname = nickname;
      }
      if (avatarUrl && avatarUrl !== user.avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }

      if (Object.keys(updateData).length > 0) {
        user = await UserRepository.update(user.id, updateData);
      }
    }

    // 3. 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.openid,
    });

    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
      // 可以选择性返回 session_key 和 unionid，用于后续解密用户数据
      // 注意：session_key 不应该传给前端，应该保存在服务器
    };
  },

  /**
   * 根据 openid 获取或创建用户（兼容旧接口，用于测试）
   * @param {Object} userData - 用户数据
   * @param {string} userData.openid - 微信 openid
   * @param {string} [userData.nickname] - 昵称
   * @param {string} [userData.avatarUrl] - 头像 URL
   * @returns {Promise<Object>} 用户对象和 token
   */
  async getOrCreateUser(userData) {
    if (!userData.openid) {
      throw new Error("openid 不能为空");
    }

    // 先查找用户
    let user = await UserRepository.findByOpenid(userData.openid);

    // 如果不存在则创建
    if (!user) {
      const allowedFields = ["openid", "nickname", "avatarUrl"];
      const cleanedData = {};
      allowedFields.forEach((field) => {
        if (userData[field] !== undefined) {
          cleanedData[field] = userData[field];
        }
      });

      user = await UserRepository.create(cleanedData);
    } else {
      // 用户已存在，更新昵称和头像（如果提供了新的）
      const updateData = {};
      if (userData.nickname && userData.nickname !== user.nickname) {
        updateData.nickname = userData.nickname;
      }
      if (userData.avatarUrl && userData.avatarUrl !== user.avatarUrl) {
        updateData.avatarUrl = userData.avatarUrl;
      }

      if (Object.keys(updateData).length > 0) {
        user = await UserRepository.update(user.id, updateData);
      }
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.openid,
    });

    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * 更新用户信息
   * @param {string} id - 用户 ID
   * @param {Object} userData - 要更新的数据
   * @returns {Promise<Object>} 更新后的用户对象
   * @throws {Error} 用户不存在
   */
  async updateUser(id, userData) {
    if (!id) {
      throw new Error("用户 ID 不能为空");
    }

    // 检查用户是否存在
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new Error("用户不存在");
    }

    // 只允许更新特定字段
    const allowedFields = ["nickname", "avatarUrl"];
    const cleanedData = {};
    allowedFields.forEach((field) => {
      if (userData[field] !== undefined) {
        cleanedData[field] = userData[field];
      }
    });

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("没有可更新的字段");
    }

    return await UserRepository.update(id, cleanedData);
  },
};
