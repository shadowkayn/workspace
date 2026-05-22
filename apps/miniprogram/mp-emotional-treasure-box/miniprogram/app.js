// app.js
App({
  onLaunch: function () {
    this.globalData = {
      env: "cloud1-7g27vhf9d8bd5dbb",
      fontLoaded: false,
      userInfo: null,
      openid: null
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
      
      if (userInfo && openid) {
        this.globalData.userInfo = userInfo;
        this.globalData.openid = openid;
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
            // 将 code 发送到云函数换取 openid
            wx.cloud.callFunction({
              name: 'quickstartFunctions',
              data: { type: 'getOpenId' }
            }).then(cloudRes => {
              this.globalData.openid = cloudRes.result.openid;
              wx.setStorageSync('openid', cloudRes.result.openid);
              resolve(cloudRes.result.openid);
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
    return !!(this.globalData.openid && this.globalData.userInfo);
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

  // 保存用户信息到云数据库
  saveUserInfo(userInfo) {
    if (!this.globalData.openid) return;
    
    const db = wx.cloud.database();
    // 使用 doc().set() 时不需要传 _id，文档 ID 已经在 doc() 中指定
    // 这样可以实现：如果文档不存在则创建，存在则更新
    db.collection('Users').doc(this.globalData.openid).set({
      data: {
        userInfo: userInfo,
        openid: this.globalData.openid,
        updateTime: db.serverDate()
      }
    }).then(() => {
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
