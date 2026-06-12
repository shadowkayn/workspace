import { prisma } from "../db/index.js";

/**
 * Quote Repository - 数据访问层
 * 职责：治愈语录的数据库操作
 */
export const QuoteRepository = {
  /**
   * 创建语录
   */
  async create(data) {
    return await prisma.quote.create({
      data,
    });
  },

  /**
   * 根据展示日期查找语录
   */
  async findByDisplayDate(date) {
    // 确保日期格式为 YYYY-MM-DD
    const dateStr = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;

    return await prisma.quote.findUnique({
      where: { displayDate: new Date(dateStr) },
      include: {
        _count: {
          select: { favoritedBy: true },
        },
      },
    });
  },

  /**
   * 获取今日语录
   */
  async findToday() {
    const today = new Date().toISOString().split('T')[0];
    return await this.findByDisplayDate(today);
  },

  /**
   * 根据 ID 查找语录
   */
  async findById(id) {
    return await prisma.quote.findUnique({
      where: { id },
      include: {
        _count: {
          select: { favoritedBy: true },
        },
      },
    });
  },

  /**
   * 查询语录列表（支持分页和分类筛选）
   */
  async findMany({ skip = 0, take = 10, category } = {}) {
    const where = category ? { category } : {};

    return await prisma.quote.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { favoritedBy: true },
        },
      },
    });
  },

  /**
   * 统计语录总数
   */
  async count(category) {
    const where = category ? { category } : {};
    return await prisma.quote.count({ where });
  },

  /**
   * 获取用户的收藏列表（分页）
   */
  async getUserFavorites(userId, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where = { userId };

    const [favorites, total] = await Promise.all([
      prisma.userFavorite.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          quote: {
            include: {
              _count: {
                select: { favoritedBy: true },
              },
            },
          },
        },
      }),
      prisma.userFavorite.count({ where }),
    ]);

    return {
      favorites,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  /**
   * 查询用户收藏的语录（旧方法，保留兼容性）
   */
  async findFavoritesByUserId(userId, { skip = 0, take = 10 } = {}) {
    const where = { userId };

    const [favorites, total] = await Promise.all([
      prisma.userFavorite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          quote: {
            include: {
              _count: {
                select: { favoritedBy: true },
              },
            },
          },
        },
      }),
      prisma.userFavorite.count({ where }),
    ]);

    return { favorites, total };
  },

  /**
   * 随机获取一条语录
   */
  async findRandom(category) {
    const where = category ? { category } : {};
    
    // 先获取总数
    const count = await prisma.quote.count({ where });
    if (count === 0) return null;

    // 随机跳过 n 条
    const skip = Math.floor(Math.random() * count);

    const quotes = await prisma.quote.findMany({
      where,
      skip,
      take: 1,
      include: {
        _count: {
          select: { favoritedBy: true },
        },
      },
    });

    return quotes[0] || null;
  },

  /**
   * 获取所有分类
   */
  async getCategories() {
    const quotes = await prisma.quote.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    return quotes.map((q) => q.category);
  },

  /**
   * 更新语录
   */
  async update(id, data) {
    return await prisma.quote.update({
      where: { id },
      data,
    });
  },

  /**
   * 删除语录
   */
  async delete(id) {
    return await prisma.quote.delete({
      where: { id },
    });
  },

  /**
   * 检查用户是否收藏了该语录
   */
  async isUserFavorited(userId, quoteId) {
    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId,
        quoteId,
      },
    });

    return !!favorite;
  },

  /**
   * 收藏语录
   */
  async favorite(userId, quoteId) {
    return await prisma.userFavorite.upsert({
      where: {
        userId_quoteId: {
          userId,
          quoteId,
        },
      },
      update: {},
      create: {
        userId,
        quoteId,
      },
    });
  },

  /**
   * 取消收藏语录
   */
  async unfavorite(userId, quoteId) {
    return await prisma.userFavorite.deleteMany({
      where: {
        userId,
        quoteId,
      },
    });
  },
};
