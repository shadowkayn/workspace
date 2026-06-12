/**
 * 内容安全检测工具函数
 */

const { post } = require('./request');

/**
 * 检测文本内容是否安全
 * @param {string} content - 要检测的文本内容
 * @returns {Promise<{safe: boolean, message: string}>}
 */
async function checkTextSecurity(content) {
  // 内容为空，直接通过
  if (!content || content.trim() === '') {
    return {
      safe: true,
      message: '内容为空'
    };
  }

  try {
    const result = await post('/security/check-text', {
      content: content,
      contentType: 'text'
    });

    return {
      safe: result.safe,
      message: result.message
    };
  } catch (err) {
    console.error('调用内容安全检测API失败:', err);
    
    // 如果是网络错误，允许通过（避免影响用户体验）
    return {
      safe: true,
      message: '检测服务暂时不可用，已跳过检测'
    };
  }
}

/**
 * 带加载提示的内容安全检测
 * @param {string} content - 要检测的文本内容
 * @param {string} loadingText - 加载提示文字，默认"检测中..."
 * @returns {Promise<{safe: boolean, message: string}>}
 */
async function checkTextSecurityWithLoading(content, loadingText = '检测中...') {
  wx.showLoading({ title: loadingText, mask: true });
  
  try {
    const result = await checkTextSecurity(content);
    wx.hideLoading();
    return result;
  } catch (err) {
    wx.hideLoading();
    throw err;
  }
}

module.exports = {
  checkTextSecurity,
  checkTextSecurityWithLoading
};
