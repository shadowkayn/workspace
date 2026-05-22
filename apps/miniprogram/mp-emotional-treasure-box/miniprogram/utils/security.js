/**
 * 内容安全检测工具函数
 */

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
    const result = await wx.cloud.callFunction({
      name: 'msgSecCheck',
      data: {
        content: content
      }
    });

    if (result.result) {
      return {
        safe: result.result.safe,
        message: result.result.message
      };
    } else {
      // 云函数调用失败
      return {
        safe: false,
        message: '内容检测失败，请稍后重试'
      };
    }
  } catch (err) {
    console.error('调用内容安全检测云函数失败:', err);
    return {
      safe: false,
      message: '内容检测服务异常，请稍后重试'
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
