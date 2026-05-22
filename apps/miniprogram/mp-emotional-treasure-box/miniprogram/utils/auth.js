/**
 * 认证相关工具函数
 */

/**
 * 检查登录状态并引导登录
 * @param {Object} options 配置项
 * @param {String} options.title 弹窗标题
 * @param {String} options.content 弹窗内容
 * @returns {Boolean} 是否已登录
 */
function checkLoginWithTip(options = {}) {
  const app = getApp();
  const isLogin = app.checkLogin();
  
  if (!isLogin) {
    wx.showModal({
      title: options.title || '需要登录',
      content: options.content || '此功能需要登录后使用',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/profile/index' });
        }
      }
    });
  }
  
  return isLogin;
}

/**
 * 静默检查登录状态（不弹窗）
 * @returns {Boolean} 是否已登录
 */
function checkLogin() {
  const app = getApp();
  return app.checkLogin();
}

/**
 * 获取当前用户的 openid
 * @returns {String|null} openid
 */
function getOpenid() {
  const app = getApp();
  return app.globalData.openid;
}

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户信息
 */
function getUserInfo() {
  const app = getApp();
  return app.globalData.userInfo;
}

module.exports = {
  checkLoginWithTip,
  checkLogin,
  getOpenid,
  getUserInfo
};
