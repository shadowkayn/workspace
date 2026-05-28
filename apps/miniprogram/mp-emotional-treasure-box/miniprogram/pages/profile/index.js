// pages/profile/index.js
Page({
  data: {
    userInfo: null,
    isLogin: false,
    // 用于首次登录填写
    showProfileDialog: false,
    tempAvatarUrl: '',
    tempNickname: ''
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

  // 一键登录
  handleLogin() {
    wx.showLoading({ title: '登录中...' });
    
    const app = getApp();
    
    // 静默登录获取 openid
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          return;
        }

        const { post } = require('../../utils/request');
        post('/users/wechat-login', {
          code: loginRes.code
        })
          .then((data) => {
            // 保存登录信息
            const { user, token } = data;
            
            app.globalData.openid = user.openid;
            app.globalData.user = user;
            app.globalData.token = token;
            
            wx.setStorageSync('openid', user.openid);
            wx.setStorageSync('user', user);
            wx.setStorageSync('token', token);
            
            wx.hideLoading();
            
            // 判断是否首次登录（昵称为默认值或为空）
            const isFirstLogin = !user.nickname || user.nickname === '微信用户' || user.nickname.startsWith('情绪观察员');
            
            if (isFirstLogin) {
              // 首次登录，弹出填写弹窗
              this.setData({
                showProfileDialog: true,
                tempNickname: '',
                tempAvatarUrl: ''
              });
            } else {
              // 非首次登录，直接登录成功
              const userInfo = {
                nickName: user.nickname,
                avatarUrl: user.avatarUrl || '/images/avatar.png'
              };
              
              app.globalData.userInfo = userInfo;
              wx.setStorageSync('userInfo', userInfo);
              
              this.setData({
                userInfo: userInfo,
                isLogin: true
              });
              
              wx.showToast({ title: '登录成功', icon: 'success' });
            }
          })
          .catch((err) => {
            wx.hideLoading();
            console.error('❌ 登录失败', err);
            wx.showToast({ title: err.message || '登录失败', icon: 'none' });
          });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('❌ wx.login 失败', err);
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      tempAvatarUrl: avatarUrl
    });
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 阻止事件冒泡（空函数）
  stopPropagation() {
    // 阻止点击弹窗内容时关闭弹窗
  },

  // 取消填写
  handleCancelProfile() {
    this.setData({
      showProfileDialog: false
    });
    
    // 清除登录信息
    const app = getApp();
    app.globalData.openid = null;
    app.globalData.user = null;
    app.globalData.token = null;
    wx.clearStorageSync();
    
    wx.showToast({ title: '已取消登录', icon: 'none' });
  },

  // 确认保存
  handleSaveProfile() {
    const { tempNickname, tempAvatarUrl } = this.data;
    
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    
    const app = getApp();
    
    if (!app.globalData.user || !app.globalData.user.id) {
      wx.showToast({ title: '登录状态异常', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '保存中...' });
    
    const { put } = require('../../utils/request');
    
    // 构建更新数据
    const updateData = {
      nickname: tempNickname.trim()
    };
    
    // 检查是否选择了头像（临时路径）
    const hasSelectedAvatar = tempAvatarUrl && tempAvatarUrl.length > 0;
    
    // 只有当头像是有效的 https URL 时才传递
    if (tempAvatarUrl && tempAvatarUrl.startsWith('https://')) {
      updateData.avatarUrl = tempAvatarUrl;
    }
    
    put(`/users/${app.globalData.user.id}`, updateData)
      .then((user) => {
        app.globalData.user = user;
        wx.setStorageSync('user', user);
        
        // 如果用户选择了临时头像，使用临时路径显示（仅本地）
        // 注意：临时路径在小程序重启后会失效
        const userInfo = {
          nickName: user.nickname,
          avatarUrl: hasSelectedAvatar && tempAvatarUrl ? tempAvatarUrl : (user.avatarUrl || '/images/avatar.png')
        };
        
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          userInfo: userInfo,
          isLogin: true,
          showProfileDialog: false
        });
        
        wx.hideLoading();
        
        // 如果选择了临时头像，提示用户
        if (hasSelectedAvatar && !tempAvatarUrl.startsWith('https://')) {
          wx.showToast({ 
            title: '登录成功（头像暂存本地）', 
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({ title: '登录成功', icon: 'success' });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('❌ 保存失败', err);
        wx.showToast({ title: err.message || '保存失败，请重试', icon: 'none' });
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
      imageUrl: 'https://res.cloudinary.com/kayn-admin-cloud/image/upload/v1774504376/clarity-n-bk_vwvqmq.png'
    };
  }
})
