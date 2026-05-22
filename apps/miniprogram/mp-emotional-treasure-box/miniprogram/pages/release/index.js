const { checkLogin, checkLoginWithTip, checkTextSecurityWithLoading } = require('../../utils/index');

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
      this.loadShredCountFromCloud();
    } else {
      this.setData({ totalShredded: 0 });
    }
  },

  // 从云数据库加载粉碎次数
  loadShredCountFromCloud() {
    const db = wx.cloud.database();
    db.collection('AnxietyHistory')
      .count()
      .then(res => {
        this.setData({ totalShredded: res.total });
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

    // 内容安全检测
    const securityResult = await checkTextSecurityWithLoading(this.data.content, '检测内容安全...');
    
    if (!securityResult.safe) {
      wx.showModal({
        title: '内容提示',
        content: securityResult.message,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    // 震动反馈
    wx.vibrateShort({ type: 'medium' });

    // 播放音效（需要上传音频文件到云存储）
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://636c-cloud1-7g27vhf9d8bd5dbb-1415544021.tcb.qcloud.la/shred-sound.mp3'; // 替换为实际音频URL
    innerAudioContext.play();

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
      this.loadShredCountFromCloud();
      
      wx.showToast({ 
        title: '焦虑已粉碎', 
        icon: 'success' 
      });
    }, 2000);
  },

  // 保存到历史记录
  saveToHistory(content) {
    const db = wx.cloud.database();
    db.collection('AnxietyHistory').add({
      data: {
        content: content,
        createdAt: db.serverDate()
      }
    }).then(() => {
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
