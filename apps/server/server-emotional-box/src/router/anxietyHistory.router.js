import express from "express";
import anxietyHistoryController from "../controller/anxietyHistory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { createRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 限流配置
const normalLimiter = createRateLimiter("normal");
const strictLimiter = createRateLimiter("strict");

/**
 * @route   GET /api/anxiety-records/today
 * @desc    获取今天的焦虑记录
 * @access  Private
 */
router.get("/today", normalLimiter, anxietyHistoryController.getTodayAnxietyRecords);

/**
 * @route   POST /api/anxiety-records
 * @desc    创建焦虑记录
 * @access  Private
 */
router.post("/", strictLimiter, anxietyHistoryController.createAnxietyRecord);

/**
 * @route   GET /api/anxiety-records
 * @desc    获取我的所有焦虑记录
 * @access  Private
 */
router.get("/", normalLimiter, anxietyHistoryController.getMyAnxietyRecords);

export default router;
