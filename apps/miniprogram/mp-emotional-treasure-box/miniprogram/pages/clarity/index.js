const bgAudioManager = wx.getBackgroundAudioManager();
const {
  checkLoginWithTip,
  formatDate,
  generateQuoteCard,
  getRandomBgImage,
  get,
  post,
  del
} = require('../../utils/index');

const DEFAULT_CLARITY_BG = 'https://res.cloudinary.com/kayn-admin-cloud/image/upload/v1774504376/clarity-n-bk_vwvqmq.png';

// 音乐列表 - 上传到云存储后把 URL 填这里
const MUSIC_LIST = [
  { title: 'sacred play secret place', url: 'https://cdn.jsdelivr.net/gh/shadowkayn/mini-assets@main/audio/Sacred_Play_Secret_Place.mp3' },
];

Page({
  data: {
    quote: '',
    author: '',
    bgImage: '', // 改为空，从数据库加载
    bgImages: [], // 存储所有背景图
    musicPlaying: false,
    currentMusic: null,
    // 日签相关
    showCardModal: false,
    cardImagePath: '',
    cardFlipped: false,
    // 收藏相关
    isFavorited: false
  },

  onLoad() {
    this.loadBackgroundImages(); // 先加载背景图
    this.fetchQuote();
    this.initBgMusic();
    this.checkFavoriteStatus();
    // 自动播放音乐
    this.autoPlayMusic();
  },

  // 随机选一首音乐
  getRandomMusic() {
    const validList = MUSIC_LIST.filter(m => m.url);
    if (validList.length === 0) return null;
    const idx = Math.floor(Math.random() * validList.length);
    return validList[idx];
  },

  // 加载背景图列表
  loadBackgroundImages() {
    get('/background-images', { category: 'clarity', limit: 100 })
      .then(res => {
        const images = res.images || [];
        if (images.length > 0) {
          this.setData({ bgImages: images });
          // 随机选择一张背景图
          this.setRandomBackground();
        } else {
          // 如果数据库没有数据，使用默认背景
          this.setData({ bgImage: DEFAULT_CLARITY_BG });
        }
      })
      .catch(err => {
        console.error('加载背景图失败', err);
        // 失败时使用默认背景
        this.setData({ bgImage: DEFAULT_CLARITY_BG });
      });
  },

  // 随机设置背景图
  setRandomBackground() {
    const { bgImages } = this.data;
    if (bgImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * bgImages.length);
      this.setData({ bgImage: bgImages[randomIndex].url });
    }
  },

  // 初始化背景音乐
  initBgMusic() {
    bgAudioManager.onPlay(() => {
      this.setData({ musicPlaying: true });
    });
    bgAudioManager.onPause(() => {
      this.setData({ musicPlaying: false });
    });
    bgAudioManager.onStop(() => {
      this.setData({ musicPlaying: false });
    });
    bgAudioManager.onEnded(() => {
      // 播放完随机换一首
      this.playRandomMusic();
    });
    bgAudioManager.onError((err) => {
      console.error('音乐播放错误', err);
      this.setData({ musicPlaying: false });
    });

    // 检查当前是否正在播放
    if (bgAudioManager.paused === false) {
      this.setData({ musicPlaying: true });
    }
  },

  // 自动播放音乐
  autoPlayMusic() {
    // 如果当前没有在播放音乐，则自动播放
    if (bgAudioManager.paused !== false) {
      this.playRandomMusic();
    }
  },

  // 播放随机音乐
  playRandomMusic() {
    const music = this.getRandomMusic();
    if (!music) {
      wx.showToast({ title: '暂无音乐', icon: 'none' });
      return;
    }
    this.setData({ currentMusic: music });
    bgAudioManager.title = music.title;
    bgAudioManager.epname = '情绪宝藏盒';
    bgAudioManager.singer = '轻音乐';
    bgAudioManager.coverImgUrl = this.data.bgImage;
    bgAudioManager.src = music.url;
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // tab 切换回来时重新检查收藏状态
    this.checkFavoriteStatus();
  },

  // 获取每日语录（按日期精准匹配）
  fetchQuote() {
    get('/quotes/today').then(item => {
      this.applyQuote(item);
    }).catch(err => {
      console.error('获取今日语录失败，尝试随机语录', err);
      this.fetchRandomQuote();
    });
  },

  // 兜底随机获取逻辑
  fetchRandomQuote() {
    get('/quotes/random/get').then(item => {
      this.applyQuote(item);
    }).catch(err => {
      console.error('获取随机语录失败', err);
      wx.showToast({ title: '语录加载失败', icon: 'none' });
    });
  },

  applyQuote(item) {
    if (!item) return;

    this.setData({
      quote: item.content,
      author: item.author,
      quoteId: item.id,
      isFavorited: !!item.isFavorited
    });
  },

  // 切换收藏状态（存入后端）
  async toggleFavorite() {
    // 使用工具函数检查登录
    if (!checkLoginWithTip({ content: '收藏功能需要登录后使用' })) {
      return;
    }

    const { quoteId, isFavorited } = this.data;

    if (!quoteId) {
      wx.showToast({ title: '语录加载中', icon: 'none' });
      return;
    }

    if (!isFavorited) {
      try {
        await post(`/quotes/${quoteId}/favorite`);
        this.setData({ isFavorited: true });
        wx.showToast({ title: '已加入拾光宝盒', icon: 'success' });
      } catch (e) {
        console.error('收藏失败', e);
        wx.showToast({ title: '收藏失败', icon: 'none' });
      }
    } else {
      try {
        await del(`/quotes/${quoteId}/favorite`);
        this.setData({ isFavorited: false });
        wx.showToast({ title: '已移出拾光宝盒', icon: 'none' });
      } catch (e) {
        console.error('取消收藏失败', e);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    }
  },

  // 检查后端收藏状态 - 只查询当前用户的收藏
  checkFavoriteStatus() {
    const app = getApp();
    const isLogin = app.checkLogin();

    // 如果用户未登录，直接设置为未收藏状态，不调用接口
    if (!isLogin) {
      this.setData({ isFavorited: false });
      return;
    }

    // 如果还没有 quoteId，说明数据还在加载中，不执行查询
    if (!this.data.quoteId) {
      this.setData({ isFavorited: false });
      return;
    }

    get(`/quotes/${this.data.quoteId}`).then(quote => {
      this.setData({ isFavorited: !!quote.isFavorited });
    }).catch(err => {
      console.error('❌ 检查收藏状态失败', err);
      this.setData({ isFavorited: false });
    });
  },

  // 切换音乐
  toggleMusic() {
    if (this.data.musicPlaying) {
      bgAudioManager.pause();
    } else {
      // 如果之前暂停了，继续播放；否则随机播放新的
      if (bgAudioManager.src && bgAudioManager.paused) {
        bgAudioManager.play();
      } else {
        this.playRandomMusic();
      }
    }
  },

  // 生成日签分享 - 使用工具函数
  async generateDailyCard() {
    // 使用工具函数检查登录
    if (!checkLoginWithTip({ content: '生成日签功能需要登录后使用' })) {
      return;
    }

    wx.showLoading({ title: '生成中...' });

    try {
      const bgImage = await getRandomBgImage(); // 异步获取背景图
      
      const tempFilePath = await generateQuoteCard({
        canvasId: '#dailyCardCanvas',
        quote: this.data.quote,
        author: this.data.author,
        date: formatDate(new Date()),
        bgImage: bgImage
      });
      
      wx.hideLoading();
      this.setData({
        cardImagePath: tempFilePath,
        showCardModal: true,
        cardFlipped: false
      });
      setTimeout(() => {
        this.setData({ cardFlipped: true });
      }, 300);
    } catch (err) {
      wx.hideLoading();
      console.error('生成日签失败', err);
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    }
  },

  // 绘制图片（cover模式，居中裁剪）
  drawImageCover(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sx, sy, sw, sh;

    if (imgRatio > canvasRatio) {
      sh = img.height;
      sw = sh * canvasRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  },

  // 文字换行绘制
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let lines = [];

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((l, idx) => {
      ctx.fillText(l, x, startY + idx * lineHeight);
    });
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  },

  // 关闭日签弹窗
  closeCardModal() {
    this.setData({ showCardModal: false, cardFlipped: false });
  },

  // 保存到相册
  saveCardToAlbum() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.cardImagePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
        this.setData({ showCardModal: false });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要授权保存图片到相册',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.quote} —— ${this.data.author}`,
      path: '/pages/clarity/index',
      imageUrl: this.data.bgImage // 使用当前背景图作为分享图
    };
  }
});
