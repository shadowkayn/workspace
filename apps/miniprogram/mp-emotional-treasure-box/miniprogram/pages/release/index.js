const { checkLogin, checkLoginWithTip, get, post } = require('../../utils/index');

const SHRED_SOUND_URL = '';

Page({
  data: {
    content: '',
    shredding: false,
    showPile: false,
    strips: [],
    confetti: [],
    pileItems: [],
    totalShredded: 0, // 统计粉碎次数
    isLogin: false
  },

  onLoad() {
    this.generateParts();
    this.checkLoginAndLoadCount();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // 每次显示页面时重新检查登录状态和加载数据
    this.checkLoginAndLoadCount();
  },

  // 检查登录状态并加载粉碎次数
  checkLoginAndLoadCount() {
    const isLogin = checkLogin();
    this.setData({ isLogin });
    
    if (isLogin) {
      this.loadShredCount();
    } else {
      this.setData({ totalShredded: 0 });
    }
  },

  // 从后端加载粉碎次数
  loadShredCount() {
    get('/anxiety-records', { page: 1, pageSize: 1 })
      .then(res => {
        this.setData({ totalShredded: res.pagination ? res.pagination.total : 0 });
      })
      .catch(err => {
        console.error('加载粉碎次数失败', err);
      });
  },

  generateParts() {
    // 碎纸条 — 均匀分布在机器底部
    const strips = [];
    for (let i = 0; i < 15; i++) {
      strips.push({
        left: 8 + i * 17,
        delay: Math.floor(Math.random() * 200)
      });
    }

    // 飘落碎纸片
    const confetti = [];
    for (let i = 0; i < 18; i++) {
      confetti.push({
        left: Math.floor(Math.random() * 290),
        delay: 300 + Math.floor(Math.random() * 800),
        rotate: Math.floor(Math.random() * 360)
      });
    }

    // 碎纸堆
    const pileItems = [];
    for (let i = 0; i < 30; i++) {
      pileItems.push({
        left: Math.floor(Math.random() * 320),
        bottom: Math.floor(Math.random() * 50),
        w: 12 + Math.floor(Math.random() * 24),
        h: 10 + Math.floor(Math.random() * 20),
        r: Math.floor(Math.random() * 360)
      });
    }

    this.setData({ strips, confetti, pileItems });
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  async onShred() {
    // 检查登录状态
    if (!checkLoginWithTip({ content: '粉碎焦虑功能需要登录后使用' })) {
      return;
    }

    if (!this.data.content.trim()) {
      wx.showToast({ title: '先写下你的焦虑吧', icon: 'none' });
      return;
    }

    // 震动反馈
    wx.vibrateShort({ type: 'medium' });

    // 播放音效
    if (SHRED_SOUND_URL) {
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = SHRED_SOUND_URL;
      innerAudioContext.play();
    }

    this.setData({ shredding: true, showPile: false });
    this.generateParts();

    // 保存到历史记录
    this.saveToHistory(this.data.content);

    // 碎纸堆出现
    setTimeout(() => {
      this.setData({ showPile: true });
      wx.vibrateShort({ type: 'light' });
    }, 1000);

    // 动画完成后重置
    setTimeout(() => {
      this.setData({ 
        content: '', 
        shredding: false
      });
      
      // 重新加载粉碎次数
      this.loadShredCount();
      
      wx.showToast({ 
        title: '焦虑已粉碎', 
        icon: 'success' 
      });
    }, 2000);
  },

  // 保存到历史记录
  saveToHistory(content) {
    post('/anxiety-records', {
      score: 5,
      reason: content
    }).catch(err => {
      console.error('❌ 保存历史失败', err);
    });
  },

  // 查看历史记录
  viewHistory() {
    if (!checkLoginWithTip({ content: '查看历史记录需要先登录' })) {
      return;
    }
    wx.navigateTo({ url: '/pages/anxiety-history/index' });
  },

  onShareAppMessage() {
    return {
      title: '释放你的焦虑，把它粉碎掉',
      path: '/pages/release/index'
    };
  }
});
