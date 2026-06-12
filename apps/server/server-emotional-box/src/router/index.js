/**
 * 路由入口文件
 * 统一管理所有路由模块
 */

import userRouter from "./user.router.js";
import quoteRouter from "./quote.router.js";
import moodRecordRouter from "./moodRecord.router.js";
import anxietyHistoryRouter from "./anxietyHistory.router.js";
import backgroundImageRouter from "./backgroundImage.router.js";
import uploadRouter from "./upload.router.js";
import securityRouter from "./security.router.js";

// 路由配置对象
const routes = {
  "/users": userRouter,
  "/quotes": quoteRouter,
  "/mood-records": moodRecordRouter,
  "/anxiety-records": anxietyHistoryRouter,
  "/background-images": backgroundImageRouter,
  "/upload": uploadRouter,
  "/security": securityRouter,
};

export default routes;
