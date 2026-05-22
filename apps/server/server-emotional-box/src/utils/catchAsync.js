// 如果不统一处理错误，会有以下问题：
// 1、每个 controller 都要写 try/catch（重复）
// 2、错误处理分散，难以统一格式
// 3、无法区分「业务错误 / 系统错误」
// 4、日志、监控、报警都不好接
/**
 * 这是一个高阶函数，用于包装异步路由处理函数。
 * 它可以自动捕获函数中抛出的任何错误，并将错误传递给 Express 的 next() 函数，
 * 从而触发全局的错误处理中间件。
 * * @param {Function} fn 异步的 Express 路由处理函数 (req, res, next) => Promise
 */
export const catchAsync = (fn) => {
  // 返回一个新的 Express 路由处理函数
  return (req, res, next) => {
    // 执行原始的异步函数 fn。
    // 如果 fn 内部出现 await 失败或抛出异常，.catch(next) 会自动调用 next(err)。
    fn(req, res, next).catch(next);
  };
};
