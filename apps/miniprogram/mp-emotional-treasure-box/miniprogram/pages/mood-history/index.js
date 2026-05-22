const { checkLogin, formatDate } = require('../../utils/index');

Page({
  data: {
    records: [],
    loading: true,
    isEmpty: false,
    moodInfo: {},
    
    // 情绪选项
    moods: [
      { id: 'happy', name: '开心', emoji: '/images/icons/happy.png', textEmoji: '😊', color: '#74ff3d' },
      { id: 'calm', name: '平静', emoji: '/images/icons/calm.png', textEmoji: '😌', color: '#A8E6CF' },
      { id: 'anxious', name: '焦虑', emoji: '/images/icons/anxious.png', textEmoji: '😰', color: '#272525' },
      { id: 'sad', name: '低落', emoji: '/images/icons/sad.png', textEmoji: '😔', color: '#C7CEEA' },
      { id: 'angry', name: '愤怒', emoji: '/images/icons/angry.png', textEmoji: '😠', color: '#c81f2c' }
    ],
    
    // 统计数据
    moodStats: {},
    
    // 情绪关怀提示 - 治愈且直击心灵的话语
    moodTips: {
      happy: '你的笑容是这个世界最美的风景。请记住此刻的感受，它会成为你穿越黑暗时的光 ✨',
      calm: '在这个喧嚣的世界里，你找到了属于自己的宁静。这份平和，是你给自己最好的礼物 🌿',
      anxious: '焦虑不是你的敌人，它只是在提醒你：慢下来，深呼吸，你已经足够好了。一切都会过去的 🫂',
      sad: '悲伤是勇敢的证明，因为你允许自己真实地感受。黎明前的夜最黑，但太阳一定会升起 🌈',
      angry: '愤怒背后，往往藏着未被看见的委屈和需要。你有权利生气，也值得被温柔对待 🔥'
    }
  },

  onLoad() {
    this.loadHistory();
  },

  // 加载历史记录
  async loadHistory() {
    if (!checkLogin()) {
      wx.showModal({
        title: '需要登录',
        content: '查看历史记录需要先登录',
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
      const countResult = await db.collection('MoodRecords').count();
      const total = countResult.total;
      
      // 分批查询所有数据
      const batchSize = 100;
      const batchCount = Math.ceil(total / batchSize);
      const tasks = [];
      
      for (let i = 0; i < batchCount; i++) {
        const promise = db.collection('MoodRecords')
          .orderBy('createdAt', 'desc')
          .skip(i * batchSize)
          .limit(batchSize)
          .get();
        tasks.push(promise);
      }
      
      const results = await Promise.all(tasks);
      const allData = results.reduce((acc, res) => acc.concat(res.data), []);
      
      const records = allData.map(item => ({
        ...item,
        dateStr: this.formatDateTime(item.createdAt)
      }));
      
      this.setData({
        records,
        loading: false,
        isEmpty: records.length === 0
      });
      
      this.calculateStats(records);
    } catch (err) {
      console.error('加载历史失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 计算统计数据
  calculateStats(records) {
    const stats = {};
    records.forEach(record => {
      stats[record.mood] = (stats[record.mood] || 0) + 1;
    });
    
    // 找出最频繁的情绪（次数相同时按优先级）
    const moodPriority = ['anxious', 'sad', 'angry', 'calm', 'happy'];
    let maxCount = 0;
    let mostFrequent = null;
    
    // 先找出最大次数
    Object.keys(stats).forEach(mood => {
      if (stats[mood] > maxCount) {
        maxCount = stats[mood];
      }
    });
    
    // 在最大次数的情绪中，按优先级选择
    if (maxCount > 0) {
      for (let mood of moodPriority) {
        if (stats[mood] === maxCount) {
          mostFrequent = mood;
          break;
        }
      }
    }
    
    this.setData({ 
      moodStats: stats,
      moodInfo: this.getMoodInfo(mostFrequent)
    });
  },

  // 格式化日期时间
  formatDateTime(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}月${day}日`;
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    const moodInfo = this.getMoodInfo(item.mood);
    
    const content = item.note ? item.note : '没有备注';
    
    wx.showModal({
      title: `${moodInfo.textEmoji || ''} ${moodInfo.name} - ${item.dateStr}`,
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 删除记录
  deleteRecord(e) {
    const item = e.currentTarget.dataset.item;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('MoodRecords')
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

  // 获取情绪信息
  getMoodInfo(moodId) {
    return this.data.moods.find(m => m.id === moodId) || {};
  },

  onShareAppMessage() {
    return {
      title: '我在记录情绪，觉察自己',
      path: '/pages/breathe/index'
    };
  }
});
