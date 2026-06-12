// pages/profile/index.js
const userApi = require('../../api/user');

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
    const hasLocalLogin = app.checkLogin();
    
    // 先用本地状态更新 UI
    this.setData({
      isLogin: hasLocalLogin,
      userInfo: app.globalData.userInfo
    });
    
    // 如果本地显示已登录，静默验证 token 是否有效
    if (hasLocalLogin && app.globalData.user && app.globalData.user.id) {
      const { get } = require('../../utils/request');
      
      get(`/users/${app.globalData.user.id}`)
        .then(() => {
          // Token 有效，保持登录状态
          console.log('✓ Token 验证成功');
        })
        .catch((err) => {
          // Token 无效，清除登录状态并更新 UI
          console.log('✗ Token 验证失败，清除登录状态');
          
          app.globalData.token = null;
          app.globalData.openid = null;
          app.globalData.user = null;
          app.globalData.userInfo = null;
          
          this.setData({
            isLogin: false,
            userInfo: null
          });
        });
    }
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
                tempAvatarUrl: '',
                isLogin: false // 标记为首次登录状态
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

  // 编辑资料（已登录用户点击头像）
  handleEditProfile() {
    if (!this.data.isLogin) {
      // 未登录，触发登录
      this.handleLogin();
      return;
    }

    // 已登录，打开编辑弹窗
    const { userInfo } = this.data;
    this.setData({
      showProfileDialog: true,
      tempNickname: userInfo.nickName || '',
      tempAvatarUrl: userInfo.avatarUrl || ''
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('✓ 选择头像:', avatarUrl);
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

  // 取消填写（首次登录时）
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

  // 关闭弹窗（已登录用户编辑时）
  handleCloseDialog() {
    this.setData({
      showProfileDialog: false,
      tempNickname: '',
      tempAvatarUrl: ''
    });
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
    
    // 如果选择了头像，先上传头像
    if (tempAvatarUrl && !tempAvatarUrl.startsWith('https://')) {
      this.uploadAvatarAndSave(tempNickname, tempAvatarUrl);
    } else {
      // 没有选择头像或已经是 https URL，直接保存
      this.saveUserProfile(tempNickname, tempAvatarUrl);
    }
  },

  // 上传头像并保存
  uploadAvatarAndSave(nickname, tempAvatarPath) {
    userApi.uploadAvatar(tempAvatarPath)
      .then((data) => {
        this.saveUserProfile(nickname, data.avatarUrl);
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('❌ 头像上传失败', err);
        wx.showToast({ title: err.message || '头像上传失败，请重试', icon: 'none' });
      });
  },

  // 保存用户资料
  saveUserProfile(nickname, avatarUrl) {
    const app = getApp();
    const { put } = require('../../utils/request');
    
    // 构建更新数据
    const updateData = {
      nickname: nickname.trim()
    };
    
    // 如果有头像 URL，添加到更新数据
    if (avatarUrl && avatarUrl.startsWith('https://')) {
      updateData.avatarUrl = avatarUrl;
    }
    
    put(`/users/${app.globalData.user.id}`, updateData)
      .then((user) => {
        app.globalData.user = user;
        wx.setStorageSync('user', user);
        
        const userInfo = {
          nickName: user.nickname,
          avatarUrl: user.avatarUrl || '/images/avatar.png'
        };
        
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({
          userInfo: userInfo,
          isLogin: true,
          showProfileDialog: false
        });
        
        wx.hideLoading();
        
        // 判断是首次登录还是编辑
        const isFirstLogin = !this.data.isLogin;
        wx.showToast({ 
          title: isFirstLogin ? '登录成功' : '保存成功', 
          icon: 'success' 
        });
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
