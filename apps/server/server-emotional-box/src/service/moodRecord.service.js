import moodRecordRepository from "../repository/moodRecord.repository.js";
import { AppError } from "../middleware/errorHandler.middleware.js";

/**
 * 情绪日记业务逻辑层
 */
class MoodRecordService {
  // 有效的情绪类型
  static VALID_MOODS = [
    "happy",
    "sad",
    "anxious",
    "calm",
    "excited",
    "angry",
    "tired",
    "peaceful",
  ];

  // 情绪中文映射
  static MOOD_LABELS = {
    happy: "开心",
    sad: "难过",
    anxious: "焦虑",
    calm: "平静",
    excited: "兴奋",
    angry: "生气",
    tired: "疲惫",
    peaceful: "安宁",
  };

  /**
   * 创建情绪日记
   */
  async createMoodRecord(userId, data) {
    const { title, content, mood, moodScore, tags, weather, location, isPrivate } = data;

    // 验证必填字段
    if (!content || content.trim().length === 0) {
      throw new AppError("日记内容不能为空", 400);
    }

    if (!mood) {
      throw new AppError("请选择情绪类型", 400);
    }

    // 验证情绪类型
    if (!MoodRecordService.VALID_MOODS.includes(mood)) {
      throw new AppError(
        `无效的情绪类型，有效值：${MoodRecordService.VALID_MOODS.join(", ")}`,
        400
      );
    }

    // 验证情绪分数
    if (moodScore !== undefined && (moodScore < 1 || moodScore > 10)) {
      throw new AppError("情绪强度必须在 1-10 之间", 400);
    }

    // 验证内容长度
    if (content.length > 10000) {
      throw new AppError("日记内容不能超过 10000 字", 400);
    }

    if (title && title.length > 100) {
      throw new AppError("日记标题不能超过 100 字", 400);
    }

    const recordData = {
      userId,
      title: title?.trim() || null,
      content: content.trim(),
      mood,
      moodScore: moodScore || 5,
      tags: tags || [],
      weather: weather?.trim() || null,
      location: location?.trim() || null,
      isPrivate: isPrivate || false,
    };

    return await moodRecordRepository.create(recordData);
  }

  /**
   * 获取日记详情
   */
  async getMoodRecordById(id, userId) {
    const record = await moodRecordRepository.findById(id);

    if (!record) {
      throw new AppError("日记不存在", 404);
    }

    // 检查权限：只能查看自己的日记
    if (record.userId !== userId) {
      throw new AppError("无权访问此日记", 403);
    }

    return record;
  }

  /**
   * 获取我的日记列表
   */
  async getMyMoodRecords(userId, options) {
    return await moodRecordRepository.findByUserId(userId, options);
  }

