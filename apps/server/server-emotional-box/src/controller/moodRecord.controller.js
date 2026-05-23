import moodRecordService from "../service/moodRecord.service.js";
import { asyncHandler } from "../middleware/errorHandler.middleware.js";

/**
 * 情绪日记控制器
 */
class MoodRecordController {
  /**
   * 创建情绪日记
   * POST /api/mood-records
   */
  createMoodRecord = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const record = await moodRecordService.createMoodRecord(userId, req.body);

    res.status(201).json({
      code: 201,
      message: "日记创建成功",
      data: record,
    });
  });

  /**
   * 获取日记详情
   * GET /api/mood-records/:id
   */
  getMoodRecordById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await moodRecordService.getMoodRecordById(id, userId);

    res.json({
      code: 200,
      message: "success",
      data: record,
    });
  });

  /**
   * 获取我的日记列表
   * GET /api/mood-records
   */
  getMyMoodRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      page = 1,
      pageSize = 10,
      mood,
      startDate,
      endDate,
      tags,
      orderBy = "createdAt",
      order = "desc",
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      mood,
      startDate,
      endDate,
      tags: tags ? tags.split(",") : undefined,
      orderBy,
      order,
    };

    const result = await moodRecordService.getMyMoodRecords(userId, options);

    res.json({
      code: 200,
      message: "success",
      data: result.records,
      pagination: result.pagination,
    });
  });

  /**
   * 更新日记
   * PUT /api/mood-records/:id
   */
  updateMoodRecord = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await moodRecordService.updateMoodRecord(id, userId, req.body);

    res.json({
      code: 200,
      message: "日记更新成功",
      data: record,
    });
  });

  /**
   * 删除日记
   * DELETE /api/mood-records/:id
   */
  deleteMoodRecord = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await moodRecordService.deleteMoodRecord(id, userId);

    res.json({
      code: 200,
      message: "日记删除成功",
    });
  });

  /**
   * 按日期查询日记
   * GET /api/mood-records/date/:date
   */
  getMoodRecordsByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const userId = req.user.id;

    const records = await moodRecordService.getMoodRecordsByDate(userId, date);

    res.json({
      code: 200,
      message: "success",
      data: records,
    });
  });

  /**
   * 获取情绪统计
   * GET /api/mood-records/stats
   */
  getMoodStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const stats = await moodRecordService.getMoodStats(userId, startDate, endDate);

    res.json({
      code: 200,
      message: "success",
      data: stats,
    });
  });

  /**
   * 获取最近的日记
   * GET /api/mood-records/recent
   */
  getRecentMoodRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const records = await moodRecordService.getRecentMoodRecords(
      userId,
      parseInt(limit)
    );

    res.json({
      code: 200,
      message: "success",
      data: records,
    });
  });

  /**
   * 获取近N天的情绪记录（用于图表展示）
   * GET /api/mood-records/recent-days
   */
  getRecentDaysMoodRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const result = await moodRecordService.getRecentDaysMoodRecords(
      userId,
      parseInt(days)
    );

    res.json({
      code: 200,
      message: "success",
      data: result,
    });
  });
}

export default new MoodRecordController();
