/**
 * Canvas 绘图相关工具函数
 */

/**
 * 绘制图片（cover 模式，居中裁剪）
 * @param {CanvasContext} ctx Canvas 上下文
 * @param {Image} img 图片对象
 * @param {Number} x 绘制起始 x 坐标
 * @param {Number} y 绘制起始 y 坐标
 * @param {Number} w 绘制宽度
 * @param {Number} h 绘制高度
 */
function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sx, sy, sw, sh;

  if (imgRatio > canvasRatio) {
    // 图片更宽，裁剪左右
    sh = img.height;
    sw = sh * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // 图片更高，裁剪上下
    sw = img.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * 文字自动换行绘制
 * @param {CanvasContext} ctx Canvas 上下文
 * @param {String} text 要绘制的文字
 * @param {Number} x 文字中心 x 坐标
 * @param {Number} y 文字中心 y 坐标
 * @param {Number} maxWidth 最大宽度
 * @param {Number} lineHeight 行高
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

  // 计算起始 y 坐标，使文字垂直居中
  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  // 逐行绘制
  lines.forEach((l, idx) => {
    ctx.fillText(l, x, startY + idx * lineHeight);
  });
}

/**
 * 生成日签卡片
 * @param {Object} options 配置项
 * @param {String} options.canvasId Canvas 选择器 ID
 * @param {String} options.quote 语录内容
 * @param {String} options.author 作者
 * @param {String} options.date 日期
 * @param {String} options.bgImage 背景图片 URL
 * @returns {Promise<String>} 返回生成的图片临时路径
 */
function generateQuoteCard(options) {
  return new Promise((resolve, reject) => {
    const { canvasId, quote, author, date, bgImage } = options;
    
    const query = wx.createSelectorQuery();
    query.select(canvasId)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          reject(new Error('画布初始化失败'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 设置画布尺寸 (450x800)
        canvas.width = 450 * dpr;
        canvas.height = 800 * dpr;
        ctx.scale(dpr, dpr);

        // 加载背景图
        const bgImg = canvas.createImage();
        
        bgImg.onload = () => {
          try {
            // 绘制背景图（cover 模式）
            drawImageCover(ctx, bgImg, 0, 0, 450, 800);
            
            // 绘制半透明遮罩
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, 450, 800);

            // 设置文字样式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 绘制语录
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px ZCool, sans-serif';
            const quoteText = `"${quote}"`;
            wrapText(ctx, quoteText, 225, 340, 370, 44);

            // 绘制作者
            ctx.font = '20px ZCool, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText(`—— ${author}`, 225, 520);

            // 绘制日期
            ctx.font = '15px ZCool, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText(date, 225, 700);

            // 导出图片
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (res) => {
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                reject(err);
              }
            });
          } catch (err) {
            reject(err);
          }
        };

        bgImg.onerror = (err) => {
          reject(new Error('背景图加载失败'));
        };

        bgImg.src = bgImage;
      });
  });
}

module.exports = {
  drawImageCover,
  wrapText,
  generateQuoteCard
};
