const { checkLoginWithTip, formatDateDash, checkTextSecurityWithLoading } = require('../../utils/index');

Page({
  data: {
    // 今日情绪
    todayMood: null,
    todayNote: '',
    todayRecorded: false,
    
    // 情绪选项
    moods: [
      { id: 'happy', name: '开心', emoji: '/images/icons/happy.png', textEmoji: '😊', color: '#74ff3d' },
      { id: 'calm', name: '平静', emoji: '/images/icons/calm.png', textEmoji: '😌', color: '#A8E6CF' },
      { id: 'anxious', name: '焦虑', emoji: '/images/icons/anxious.png', textEmoji: '😰', color: '#272525' },
      { id: 'sad', name: '低落', emoji: '/images/icons/sad.png', textEmoji: '😔', color: '#C7CEEA' },
      { id: 'angry', name: '愤怒', emoji: '/images/icons/angry.png', textEmoji: '😠', color: '#c81f2c' }
    ],
    
    // 统计数据
    totalRecords: 0,
    recentMoods: [], // 最近7天的情绪
    moodStats: {}, // 情绪统计
    moodInfo: {},
    
    // 情绪提示语
    moodTips: {
      happy: '保持这份快乐，记得分享给身边的人 ✨',
      calm: '平静是一种力量，继续保持内心的安宁 🌿',
      anxious: '深呼吸，一切都会好起来的。试试运动或冥想来缓解焦虑 🫂',
      sad: '允许自己感受悲伤，这也是成长的一部分。需要时记得寻求支持 🌈',
      angry: '愤怒是正常的情绪，找到合适的方式表达和释放很重要 🔥'
    }
  },

  onLoad() {
    this.checkTodayRecord();
    this.loadStatistics();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.checkTodayRecord();
    this.loadStatistics(); // 添加统计数据加载
  },

  // 检查今天是否已记录
  checkTodayRecord() {
    if (!checkLoginWithTip({ content: '情绪记录需要登录后使用' })) {
      return;
    }

    const db = wx.cloud.database();
    const today = formatDateDash(new Date());
    
    db.collection('MoodRecords')
      .where({
        date: today
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const record = res.data[0];
          this.setData({
            todayRecorded: true,
            todayMood: record.mood,
            todayNote: record.note || ''
          });
        } else {
          this.setData({
            todayRecorded: false,
            todayMood: null,
            todayNote: ''
          });
        }
      })
      .catch(err => {
        console.error('检查今日记录失败', err);
      });
  },

  // 选择情绪
  selectMood(e) {
    if (this.data.todayRecorded) {
      wx.showToast({ title: '今天已记录过了', icon: 'none' });
      return;
    }

    const moodId = e.currentTarget.dataset.id;
    this.setData({ todayMood: moodId });
    
    // 震动反馈
    wx.vibrateShort({ type: 'light' });
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ todayNote: e.detail.value });
  },

  // 保存记录
  async saveMood() {
    if (!this.data.todayMood) {
      wx.showToast({ title: '请选择今天的心情', icon: 'none' });
      return;
    }

    if (!checkLoginWithTip({ content: '保存情绪记录需要登录' })) {
      return;
    }

    // 如果有备注，进行内容安全检测
    if (this.data.todayNote && this.data.todayNote.trim()) {
      const securityResult = await checkTextSecurityWithLoading(this.data.todayNote, '检测内容安全...');
      
      if (!securityResult.safe) {
        wx.showModal({
          title: '内容提示',
          content: securityResult.message,
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }
    }

    wx.showLoading({ title: '保存中...' });

    const db = wx.cloud.database();
    const today = formatDateDash(new Date());
    
    db.collection('MoodRecords').add({
      data: {
        mood: this.data.todayMood,
        note: this.data.todayNote,
        date: today,
        createdAt: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.vibrateShort({ type: 'medium' });
      
      this.setData({ todayRecorded: true });
      
      wx.showToast({ 
        title: '记录成功', 
        icon: 'success',
        duration: 2000
      });
      
      // 重新加载统计
      this.loadStatistics();
    }).catch(err => {
      wx.hideLoading();
      console.error('保存失败', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  // 加载统计数据
  async loadStatistics() {
    if (!checkLoginWithTip({ content: '' })) {
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    
    // 计算7天前的日期
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // 包含今天共7天
    
    const startDate = formatDateDash(sevenDaysAgo);
    const endDate = formatDateDash(today);

    try {
      // 查询最近7天的记录
      const countResult = await db.collection('MoodRecords')
        .where({
          date: _.gte(startDate).and(_.lte(endDate))
        })
        .count();
      const total = countResult.total;
      
      const batchSize = 100;
      const batchCount = Math.ceil(total / batchSize);
      const tasks = [];
      
      for (let i = 0; i < batchCount; i++) {
        const promise = db.collection('MoodRecords')
          .where({
            date: _.gte(startDate).and(_.lte(endDate))
          })
          .orderBy('date', 'desc')
          .skip(i * batchSize)
          .limit(batchSize)
          .get();
        tasks.push(promise);
      }
      
      const results = await Promise.all(tasks);
      const recentData = results.reduce((acc, res) => acc.concat(res.data), []);
      
      // 格式化日期显示
      const formattedData = recentData.map(item => {
        const date = new Date(item.date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return {
          ...item,
          displayDate: `${month}/${day}`
        };
      });
      
      // 查询用户总共记录了多少天（所有历史记录）
      const totalCountResult = await db.collection('MoodRecords').count();
      const totalDays = totalCountResult.total; // 因为一天只能记录一次，所以记录数=天数
      
      this.setData({ 
        recentMoods: formattedData,
        totalRecords: totalDays
      });
      
      this.calculateMoodStats(recentData);
    } catch (err) {
      console.error('加载统计失败', err);
    }
  },

  // 计算情绪统计
  calculateMoodStats(records) {
    const stats = {};
    
    records.forEach(record => {
      stats[record.mood] = (stats[record.mood] || 0) + 1;
    });

    // 找出出现最多的情绪（次数相同时按优先级）
    const moodPriority = ['anxious', 'sad', 'angry', 'calm', 'happy'];
    let maxCount = 0;
    let dominant = null;
    
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
          dominant = mood;
          break;
        }
      }
    }

    // 只有当有主导情绪时才设置 moodInfo
    const moodInfo = dominant ? this.getMoodInfo(dominant) : {};

    this.setData({ 
      moodStats: stats,
      moodInfo: moodInfo
      // 不再覆盖 totalRecords，保持之前查询的总天数
    });
  },

  // 查看历史
  viewHistory() {
    if (!checkLoginWithTip({ content: '查看历史需要登录' })) {
      return;
    }
    wx.navigateTo({ url: '/pages/mood-history/index' });
  },

  // 获取情绪信息
  getMoodInfo(moodId) {
    return this.data.moods.find(m => m.id === moodId) || {};
  },

  onShareAppMessage() {
    return {
      title: '记录情绪，觉察自己',
      path: '/pages/breathe/index'
    };
  }
});
