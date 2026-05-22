/**
 * 请求日志中间件
 * 记录所有进入的 HTTP 请求
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 记录请求信息
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

  // 监听响应完成事件
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m"; // 红色表示错误，绿色表示成功
    const resetColor = "\x1b[0m";

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
  });

  next();
};

/**
 * 详细请求日志中间件（开发环境使用）
 * 记录请求的详细信息，包括请求体、查询参数等
 */
export const detailedLogger = (req, res, next) => {
  const startTime = Date.now();

  console.log("\n========== 请求详情 ==========");
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`方法: ${req.method}`);
  console.log(`路径: ${req.originalUrl}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`User-Agent: ${req.get("user-agent")}`);

  if (Object.keys(req.query).length > 0) {
    console.log("查询参数:", JSON.stringify(req.query, null, 2));
  }

  if (Object.keys(req.params).length > 0) {
    console.log("路由参数:", JSON.stringify(req.params, null, 2));
  }

  if (req.body && Object.keys(req.body).length > 0) {
    // 隐藏敏感信息
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = "***";
    if (sanitizedBody.token) sanitizedBody.token = "***";
    console.log("请求体:", JSON.stringify(sanitizedBody, null, 2));
  }

  if (req.headers.authorization) {
    console.log("认证: Bearer ***");
  }

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(`响应状态: ${res.statusCode}`);
    console.log(`耗时: ${duration}ms`);
    console.log("==============================\n");
  });

  next();
};
