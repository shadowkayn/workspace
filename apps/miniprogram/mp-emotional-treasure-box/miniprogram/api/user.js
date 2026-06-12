const { get, post, put } = require('../utils/request');

function getUploadUrl(path) {
  const app = getApp();
  const baseUrl = (app.globalData.apiBaseUrl || 'http://localhost:3000/api').replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getUserById(id) {
  return get(`/users/${id}`);
}

function wechatLogin(data) {
  return post('/users/wechat-login', data);
}

function updateUser(id, data) {
  return put(`/users/${id}`, data);
}

function uploadAvatar(filePath) {
  const token = wx.getStorageSync('token');

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: getUploadUrl('/upload/avatar'),
      filePath,
      name: 'avatar',
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(res) {
        let body = {};

        try {
          body = JSON.parse(res.data || '{}');
        } catch (err) {
          reject(new Error('头像上传响应解析失败'));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300 && body.success && body.data && body.data.avatarUrl) {
          resolve(body.data);
          return;
        }

        reject(new Error(body.message || `头像上传失败(${res.statusCode})`));
      },
      fail(err) {
        reject(new Error(err.errMsg || '头像上传失败'));
      }
    });
  });
}

module.exports = {
  getUserById,
  wechatLogin,
  updateUser,
  uploadAvatar
};
