import { prisma } from '../db/index.js';

/**
 * 内容安全检测 Repository
 */
class SecurityRepository {
  /**
   * 记录安全检测日志
   * @param {Object} data - 检测日志数据
   * @returns {Promise<Object>}
   */
  async createSecurityLog(data) {
    return await prisma.securityLog.create({
      data: {
        userId: data.userId,
        content: data.content,
        contentType: data.contentType,
        result: data.result,
        label: data.label,
        score: data.score,
        suggestion: data.suggestion
      }
    });
  }
}

export default new SecurityRepository();
