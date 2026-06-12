import express from "express";
import anxietyHistoryController from "../controller/anxietyHistory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { createRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// 限流配置
const normalLimiter = createRateLimiter("normal");
const strictLimiter = createRateLimiter("strict");

/**
 * @route   GET /api/anxiety-records/today
 * @desc    获取今天的焦虑记录
 * @access  Private
 */
router.get(
  "/today",
  authenticate,
  normalLimiter,
  anxietyHistoryController.getTodayAnxietyRecords
);

/**
 * @route   POST /api/anxiety-records
 * @desc    创建焦虑记录
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  strictLimiter,
  anxietyHistoryController.createAnxietyRecord
);

/**
 * @route   GET /api/anxiety-records
 * @desc    获取我的所有焦虑记录
 * @access  Private
 */
router.get(
  "/",
  authenticate,
  normalLimiter,
  anxietyHistoryController.getMyAnxietyRecords
);

/**
 * @route   DELETE /api/anxiety-records
 * @desc    清空我的所有焦虑记录
 * @access  Private
 */
router.delete(
  "/",
  authenticate,
  strictLimiter,
  anxietyHistoryController.clearMyAnxietyRecords
);

/**
 * @route   DELETE /api/anxiety-records/:id
 * @desc    删除单条焦虑记录
 * @access  Private
 */
router.delete(
  "/:id",
  authenticate,
  strictLimiter,
  anxietyHistoryController.deleteAnxietyRecord
);

export default router;
