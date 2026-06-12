import express from "express";
import moodRecordController from "../controller/moodRecord.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { createRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 限流配置
const normalLimiter = createRateLimiter("normal");
const strictLimiter = createRateLimiter("strict");

/**
 * @route   GET /api/mood-records/today
 * @desc    获取今天的情绪记录
 * @access  Private
 */
router.get("/today", normalLimiter, moodRecordController.getTodayMoodRecord);

/**
 * @route   GET /api/mood-records/stats
 * @desc    获取情绪统计
 * @access  Private
 */
router.get("/stats", normalLimiter, moodRecordController.getMoodStats);

/**
 * @route   GET /api/mood-records/recent
 * @desc    获取最近的日记
 * @access  Private
 */
router.get("/recent", normalLimiter, moodRecordController.getRecentMoodRecords);

/**
 * @route   GET /api/mood-records/recent-days
 * @desc    获取近N天的情绪记录（用于图表展示）
 * @access  Private
 */
router.get("/recent-days", normalLimiter, moodRecordController.getRecentDaysMoodRecords);

/**
 * @route   GET /api/mood-records/date/:date
 * @desc    按日期查询日记
 * @access  Private
 */
router.get("/date/:date", normalLimiter, moodRecordController.getMoodRecordsByDate);

/**
 * @route   POST /api/mood-records
 * @desc    创建情绪日记
 * @access  Private
 */
router.post("/", strictLimiter, moodRecordController.createMoodRecord);

/**
 * @route   GET /api/mood-records
 * @desc    获取我的日记列表
 * @access  Private
 */
router.get("/", normalLimiter, moodRecordController.getMyMoodRecords);

/**
 * @route   GET /api/mood-records/:id
 * @desc    获取日记详情
 * @access  Private
 */
router.get("/:id", normalLimiter, moodRecordController.getMoodRecordById);

/**
 * @route   PUT /api/mood-records/:id
 * @desc    更新日记
 * @access  Private
 */
router.put("/:id", strictLimiter, moodRecordController.updateMoodRecord);

/**
 * @route   DELETE /api/mood-records/:id
 * @desc    删除日记
 * @access  Private
 */
router.delete("/:id", strictLimiter, moodRecordController.deleteMoodRecord);

export default router;
