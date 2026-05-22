/**
 * 路由入口文件
 * 统一管理所有路由模块
 */

import userRouter from "./user.router.js";

// 路由配置对象
const routes = {
  "/users": userRouter,
  // 可以继续添加其他路由
  // "/quotes": quoteRouter,
  // "/moods": moodRouter,
  // "/anxiety": anxietyRouter,
};

export default routes;
