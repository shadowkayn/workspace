const { checkLogin, formatDate } = require('../../utils/index');

Page({
  data: {
    historyList: [],
    loading: true,
    isEmpty: false
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  // 加载粉碎历史
  async loadHistory() {
    if (!checkLogin()) {
      wx.showModal({
        title: '需要登录',
        content: '查看粉碎记录需要先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/index' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    this.setData({ loading: true });
    const db = wx.cloud.database();
    
    try {
      // 先获取总数
      const countResult = await db.collection('AnxietyHistory').count();
      const total = countResult.total;
      
      // 分批查询所有数据
      const batchSize = 100;
      const batchCount = Math.ceil(total / batchSize);
      const tasks = [];
      
      for (let i = 0; i < batchCount; i++) {
        const promise = db.collection('AnxietyHistory')
          .orderBy('createdAt', 'desc')
          .skip(i * batchSize)
          .limit(batchSize)
          .get();
        tasks.push(promise);
      }
      
      const results = await Promise.all(tasks);
      const allData = results.reduce((acc, res) => acc.concat(res.data), []);
      
      const historyList = allData.map(item => ({
        ...item,
        dateStr: this.formatDateTime(item.createdAt),
        dateOnly: formatDate(item.createdAt)
      }));
      
      this.setData({
        historyList,
        loading: false,
        isEmpty: historyList.length === 0
      });
    } catch (err) {
      console.error('加载历史失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 格式化日期时间
  formatDateTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const oneDay = 24 * 60 * 60 * 1000;

    // 今天
    if (diff < oneDay && d.getDate() === now.getDate()) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    }
    
    // 昨天
    if (diff < 2 * oneDay && d.getDate() === now.getDate() - 1) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    }

    // 更早
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.dateStr,
      content: item.content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 删除记录
  deleteItem(e) {
    const item = e.currentTarget.dataset.item;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('AnxietyHistory')
            .doc(item._id)
            .remove()
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadHistory();
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 清空所有记录
  clearAll() {
    if (this.data.isEmpty) return;

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有粉碎记录吗？此操作不可恢复',
      confirmText: '清空',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清空中...' });
          const db = wx.cloud.database();
          const _ = db.command;
          
          // 删除当前用户的所有记录
          db.collection('AnxietyHistory')
            .where({
              _openid: _.exists(true)
            })
            .remove()
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '已清空', icon: 'success' });
              this.loadHistory();
            })
            .catch(err => {
              wx.hideLoading();
              console.error('清空失败', err);
              wx.showToast({ title: '清空失败', icon: 'none' });
            });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '我已经粉碎了这些焦虑',
      path: '/pages/release/index'
    };
  }
});
