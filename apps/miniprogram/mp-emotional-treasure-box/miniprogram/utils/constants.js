/**
 * 常量配置
 */

// 日签背景图列表 - 默认备用（数据库加载失败时使用）
const CARD_BG_LIST = [
  'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80',
  'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=800&q=80',
  'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80',
  'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'
];

/**
 * 获取随机背景图（从数据库）
 * @returns {Promise<String>} 背景图 URL
 */
async function getRandomBgImage() {
  try {
    const db = wx.cloud.database();
    
    // 先查询总数
    const countRes = await db.collection('BackgroundImages')
      .where({
        category: 'card',
        isActive: true
      })
      .count();

    if (countRes.total === 0) {
      console.warn('⚠️ 数据库没有背景图数据，使用默认列表');
      return CARD_BG_LIST[Math.floor(Math.random() * CARD_BG_LIST.length)];
    }
    
    // 随机选择一个跳过的数量
    const randomSkip = Math.floor(Math.random() * countRes.total);
    
    // 查询一条数据
    const res = await db.collection('BackgroundImages')
      .where({
        category: 'card',
        isActive: true
      })
      .skip(randomSkip)
      .limit(1)
      .get();
    
    if (res.data && res.data.length > 0) {
      const selectedBg = res.data[0];

      return selectedBg.url;
    } else {
      console.warn('⚠️ 查询失败，使用默认列表');
      return CARD_BG_LIST[Math.floor(Math.random() * CARD_BG_LIST.length)];
    }
  } catch (err) {
    console.error('❌ 获取背景图失败，使用默认背景', err);
    return CARD_BG_LIST[Math.floor(Math.random() * CARD_BG_LIST.length)];
  }
}

/**
 * 获取随机背景图（同步版本，使用默认列表）
 * @returns {String} 背景图 URL
 */
function getRandomBgImageSync() {
  return CARD_BG_LIST[Math.floor(Math.random() * CARD_BG_LIST.length)];
}

module.exports = {
  CARD_BG_LIST,
  getRandomBgImage,
  getRandomBgImageSync
};
