const { checkLogin, formatDate, generateQuoteCard, getRandomBgImage, get, del } = require('../../utils/index');

Page({
  data: {
    favorites: [],
    showCardModal: false,
    cardImagePath: '',
    cardFlipped: false
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    // onShow 中不再调用 loadFavorites，避免重复请求
    // this.loadFavorites();
  },

  // 加载收藏列表（从API）
  async loadFavorites() {
    if (!checkLogin()) {
      this.setData({ favorites: [] });
      return;
    }

    wx.showLoading({ title: '加载中...' });
    
    try {
      const res = await get('/quotes/favorites', { page: 1, pageSize: 1000 });
      
      wx.hideLoading();
      
      // res 结构：{ favorites: [...], pagination: {...} }
      // 因为 body.pagination 不存在（pagination 在 body.data 内），request.js 直接返回 body.data
      const favoritesData = res.favorites || [];
      
      // 格式化数据以适配页面显示
      const favorites = favoritesData.map(item => ({
        quote: item.quote.content,
        author: item.quote.author,
        date: formatDate(new Date(item.createdAt)),
        timestamp: new Date(item.createdAt).getTime(),
        _id: item.id,
        quote_id: item.quoteId
      }));
      
      this.setData({ favorites });
    } catch (err) {
      wx.hideLoading();
      console.error('加载收藏失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 查看语录详情
  viewQuote(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.favorites[index];
    wx.showModal({
      title: item.author,
      content: item.quote,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 生成日签卡片 - 使用工具函数
  async generateCard(e) {
    const item = e.currentTarget.dataset.item;
    wx.showLoading({ title: '生成中...' });

    try {
      const bgImage = await getRandomBgImage(); // 异步获取背景图
      
      const tempFilePath = await generateQuoteCard({
        canvasId: '#dailyCardCanvas',
        quote: item.quote,
        author: item.author,
        date: item.date,
        bgImage: bgImage
      });
      
      wx.hideLoading();
      this.setData({
        cardImagePath: tempFilePath,
        showCardModal: true,
        cardFlipped: false
      });
      // 延迟触发翻牌动画
      setTimeout(() => {
        this.setData({ cardFlipped: true });
      }, 300);
    } catch (err) {
      wx.hideLoading();
      console.error('生成日签失败', err);
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    }
  },

  // 删除收藏（调用API）
  deleteFavorite(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.favorites[index];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条收藏吗？',
      success: (res) => {
        if (res.confirm) {
          del(`/quotes/${item.quote_id}/favorite`)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadFavorites(); // 重新加载列表
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 关闭弹窗
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
  }
});
