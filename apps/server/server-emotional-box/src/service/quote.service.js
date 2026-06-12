import { QuoteRepository } from "../repository/quote.repository.js";

/**
 * Quote Service - 业务逻辑层
 * 职责：治愈语录的业务逻辑处理
 */
export const QuoteService = {
  /**
   * 创建语录
   */
  async createQuote(data) {
    // 参数验证
    if (!data.content || data.content.trim() === "") {
      throw new Error("语录内容不能为空");
    }

    if (!data.displayDate) {
      throw new Error("展示日期不能为空");
    }

    // 检查该日期是否已有语录
    const existing = await QuoteRepository.findByDisplayDate(data.displayDate);
    if (existing) {
      throw new Error("该日期已有语录");
    }

    // 数据清洗
    const cleanedData = {
      content: data.content.trim(),
      author: data.author?.trim() || "佚名",
      category: data.category?.trim() || "默认",
      displayDate: new Date(data.displayDate),
    };

    return await QuoteRepository.create(cleanedData);
  },

  /**
   * 获取今日语录
   */
  async getTodayQuote(userId) {
    const quote = await QuoteRepository.findToday();
    
    if (!quote) {
      throw new Error("今日暂无语录");
    }

    // 如果提供了 userId，检查是否收藏
    if (userId) {
      const isFavorited = await QuoteRepository.isUserFavorited(
        userId,
        quote.id
      );
      return {
        ...quote,
        isFavorited,
        favoriteCount: quote._count.favoritedBy,
      };
    }

    return {
      ...quote,
      favoriteCount: quote._count.favoritedBy,
    };
  },

  /**
   * 根据日期获取语录
   */
  async getQuoteByDate(date, userId) {
    if (!date) {
      throw new Error("日期不能为空");
    }

    const quote = await QuoteRepository.findByDisplayDate(date);
    
    if (!quote) {
      throw new Error("该日期暂无语录");
    }

    // 如果提供了 userId，检查是否收藏
    if (userId) {
      const isFavorited = await QuoteRepository.isUserFavorited(
        userId,
        quote.id
      );
      return {
        ...quote,
        isFavorited,
        favoriteCount: quote._count.favoritedBy,
      };
    }

    return {
      ...quote,
      favoriteCount: quote._count.favoritedBy,
    };
  },

  /**
   * 获取语录列表（支持分页和分类筛选）
   */
  async getQuoteList({ page = 1, limit = 10, category, userId } = {}) {
    // 参数验证
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // 计算分页参数
    const skip = (pageNum - 1) * limitNum;

    // 并行查询语录列表和总数
    const [quotes, total] = await Promise.all([
      QuoteRepository.findMany({ skip, take: limitNum, category }),
      QuoteRepository.count(category),
    ]);

    // 如果提供了 userId，检查每条语录是否被收藏
    if (userId) {
      const quotesWithFavorite = await Promise.all(
        quotes.map(async (quote) => {
          const isFavorited = await QuoteRepository.isUserFavorited(
            userId,
            quote.id
          );
          return {
            ...quote,
            isFavorited,
            favoriteCount: quote._count.favoritedBy,
          };
        })
      );

      return {
        quotes: quotesWithFavorite,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }

    // 不需要收藏状态
    return {
      quotes: quotes.map((quote) => ({
        ...quote,
        favoriteCount: quote._count.favoritedBy,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * 获取我的收藏语录
   */
  async getMyFavorites({ userId, page = 1, limit = 100 } = {}) {
    if (!userId) {
      throw new Error("请先登录");
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const { favorites, total } = await QuoteRepository.findFavoritesByUserId(
      userId,
      { skip, take: limitNum }
    );

    return {
      favorites: favorites.map((favorite) => ({
        ...favorite.quote,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt,
        isFavorited: true,
        favoriteCount: favorite.quote._count.favoritedBy,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * 获取单条语录详情
   */
  async getQuoteById(id, userId) {
    if (!id) {
      throw new Error("语录 ID 不能为空");
    }

    const quote = await QuoteRepository.findById(id);
    if (!quote) {
      throw new Error("语录不存在");
    }

    // 如果提供了 userId，检查是否收藏
    if (userId) {
      const isFavorited = await QuoteRepository.isUserFavorited(userId, id);
      return {
        ...quote,
        isFavorited,
        favoriteCount: quote._count.favoritedBy,
      };
    }

    return {
      ...quote,
      favoriteCount: quote._count.favoritedBy,
    };
  },

  /**
   * 随机获取一条语录
   */
  async getRandomQuote(category, userId) {
    const quote = await QuoteRepository.findRandom(category);
    if (!quote) {
      throw new Error("暂无语录");
    }

    // 如果提供了 userId，检查是否收藏
    if (userId) {
      const isFavorited = await QuoteRepository.isUserFavorited(
        userId,
        quote.id
      );
      return {
        ...quote,
        isFavorited,
        favoriteCount: quote._count.favoritedBy,
      };
    }

    return {
      ...quote,
      favoriteCount: quote._count.favoritedBy,
    };
  },

  /**
   * 获取所有分类
   */
  async getCategories() {
    return await QuoteRepository.getCategories();
  },

  /**
   * 获取用户的收藏列表
   */
  async getUserFavorites(userId, options = {}) {
    if (!userId) {
      throw new Error("请先登录");
    }

    const { page = 1, pageSize = 20 } = options;
    return await QuoteRepository.getUserFavorites(userId, page, pageSize);
  },

  /**
   * 收藏语录
   */
  async favoriteQuote(userId, quoteId) {
    if (!userId) {
      throw new Error("请先登录");
    }

    if (!quoteId) {
      throw new Error("语录 ID 不能为空");
    }

    const quote = await QuoteRepository.findById(quoteId);
    if (!quote) {
      throw new Error("语录不存在");
    }

    const favorite = await QuoteRepository.favorite(userId, quoteId);

    return {
      ...favorite,
      isFavorited: true,
    };
  },

  /**
   * 取消收藏语录
   */
  async unfavoriteQuote(userId, quoteId) {
    if (!userId) {
      throw new Error("请先登录");
    }

    if (!quoteId) {
      throw new Error("语录 ID 不能为空");
    }

    return await QuoteRepository.unfavorite(userId, quoteId);
  },

  /**
   * 更新语录
   */
  async updateQuote(id, data) {
    if (!id) {
      throw new Error("语录 ID 不能为空");
    }

    // 检查语录是否存在
    const existingQuote = await QuoteRepository.findById(id);
    if (!existingQuote) {
      throw new Error("语录不存在");
    }

    // 数据清洗
    const cleanedData = {};
    if (data.content !== undefined) {
      if (data.content.trim() === "") {
        throw new Error("语录内容不能为空");
      }
      cleanedData.content = data.content.trim();
    }
    if (data.author !== undefined) {
      cleanedData.author = data.author.trim() || "佚名";
    }
    if (data.category !== undefined) {
      cleanedData.category = data.category.trim() || "默认";
    }

    if (Object.keys(cleanedData).length === 0) {
      throw new Error("没有可更新的字段");
    }

    return await QuoteRepository.update(id, cleanedData);
  },

  /**
   * 删除语录
   */
  async deleteQuote(id) {
    if (!id) {
      throw new Error("语录 ID 不能为空");
    }

    // 检查语录是否存在
    const existingQuote = await QuoteRepository.findById(id);
    if (!existingQuote) {
      throw new Error("语录不存在");
    }

    return await QuoteRepository.delete(id);
  },
};
