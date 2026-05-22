/**
 * 日期时间相关工具函数
 */

/**
 * 格式化日期为 YYYY.MM.DD 格式
 * @param {Date|String|Number} date 日期对象、时间戳或日期字符串
 * @returns {String} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${y}.${m}.${day}`;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|String|Number} date 日期对象、时间戳或日期字符串
 * @returns {String} 格式化后的日期字符串
 */
function formatDateDash(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${day}`;
}

/**
 * 格式化日期时间为 YYYY.MM.DD HH:mm:ss 格式
 * @param {Date|String|Number} date 日期对象、时间戳或日期字符串
 * @returns {String} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  const dateStr = formatDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  
  return `${dateStr} ${h}:${min}:${s}`;
}

/**
 * 获取今天的日期字符串
 * @param {String} format 格式类型：'dot'(默认) 或 'dash'
 * @returns {String} 今天的日期
 */
function getToday(format = 'dot') {
  const today = new Date();
  return format === 'dash' ? formatDateDash(today) : formatDate(today);
}

module.exports = {
  formatDate,
  formatDateDash,
  formatDateTime,
  getToday
};
