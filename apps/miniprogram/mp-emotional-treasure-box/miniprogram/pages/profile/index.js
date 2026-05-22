// pages/profile/index.js
Page({
  data: {
    userInfo: null,
    isLogin: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    this.setData({
      isLogin: app.checkLogin(),
      userInfo: app.globalData.userInfo
    });
  },

  // 一键登录（使用 wx.login 获取 openid）
  handleLogin() {
    wx.showLoading({ title: '登录中...' });
    
    const app = getApp();
    
    app.login().then(openid => {
      // 生成默认用户信息
      const userInfo = {
        avatarUrl: '/images/avatar.png',
        nickName: '情绪观察员_' + openid.slice(-6)
      };
      
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      app.saveUserInfo(userInfo);
      
      wx.hideLoading();
      this.setData({
        userInfo: userInfo,
        isLogin: true
      });
      
      wx.showToast({ title: '登录成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    });
  },

  goToFavorites() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '查看收藏需要先登录',
        showCancel: false
      });
      return;
    }
    wx.navigateTo({ url: '/pages/favorites/index' });
  },

  goToMoodHistory() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '查看情绪历史需要先登录',
        showCancel: false
      });
      return;
    }
    wx.navigateTo({ url: '/pages/mood-history/index' });
  },

  goToHistory() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '查看粉碎历史需要先登录',
        showCancel: false
      });
      return;
    }
    wx.navigateTo({ url: '/pages/anxiety-history/index' });
  },

  onShareAppMessage() {
    return {
      title: '情绪宝藏盒 - 你的情绪观察员',
      path: '/pages/clarity/index',
      imageUrl: 'https://res.cloudinary.com/kayn-admin-cloud/image/upload/v1774504376/clarity-n-bk_vwvqmq.png' // 可选：自定义分享图（建议 5:4 比例）
    };
  }
})