/**
 * 路由入口文件
 * 统一管理所有路由模块
 */

import userRouter from "./user.router.js";
import quoteRouter from "./quote.router.js";
import moodRecordRouter from "./moodRecord.router.js";

// 路由配置对象
const routes = {
  "/users": userRouter,
  "/quotes": quoteRouter,
  "/mood-records": moodRecordRouter,
};

export default routes;
