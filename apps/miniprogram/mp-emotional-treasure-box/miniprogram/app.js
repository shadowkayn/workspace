// app.js
const authService = require('./services/auth.service');

App({
  onLaunch: function () {
    this.globalData = {
      // 开发环境：使用本地 IP 地址
      // 生产环境：使用线上域名
      apiBaseUrl: "http://192.168.20.49:3000/api", // 本地开发
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
      source: 'url("https://cdn.jsdelivr.net/gh/shadowkayn/mini-assets@main/fonts/ZhiMangXing-Regular.woff2")',
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
      imageUrl: '/images/share-cover.png' // 如果有分享图的话
    };
  }
});
