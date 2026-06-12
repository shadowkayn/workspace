import anxietyHistoryService from "../service/anxietyHistory.service.js";
import { asyncHandler } from "../middleware/errorHandler.middleware.js";

/**
 * 焦虑记录控制器
 */
class AnxietyHistoryController {
  /**
   * 创建焦虑记录
   * POST /api/anxiety-records
   */
  createAnxietyRecord = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const record = await anxietyHistoryService.createAnxietyRecord(userId, req.body);

    res.status(201).json({
      code: 201,
      message: "焦虑记录创建成功",
      data: record,
    });
  });

  /**
   * 获取我的所有焦虑记录
   * GET /api/anxiety-records
   */
  getMyAnxietyRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      page = 1,
      pageSize = 10,
      orderBy = "createdAt",
      order = "desc",
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy,
      order,
    };

    const result = await anxietyHistoryService.getMyAnxietyRecords(userId, options);

    res.json({
      code: 200,
      message: "success",
      data: result.records,
      pagination: result.pagination,
    });
  });

  /**
   * 获取今天的焦虑记录
   * GET /api/anxiety-records/today
   */
  getTodayAnxietyRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const records = await anxietyHistoryService.getTodayAnxietyRecords(userId);

    res.json({
      code: 200,
      message: "success",
      data: records,
    });
  });

  /**
   * 删除单条焦虑记录
   * DELETE /api/anxiety-records/:id
   */
  deleteAnxietyRecord = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    await anxietyHistoryService.deleteAnxietyRecord(id, userId);

    res.json({
      code: 200,
      message: "焦虑记录删除成功",
    });
  });

  /**
   * 清空我的所有焦虑记录
   * DELETE /api/anxiety-records
   */
  clearMyAnxietyRecords = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await anxietyHistoryService.clearMyAnxietyRecords(userId);

    res.json({
      code: 200,
      message: "焦虑记录已清空",
      data: result,
    });
  });
}

export default new AnxietyHistoryController();