  /**
   * 更新日记
   */
  async updateMoodRecord(id, userId, data) {
    const record = await moodRecordRepository.findById(id);

    if (!record) {
      throw new AppError("日记不存在", 404);
    }

    // 检查权限
    if (record.userId !== userId) {
      throw new AppError("无权修改此日记", 403);
    }

    const { title, content, mood, moodScore, tags, weather, location, isPrivate } = data;

    // 验证更新数据
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        throw new AppError("日记内容不能为空", 400);
      }
      if (content.length > 10000) {
        throw new AppError("日记内容不能超过 10000 字", 400);
      }
    }

    if (title !== undefined && title && title.length > 100) {
      throw new AppError("日记标题不能超过 100 字", 400);
    }

    if (mood !== undefined && !MoodRecordService.VALID_MOODS.includes(mood)) {
      throw new AppError(
        `无效的情绪类型，有效值：${MoodRecordService.VALID_MOODS.join(", ")}`,
        400
      );
    }

    if (moodScore !== undefined && (moodScore < 1 || moodScore > 10)) {
      throw new AppError("情绪强度必须在 1-10 之间", 400);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (mood !== undefined) updateData.mood = mood;
    if (moodScore !== undefined) updateData.moodScore = moodScore;
    if (tags !== undefined) updateData.tags = tags;
    if (weather !== undefined) updateData.weather = weather?.trim() || null;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    return await moodRecordRepository.update(id, updateData);
  }

  /**
   * 删除日记
   */
  async deleteMoodRecord(id, userId) {
    const record = await moodRecordRepository.findById(id);

    if (!record) {
      throw new AppError("日记不存在", 404);
    }

    // 检查权限
    if (record.userId !== userId) {
      throw new AppError("无权删除此日记", 403);
    }

    await moodRecordRepository.delete(id);
    return { message: "日记已删除" };
  }

  /**
   * 按日期查询日记
   */
  async getMoodRecordsByDate(userId, date) {
    // 验证日期格式
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new AppError("无效的日期格式", 400);
    }

    return await moodRecordRepository.findByDate(userId, date);
  }

  /**
   * 获取情绪统计
   */
  async getMoodStats(userId, startDate, endDate) {
    // 验证日期
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new AppError("无效的开始日期格式", 400);
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new AppError("无效的结束日期格式", 400);
      }
    }

    const stats = await moodRecordRepository.getMoodStats(userId, startDate, endDate);

    // 添加中文标签
    stats.moodDistribution = stats.moodDistribution.map((item) => ({
      ...item,
      moodLabel: MoodRecordService.MOOD_LABELS[item.mood] || item.mood,
    }));

    return stats;
  }

  /**
   * 获取最近的日记
   */
  async getRecentMoodRecords(userId, limit = 5) {
    if (limit < 1 || limit > 50) {
      throw new AppError("limit 必须在 1-50 之间", 400);
    }

    return await moodRecordRepository.getRecent(userId, limit);
  }

  /**
   * 获取近N天的情绪记录（用于图表展示）
   */
  async getRecentDaysMoodRecords(userId, days = 7) {
    if (days < 1 || days > 30) {
      throw new AppError("days 必须在 1-30 之间", 400);
    }

    const records = await moodRecordRepository.getRecentDays(userId, days);

    // 按日期分组统计
    const dateMap = new Map();
    
    // 获取今天的本地日期（不受时区影响）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 初始化近N天的日期（包含今天）
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      dateMap.set(dateStr, {
        date: dateStr,
        count: 0,
        records: [],
        avgScore: 0,
        moods: {},
      });
    }

    // 统计每天的数据
    records.forEach((record) => {
      const recordDate = new Date(record.createdAt);
      const year = recordDate.getFullYear();
      const month = String(recordDate.getMonth() + 1).padStart(2, "0");
      const day = String(recordDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      if (dateMap.has(dateStr)) {
        const dayData = dateMap.get(dateStr);
        dayData.count++;
        dayData.records.push({
          id: record.id,
          mood: record.mood,
          moodScore: record.moodScore,
          title: record.title,
          tags: record.tags,
          createdAt: record.createdAt,
        });

        // 统计情绪类型
        if (!dayData.moods[record.mood]) {
          dayData.moods[record.mood] = {
            mood: record.mood,
            moodLabel: MoodRecordService.MOOD_LABELS[record.mood] || record.mood,
            count: 0,
            totalScore: 0,
          };
        }
        dayData.moods[record.mood].count++;
        dayData.moods[record.mood].totalScore += record.moodScore;
      }
    });

    // 计算每天的平均分数和主要情绪
    const result = Array.from(dateMap.values()).map((dayData) => {
      if (dayData.count > 0) {
        const totalScore = dayData.records.reduce((sum, r) => sum + r.moodScore, 0);
        dayData.avgScore = parseFloat((totalScore / dayData.count).toFixed(2));

        // 找出当天最多的情绪
        const moodsArray = Object.values(dayData.moods);
        if (moodsArray.length > 0) {
          const dominantMood = moodsArray.reduce((prev, current) =>
            current.count > prev.count ? current : prev
          );
          dayData.dominantMood = {
            mood: dominantMood.mood,
            moodLabel: dominantMood.moodLabel,
            count: dominantMood.count,
            avgScore: parseFloat((dominantMood.totalScore / dominantMood.count).toFixed(2)),
          };
        }

        // 转换 moods 对象为数组
        dayData.moods = moodsArray.map((m) => ({
          mood: m.mood,
          moodLabel: m.moodLabel,
          count: m.count,
          avgScore: parseFloat((m.totalScore / m.count).toFixed(2)),
        }));
      }

      return dayData;
    });

    return {
      days,
      startDate: result[0]?.date,
      endDate: result[result.length - 1]?.date,
      totalRecords: records.length,
      data: result,
    };
  }
}

export default new MoodRecordService();
