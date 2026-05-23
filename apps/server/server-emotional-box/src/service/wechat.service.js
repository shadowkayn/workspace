import axios from "axios";
import { AppError } from "../middleware/errorHandler.middleware.js";

/**
 * 微信小程序服务
 */
class WechatService {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.apiBaseUrl = "https://api.weixin.qq.com";
  }

  /**
   * 验证配置是否完整
   */
  validateConfig() {
    if (!this.appId || !this.appSecret) {
      throw new AppError(
        "微信小程序配置不完整，请在 .env 文件中配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET",
        500
      );
    }
  }

  /**
   * 通过 code 换取 openid 和 session_key
   * @param {string} code - 小程序登录时获取的 code
   * @returns {Promise<Object>} { openid, session_key, unionid }
   */
  async code2Session(code) {
    if (!code) {
      throw new AppError("code 不能为空", 400);
    }

    this.validateConfig();

    try {
      const response = await axios.get(`${this.apiBaseUrl}/sns/jscode2session`, {
        params: {
          appid: this.appId,
          secret: this.appSecret,
          js_code: code,
          grant_type: "authorization_code",
        },
        timeout: 10000, // 10秒超时
      });

      const { errcode, errmsg, openid, session_key, unionid } = response.data;

      // 检查微信 API 返回的错误
      if (errcode) {
        console.error("微信登录失败:", { errcode, errmsg });
        
        // 常见错误码处理
        const errorMessages = {
          40029: "code 无效",
          45011: "API 调用太频繁，请稍后再试",
          40163: "code 已被使用",
          "-1": "系统繁忙，请稍后再试",
        };

        const message = errorMessages[errcode] || `微信登录失败: ${errmsg}`;
        throw new AppError(message, 400);
      }

      if (!openid) {
        throw new AppError("获取 openid 失败", 500);
      }

      return {
        openid,
        session_key,
        unionid, // 如果小程序绑定了开放平台账号，会返回 unionid
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // 网络错误或其他错误
      console.error("调用微信 API 失败:", error.message);
      throw new AppError("微信服务暂时不可用，请稍后再试", 500);
    }
  }

  /**
   * 解密微信小程序加密数据
   * @param {string} encryptedData - 加密数据
   * @param {string} iv - 初始向量
   * @param {string} sessionKey - 会话密钥
   * @returns {Object} 解密后的数据
   */
  decryptData(encryptedData, iv, sessionKey) {
    // 这里需要使用微信提供的解密算法
    // 可以使用 npm 包: wx-js-utils 或自己实现
    // 暂时留空，后续需要时再实现
    throw new AppError("数据解密功能暂未实现", 501);
  }

  /**
   * 获取小程序全局唯一后台接口调用凭据（access_token）
   * 注意：access_token 有效期为 2 小时，需要缓存
   * @returns {Promise<string>} access_token
   */
  async getAccessToken() {
    this.validateConfig();

    try {
      const response = await axios.get(`${this.apiBaseUrl}/cgi-bin/token`, {
        params: {
          grant_type: "client_credential",
          appid: this.appId,
          secret: this.appSecret,
        },
        timeout: 10000,
      });

      const { errcode, errmsg, access_token, expires_in } = response.data;

      if (errcode) {
        console.error("获取 access_token 失败:", { errcode, errmsg });
        throw new AppError(`获取 access_token 失败: ${errmsg}`, 500);
      }

      return {
        access_token,
        expires_in, // 有效期，单位：秒
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error("调用微信 API 失败:", error.message);
      throw new AppError("微信服务暂时不可用，请稍后再试", 500);
    }
  }

  /**
   * 检查微信配置是否可用
   * @returns {Promise<boolean>}
   */
  async checkConfig() {
    try {
      this.validateConfig();
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error("微信配置检查失败:", error.message);
      return false;
    }
  }
}

export default new WechatService();
