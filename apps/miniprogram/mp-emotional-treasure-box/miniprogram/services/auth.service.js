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
      
      // 静默验证 token 是否有效
      validateToken().catch(() => {
        // Token 无效，清除登录状态
        console.log('Token 已失效，清除登录状态');
        logout();
      });
    }
  } catch (err) {
    console.error('读取缓存失败', err);
  }
}

// 验证 token 是否有效
function validateToken() {
  const app = getAppInstance();
  
  if (!app.globalData.token || !app.globalData.user) {
    return Promise.reject(new Error('未登录'));
  }
  
  // 调用一个简单的接口验证 token（比如获取用户信息）
  return userApi.getUserById(app.globalData.user.id)
    .then(() => {
      console.log('Token 验证成功');
      return true;
    })
    .catch((err) => {
      console.error('Token 验证失败', err);
      return Promise.reject(err);
    });
}

function login() {
  return new Promise((resolve, reject) => {
    // 第一步：获取用户信息（需要用户授权）
    wx.getUserProfile({
      desc: '用于完善用户资料和提供个性化服务',
      success: (profileRes) => {
        const userInfo = profileRes.userInfo;
        
        // 第二步：获取微信登录 code
        wx.login({
          success: (loginRes) => {
            if (!loginRes.code) {
              reject(new Error('获取 code 失败'));
              return;
            }

            // 第三步：发送到后端（包含 code 和用户信息）
            userApi.wechatLogin({
              code: loginRes.code,
              nickname: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            })
              .then((loginData) => {
                // 保存用户信息到本地
                const app = getAppInstance();
                app.globalData.userInfo = userInfo;
                wx.setStorageSync('userInfo', userInfo);
                
                resolve(syncLoginState(loginData));
              })
              .catch(reject);
          },
          fail: reject
        });
      },
      fail: (err) => {
        console.error('❌ 获取用户信息失败', err);
        reject(new Error('获取用户信息失败，请授权后重试'));
      }
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
  validateToken,
  login,
  checkLogin,
  getUserProfile,
  requestUserProfile,
  saveUserInfo,
  logout
};
