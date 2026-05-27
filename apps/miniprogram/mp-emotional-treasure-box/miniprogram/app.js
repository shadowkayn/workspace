// app.js
const { post, put } = require('./utils/request');

App({
  onLaunch: function () {
    this.globalData = {
      env: "cloud1-7g27vhf9d8bd5dbb",
      apiBaseUrl: "http://localhost:3000/api",
      fontLoaded: false,
      userInfo: null,
      openid: null,
      token: null,
      user: null
    };
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

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

    // 检查本地缓存的登录信息
    this.checkLocalLogin();
  },

  // 检查本地缓存的登录信息
  checkLocalLogin() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const openid = wx.getStorageSync('openid');
      const token = wx.getStorageSync('token');
      const user = wx.getStorageSync('user');
      
      if (userInfo && openid && token) {
        this.globalData.userInfo = userInfo;
        this.globalData.openid = openid;
        this.globalData.token = token;
        this.globalData.user = user || null;
      }
    } catch (e) {
      console.error('读取缓存失败', e);
    }
  },

  // 微信官方登录流程
  login() {
    return new Promise((resolve, reject) => {
      // 调用 wx.login 获取 code
      wx.login({
        success: (res) => {
          if (res.code) {
            post('/users/wechat-login', { code: res.code }).then(loginRes => {
              const { user, token } = loginRes;
              this.globalData.openid = user.openid;
              this.globalData.user = user;
              this.globalData.token = token;
              wx.setStorageSync('openid', user.openid);
              wx.setStorageSync('user', user);
              wx.setStorageSync('token', token);
              resolve(user.openid);
            }).catch(reject);
          } else {
            reject(new Error('获取 code 失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 检查登录状态（需要用户授权信息）
  checkLogin() {
    // 必须同时有 openid 和 userInfo 才算登录
    return !!(this.globalData.openid && this.globalData.userInfo && this.globalData.token);
  },

  // 获取用户信息（需要用户授权）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      // 如果没有 openid，先登录
      if (!this.globalData.openid) {
        this.login().then(() => {
          this.requestUserProfile().then(resolve).catch(reject);
        }).catch(reject);
      } else {
        this.requestUserProfile().then(resolve).catch(reject);
      }
    });
  },

  // 请求用户授权信息
  requestUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料和提供个性化服务',
        success: (res) => {
          this.globalData.userInfo = res.userInfo;
          wx.setStorageSync('userInfo', res.userInfo);
          this.saveUserInfo(res.userInfo);
          resolve(res.userInfo);
        },
        fail: (err) => {
          console.error('❌ 获取用户信息失败', err);
          reject(err);
        }
      });
    });
  },

  // 保存用户信息到后端
  saveUserInfo(userInfo) {
    if (!this.globalData.user || !this.globalData.user.id || !this.globalData.token) return;

    put(`/users/${this.globalData.user.id}`, {
      nickname: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl
    }).then((user) => {
      this.globalData.user = user;
      wx.setStorageSync('user', user);
    }).catch(err => {
      console.error('❌ 保存用户信息失败', err);
    });
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
