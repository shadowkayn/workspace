import prisma from "../db/index.js";

/**
 * User Repository - 数据访问层
 * 职责：纯数据库操作，不包含业务逻辑
 */
export const UserRepository = {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户对象
   */
  async create(userData) {
    return await prisma.user.create({
      data: userData,
    });
  },

  /**
   * 根据 openid 查找用户
   * @param {string} openid - 微信 openid
   * @returns {Promise<Object|null>} 用户对象或 null
   */
  async findByOpenid(openid) {
    return await prisma.user.findUnique({
      where: { openid },
    });
  },

  /**
   * 根据 ID 查找用户
   * @param {string} id - 用户 ID
   * @returns {Promise<Object|null>} 用户对象或 null
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * 查询所有用户（支持分页）
   * @param {Object} options - 查询选项
   * @param {number} options.skip - 跳过的记录数
   * @param {number} options.take - 获取的记录数
   * @returns {Promise<Array>} 用户列表
   */
  async findMany({ skip = 0, take = 10 } = {}) {
    return await prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        openid: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            moodRecords: true,
            favorites: true,
            anxietyHistories: true,
          },
        },
      },
    });
  },

  /**
   * 统计用户总数
   * @returns {Promise<number>} 用户总数
   */
  async count() {
    return await prisma.user.count();
  },

  /**
   * 更新用户信息
   * @param {string} id - 用户 ID
   * @param {Object} userData - 要更新的数据
   * @returns {Promise<Object>} 更新后的用户对象
   */
  async update(id, userData) {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  },

  /**
   * 删除用户
   * @param {string} id - 用户 ID
   * @returns {Promise<Object>} 删除的用户对象
   */
  async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  },
};
