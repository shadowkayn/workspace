// app.js
const authService = require('./services/auth.service');

// ==================== 环境配置切换 ====================
// 可选值：'development' (本地开发) 或 'production' (Render线上线上测试)
const CURRENT_ENV = 'production';

const API_CONFIG = {
  development: "http://192.168.20.49:3000/api",
  production: "https://emotional-box-api.onrender.com/api" // 👈 把这里替换成你的 Render 公网地址（注意保留结尾的 /api）
};
// ====================================================

App({
  onLaunch: function () {
    this.globalData = {
      // 根据当前环境自动获取对应的 API 地址
      apiBaseUrl: API_CONFIG[CURRENT_ENV],
      fontLoaded: false,
      userInfo: null,
      openid: null,
      token: null,
      user: null
    };

    // 加载自定义字体
    wx.loadFontFace({
      global: true,
      family: 'ZCool',
      source: 'url("https://cdn.jsdelivr.net/gh/shadowkayn/mini-assets@main/fonts/ZCOOLXiaoWei-Regular.ttf")',
      scopes: ['webview', 'native'],
      success: (res) => {
        this.globalData.fontLoaded = true;
      },
      fail: (err) => {
        console.error('❌ 字体加载失败', err);
        this.globalData.fontLoaded = false;
      }
    });

    authService.restoreLoginFromStorage();
  },

  checkLocalLogin() {
    authService.restoreLoginFromStorage();
  },

  login() {
    return authService.login();
  },

  checkLogin() {
    return authService.checkLogin();
  },

  getUserProfile() {
    return authService.getUserProfile();
  },

  requestUserProfile() {
    return authService.requestUserProfile();
  },

  saveUserInfo(userInfo) {
    return authService.saveUserInfo(userInfo);
  },

  // 全局分享配置
  onShareAppMessage() {
    return {
      title: '情绪宝藏盒 - 你的情绪观察员',
      path: '/pages/clarity/index',
      imageUrl: '/images/share-cover.png'
    };
  }
});