const DEFAULT_BASE_URL = 'http://localhost:3000/api';

function getBaseUrl() {
  const app = getApp();
  return app.globalData.apiBaseUrl || DEFAULT_BASE_URL;
}

function buildUrl(path, data = {}) {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const query = Object.keys(data)
    .filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');

  return `${baseUrl}${normalizedPath}${query ? `?${query}` : ''}`;
}

function request(options) {
  const token = wx.getStorageSync('token');
  const method = options.method || 'GET';
  const isGet = method.toUpperCase() === 'GET';

  return new Promise((resolve, reject) => {
    wx.request({
      url: isGet ? buildUrl(options.url, options.data) : buildUrl(options.url),
      method,
      data: isGet ? undefined : options.data,
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success(res) {
        const body = res.data || {};

        if (res.statusCode >= 200 && res.statusCode < 300 && body.code < 400) {
          resolve(body.pagination ? { data: body.data, pagination: body.pagination } : body.data);
          return;
        }

        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
        }

        reject(new Error(body.message || `请求失败(${res.statusCode})`));
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

module.exports = {
  request,
  get: (url, data, options = {}) => request({ ...options, url, data, method: 'GET' }),
  post: (url, data, options = {}) => request({ ...options, url, data, method: 'POST' }),
  put: (url, data, options = {}) => request({ ...options, url, data, method: 'PUT' }),
  del: (url, data, options = {}) => request({ ...options, url, data, method: 'DELETE' })
};
