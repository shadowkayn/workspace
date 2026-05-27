import { QuoteService } from "../service/quote.service.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * Quote Controller - 控制器层
 * 职责：处理治愈语录相关的 HTTP 请求
 */
export const QuoteController = {
  /**
   * 创建语录
   * POST /api/quotes
   */
  createQuote: catchAsync(async (req, res) => {
    const quoteData = req.body;

    const quote = await QuoteService.createQuote(quoteData);

    res.status(201).json({
      code: 201,
      message: "语录创建成功",
      data: quote,
    });
  }),

  /**
   * 获取今日语录
   * GET /api/quotes/today
   */
  getTodayQuote: catchAsync(async (req, res) => {
    const userId = req.user?.id;

    const quote = await QuoteService.getTodayQuote(userId);

    res.json({
      code: 200,
      message: "success",
      data: quote,
    });
  }),

  /**
   * 根据日期获取语录
   * GET /api/quotes/date/:date (date格式: 2026-05-23)
   */
  getQuoteByDate: catchAsync(async (req, res) => {
    const { date } = req.params;
    const userId = req.user?.id;

    const quote = await QuoteService.getQuoteByDate(date, userId);

    res.json({
      code: 200,
      message: "success",
      data: quote,
    });
  }),

  /**
   * 获取语录列表（支持分页和分类筛选）
   * GET /api/quotes?page=1&limit=10&category=励志
   */
  getQuotes: catchAsync(async (req, res) => {
    const { page, limit, category } = req.query;
    const userId = req.user?.id; // 如果已登录，获取用户 ID

    const result = await QuoteService.getQuoteList({
      page,
      limit,
      category,
      userId,
    });

    res.json({
      code: 200,
      message: "success",
      data: result,
    });
  }),

  /**
   * 获取单条语录详情
   * GET /api/quotes/:id
   */
  getQuoteById: catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const quote = await QuoteService.getQuoteById(id, userId);

    res.json({
      code: 200,
      message: "success",
      data: quote,
    });
  }),

  /**
   * 随机获取一条语录
   * GET /api/quotes/random?category=励志
   */
  getRandomQuote: catchAsync(async (req, res) => {
    const { category } = req.query;
    const userId = req.user?.id;

    const quote = await QuoteService.getRandomQuote(category, userId);

    res.json({
      code: 200,
      message: "success",
      data: quote,
    });
  }),

  /**
   * 获取所有分类
   * GET /api/quotes/categories
   */
  getCategories: catchAsync(async (req, res) => {
    const categories = await QuoteService.getCategories();

    res.json({
      code: 200,
      message: "success",
      data: categories,
    });
  }),

  /**
   * 收藏语录
   * POST /api/quotes/:id/favorite
   */
  favoriteQuote: catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const favorite = await QuoteService.favoriteQuote(userId, id);

    res.json({
      code: 200,
      message: "收藏成功",
      data: favorite,
    });
  }),

  /**
   * 取消收藏语录
   * DELETE /api/quotes/:id/favorite
   */
  unfavoriteQuote: catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await QuoteService.unfavoriteQuote(userId, id);

    res.json({
      code: 200,
      message: "取消收藏成功",
      data: { quoteId: id, isFavorited: false },
    });
  }),

  /**
   * 更新语录
   * PUT /api/quotes/:id
   */
  updateQuote: catchAsync(async (req, res) => {
    const { id } = req.params;
    const quoteData = req.body;

    const quote = await QuoteService.updateQuote(id, quoteData);

    res.json({
      code: 200,
      message: "语录更新成功",
      data: quote,
    });
  }),

  /**
   * 删除语录
   * DELETE /api/quotes/:id
   */
  deleteQuote: catchAsync(async (req, res) => {
    const { id } = req.params;

    await QuoteService.deleteQuote(id);

    res.json({
      code: 200,
      message: "语录删除成功",
    });
  }),
};
