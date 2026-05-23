/**
 * 数据库模块统一导出
 */
export { default as prisma } from "./prisma.js";
export { connectDatabase, disconnectDatabase, checkDatabaseConnection } from "./connect.js";
