import anxietyHistoryRepository from "../repository/anxietyHistory.repository.js";
import { AppError } from "../middleware/errorHandler.middleware.js";

/**
 * 焦虑记录业务逻辑层
 */
class AnxietyHistoryService {
  /**
   * 创建焦虑记录
   */
  async createAnxietyRecord(userId, data) {
    const { score, reason } = data;

    // 验证必填字段
    if (score === undefined || score === null) {
      throw new AppError("焦虑分值不能为空", 400);
    }

    // 验证分值范围（假设 1-10）
    if (score < 1 || score > 10) {
      throw new AppError("焦虑分值必须在 1-10 之间", 400);
    }

    // 验证原因长度
    if (reason && reason.length > 5000) {
      throw new AppError("焦虑原因不能超过 5000 字", 400);
    }

    const recordData = {
      userId,
      score,
      reason: reason?.trim() || null,
    };

    return await anxietyHistoryRepository.create(recordData);
  }

  /**
   * 获取我的所有焦虑记录
   */
  async getMyAnxietyRecords(userId, options) {
    return await anxietyHistoryRepository.findByUserId(userId, options);
  }

  /**
   * 获取今天的焦虑记录
   */
  async getTodayAnxietyRecords(userId) {
    return await anxietyHistoryRepository.findTodayByUserId(userId);
  }
}

export default new AnxietyHistoryService();
