const userApi = require('../api/user');

function getAppInstance() {
  return getApp();
}

function syncLoginState(loginData) {
  const app = getAppInstance();
  const { user, token } = loginData;

  app.globalData.openid = user.openid;
  app.globalData.user = user;
  app.globalData.token = token;

  wx.setStorageSync('openid', user.openid);
  wx.setStorageSync('user', user);
  wx.setStorageSync('token', token);

  return user.openid;
}

function restoreLoginFromStorage() {
  const app = getAppInstance();

  try {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');

    if (userInfo && openid && token) {
      app.globalData.userInfo = userInfo;
      app.globalData.openid = openid;
      app.globalData.token = token;
      app.globalData.user = user || null;
    }
  } catch (err) {
    console.error('读取缓存失败', err);
  }
}

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error('获取 code 失败'));
          return;
        }

        userApi.wechatLogin({ code: res.code })
          .then((loginData) => {
            resolve(syncLoginState(loginData));
          })
          .catch(reject);
      },
      fail: reject
    });
  });
}

function checkLogin() {
  const app = getAppInstance();
  return !!(app.globalData.openid && app.globalData.userInfo && app.globalData.token);
}

function getUserProfile() {
  const app = getAppInstance();

  return new Promise((resolve, reject) => {
    const ensureLogin = app.globalData.openid ? Promise.resolve() : login();

    ensureLogin
      .then(() => requestUserProfile())
      .then(resolve)
      .catch(reject);
  });
}

function requestUserProfile() {
  const app = getAppInstance();

  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料和提供个性化服务',
      success: (res) => {
        app.globalData.userInfo = res.userInfo;
        wx.setStorageSync('userInfo', res.userInfo);
        saveUserInfo(res.userInfo);
        resolve(res.userInfo);
      },
      fail: (err) => {
        console.error('❌ 获取用户信息失败', err);
        reject(err);
      }
    });
  });
}

function saveUserInfo(userInfo) {
  const app = getAppInstance();

  if (!app.globalData.user || !app.globalData.user.id || !app.globalData.token) return;

  userApi.updateUser(app.globalData.user.id, {
    nickname: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl
  }).then((user) => {
    app.globalData.user = user;
    wx.setStorageSync('user', user);
  }).catch(err => {
    console.error('❌ 保存用户信息失败', err);
  });
}

function logout() {
  const app = getAppInstance();

  app.globalData.userInfo = null;
  app.globalData.openid = null;
  app.globalData.token = null;
  app.globalData.user = null;

  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('openid');
  wx.removeStorageSync('token');
  wx.removeStorageSync('user');
}

module.exports = {
  restoreLoginFromStorage,
  login,
  checkLogin,
  getUserProfile,
  requestUserProfile,
  saveUserInfo,
  logout
};
