import axios from 'axios';
import securityRepository from '../repository/security.repository.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

/**
 * 内容安全检测 Service
 */
class SecurityService {
  /**
   * 检测文本内容安全
   * @param {string} content - 要检测的文本
   * @param {string} userId - 用户ID（可选，用于日志）
   * @param {string} contentType - 内容类型（可选，用于日志）
   * @returns {Promise<{safe: boolean, message: string}>}
   */
  async checkTextSecurity(content, userId = null, contentType = 'text') {
    // 内容为空，直接通过
    if (!content || content.trim() === '') {
      return {
        safe: true,
        message: '内容为空'
      };
    }

    // 微信内容安全检测 API
    // 需要 access_token，这里简化处理
    // 实际生产环境需要实现完整的 access_token 获取和刷新机制
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
        {
          content: content,
          version: 2,
          scene: 2, // 2-内容检测场景
          openid: userId || 'anonymous'
        },
        {
          timeout: 5000
        }
      );

      const result = response.data;

      // errcode === 0 表示内容正常
      if (result.errcode === 0) {
        const isRisky = result.result && result.result.suggest === 'risky';
        
        // 记录日志
        if (userId) {
          await this.logSecurityCheck(userId, content, contentType, result);
        }

        return {
          safe: !isRisky,
          message: isRisky ? '内容包含敏感信息，请修改后重试' : '内容安全'
        };
      } else {
        // API 调用失败
        console.error('微信内容安全检测失败:', result);
        
        // 如果是开发环境，放行；生产环境，保守处理
        if (process.env.NODE_ENV === 'development') {
          return {
            safe: true,
            message: '开发环境，跳过检测'
          };
        }
        
        return {
          safe: false,
          message: '内容检测服务异常，请稍后重试'
        };
      }
    } catch (error) {
      console.error('内容安全检测异常:', error.message);
      
      // 开发环境放行，生产环境保守处理
      if (process.env.NODE_ENV === 'development') {
        return {
          safe: true,
          message: '开发环境，跳过检测'
        };
      }
      
      return {
        safe: false,
        message: '内容检测服务异常，请稍后重试'
      };
    }
  }

  /**
   * 获取微信 access_token
   * 实际生产环境应该：
   * 1. 从数据库或缓存中读取
   * 2. 检查是否过期
   * 3. 过期则重新获取
   * 4. 存储到数据库或缓存
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      throw new AppError('微信配置信息不完整', 500);
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token`,
        {
          params: {
            grant_type: 'client_credential',
            appid: appId,
            secret: appSecret
          },
          timeout: 5000
        }
      );

      if (response.data.access_token) {
        return response.data.access_token;
      } else {
        throw new Error('获取 access_token 失败');
      }
    } catch (error) {
      console.error('获取微信 access_token 失败:', error.message);
      throw new AppError('获取微信访问令牌失败', 500);
    }
  }

  /**
   * 记录安全检测日志
   * @param {string} userId - 用户ID
   * @param {string} content - 检测内容
   * @param {string} contentType - 内容类型
   * @param {Object} result - 检测结果
   */
  async logSecurityCheck(userId, content, contentType, result) {
    try {
      const resultData = result.result || {};
      
      await securityRepository.createSecurityLog({
        userId,
        content: content.substring(0, 1000), // 限制长度
        contentType,
        result: resultData.suggest || 'pass',
        label: resultData.label ? JSON.stringify(resultData.label) : null,
        score: resultData.score || null,
        suggestion: resultData.suggest || 'pass'
      });
    } catch (error) {
      // 日志记录失败不影响主流程
      console.error('记录安全检测日志失败:', error.message);
    }
  }
}

export default new SecurityService();
