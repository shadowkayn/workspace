const { post, put } = require('../utils/request');

function wechatLogin(data) {
  return post('/users/wechat-login', data);
}

function updateUser(id, data) {
  return put(`/users/${id}`, data);
}

module.exports = {
  wechatLogin,
  updateUser
};
