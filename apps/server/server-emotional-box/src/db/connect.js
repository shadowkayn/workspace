import prisma from "./prisma.js";

/**
 * 数据库连接管理
 */

/**
 * 连接数据库
 * @returns {Promise<void>}
 */
export async function connectDatabase() {
  try {
    // 测试连接
    await prisma.$connect();
    console.log("✓ 数据库连接成功");
    
    // 执行一个简单的查询来验证连接
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ 数据库查询测试通过");
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    throw error;
  }
}

/**
 * 断开数据库连接
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✓ 数据库连接已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接失败:", error.message);
    throw error;
  }
}

/**
 * 检查数据库连接状态
 * @returns {Promise<boolean>} 连接是否正常
 */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("❌ 数据库连接检查失败:", error.message);
    return false;
  }
}

/**
 * 数据库健康检查（返回详细信息）
 * @returns {Promise<Object>} 健康检查结果
 */
export async function getDatabaseHealth() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
