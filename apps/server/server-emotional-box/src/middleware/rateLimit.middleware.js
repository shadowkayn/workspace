/**
 * 简单的内存限流中间件
 * 生产环境建议使用 Redis 实现分布式限流
 */

/**
 * 创建限流中间件
 * @param {Object} options - 配置选项
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {number} options.max - 最大请求次数
 * @param {string} options.message - 超限时的提示信息
 * @param {string} options.key - 限流器的唯一标识（用于隔离不同限流器的存储）
 * @returns {Function} Express 中间件
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 默认 15 分钟
  max = 100, // 默认 100 次
  message = "请求过于频繁，请稍后再试",
  key = 'default', // 限流器标识
} = {}) => {
  // 每个限流器有自己独立的存储空间
  const requestStore = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // 获取该 IP 的请求记录
    let record = requestStore.get(ip);

    // 如果没有记录或时间窗口已过期，创建新记录
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestStore.set(ip, record);
      return next();
    }

    // 增加请求计数
    record.count++;

    // 检查是否超过限制
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set("Retry-After", retryAfter);
      return res.status(429).json({
        code: 429,
        message,
        retryAfter: `${retryAfter}秒后重试`,
      });
    }

    // 设置响应头
    res.set("X-RateLimit-Limit", max);
    res.set("X-RateLimit-Remaining", max - record.count);
    res.set("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    next();
  };
};

/**
 * 清理过期的限流记录（定期执行）
 * 注意：由于每个限流器现在有独立的存储，这个函数不再需要
 */
export const cleanupExpiredRecords = () => {
  // 已废弃：每个限流器会在检查时自动清理过期记录
};

/**
 * 预设的限流配置
 */
export const rateLimitPresets = {
  // 严格限流：1 分钟 10 次
  strict: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: "请求过于频繁，请 1 分钟后再试",
    key: 'strict',
  }),

  // 普通限流：15 分钟 100 次
  normal: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "请求过于频繁，请稍后再试",
    key: 'normal',
  }),

  // 宽松限流：1 小时 1000 次
  loose: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: "请求过于频繁，请稍后再试",
    key: 'loose',
  }),

  // 登录限流：开发环境 15 分钟 50 次，生产环境 15 分钟 5 次
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 50,
    message: "登录尝试次数过多，请 15 分钟后再试",
    key: 'login',
  }),
};
