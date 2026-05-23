import { prisma } from "../db/index.js";

/**
 * 焦虑记录数据访问层
 */
class AnxietyHistoryRepository {
  /**
   * 创建焦虑记录
   */
  async create(data) {
    return await prisma.anxietyHistory.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * 查找用户的所有焦虑记录（分页）
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = "createdAt",
      order = "desc",
    } = options;

    const skip = (page - 1) * pageSize;
    const where = { userId };

    const [records, total] = await Promise.all([
      prisma.anxietyHistory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: order },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.anxietyHistory.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 查找用户今天的焦虑记录
   */
  async findTodayByUserId(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.anxietyHistory.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}

export default new AnxietyHistoryRepository();
