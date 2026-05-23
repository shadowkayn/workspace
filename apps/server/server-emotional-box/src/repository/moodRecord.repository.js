import { prisma } from "../db/index.js";

/**
 * 情绪日记数据访问层
 */
class MoodRecordRepository {
  /**
   * 创建情绪日记
   */
  async create(data) {
    return await prisma.moodRecord.create({
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
   * 根据ID查找日记
   */
  async findById(id) {
    return await prisma.moodRecord.findUnique({
      where: { id },
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
   * 查找用户的日记列表（分页）
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      pageSize = 10,
      mood,
      startDate,
      endDate,
      tags,
      orderBy = "createdAt",
      order = "desc",
    } = options;

    const skip = (page - 1) * pageSize;
    const where = { userId };

    // 筛选条件
    if (mood) {
      where.mood = mood;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    const [records, total] = await Promise.all([
      prisma.moodRecord.findMany({
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
      prisma.moodRecord.count({ where }),
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
   * 更新日记
   */
  async update(id, data) {
    return await prisma.moodRecord.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
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

  /**
   * 删除日记
   */
  async delete(id) {
    return await prisma.moodRecord.delete({
      where: { id },
    });
  }

  /**
   * 按日期查找日记
   */
  async findByDate(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.moodRecord.findMany({
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

  /**
   * 获取情绪统计
   */
  async getMoodStats(userId, startDate, endDate) {
    const where = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 按情绪类型统计
    const moodStats = await prisma.moodRecord.groupBy({
      by: ["mood"],
      where,
      _count: {
        mood: true,
      },
      _avg: {
        moodScore: true,
      },
    });

    // 总记录数
    const total = await prisma.moodRecord.count({ where });

    // 平均情绪分数
    const avgScore = await prisma.moodRecord.aggregate({
      where,
      _avg: {
        moodScore: true,
      },
    });

    return {
      total,
      avgScore: avgScore._avg.moodScore || 0,
      moodDistribution: moodStats.map((stat) => ({
        mood: stat.mood,
        count: stat._count.mood,
        avgScore: stat._avg.moodScore || 0,
        percentage: ((stat._count.mood / total) * 100).toFixed(2),
      })),
    };
  }

  /**
   * 获取最近的日记
   */
  async getRecent(userId, limit = 5) {
    return await prisma.moodRecord.findMany({
      where: { userId },
      take: limit,
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

  /**
   * 获取近N天的情绪记录（按天分组）
   */
  async getRecentDays(userId, days = 7) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.moodRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        mood: true,
        moodScore: true,
        title: true,
        tags: true,
        createdAt: true,
      },
    });

    return records;
  }
}

export default new MoodRecordRepository();
