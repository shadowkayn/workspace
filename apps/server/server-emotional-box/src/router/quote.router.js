import express from "express";
import { QuoteController } from "../controller/quote.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { rateLimitPresets } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

/**
 * 治愈语录相关路由
 */

// ==================== 公开接口（可选认证） ====================

// 获取今日语录（可选登录）⭐ 最常用
router.get("/today", optionalAuth, QuoteController.getTodayQuote);

// 根据日期获取语录（可选登录）
router.get("/date/:date", optionalAuth, QuoteController.getQuoteByDate);

// 获取语录列表（可选登录，登录后显示收藏状态）
router.get("/", optionalAuth, QuoteController.getQuotes);

// 获取单条语录详情（可选登录）
router.get("/:id", optionalAuth, QuoteController.getQuoteById);

// 随机获取一条语录（可选登录）
router.get("/random/get", optionalAuth, QuoteController.getRandomQuote);

// 获取所有分类
router.get("/categories/list", QuoteController.getCategories);

// ==================== 需要认证的接口 ====================

// 创建语录（需要登录，后续可以加管理员权限）
router.post(
  "/",
  authenticate,
  validate({
    body: {
      content: {
        required: true,
        type: "string",
        minLength: 1,
        maxLength: 500,
      },
      author: {
        type: "string",
        maxLength: 50,
      },
      category: {
        type: "string",
        maxLength: 20,
      },
      displayDate: {
        required: true,
        type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        patternMessage: "日期格式必须为 YYYY-MM-DD",
      },
    },
  }),
  QuoteController.createQuote
);

// 更新语录（需要登录）
router.put(
  "/:id",
  authenticate,
  validate({
    params: {
      id: {
        required: true,
        type: "string",
      },
    },
    body: {
      content: {
        type: "string",
        minLength: 1,
        maxLength: 500,
      },
      author: {
        type: "string",
        maxLength: 50,
      },
      category: {
        type: "string",
        maxLength: 20,
      },
    },
  }),
  QuoteController.updateQuote
);

// 删除语录（需要登录）
router.delete("/:id", authenticate, QuoteController.deleteQuote);

export default router;
