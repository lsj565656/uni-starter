/**
 * 时间戳转 yyyy-MM-dd 格式
 * @param {number|string} ts 时间戳（秒或毫秒）
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return '';
  let t = Number(ts);
  if (t < 1e11) t = t * 1000; // 兼容秒
  const date = new Date(t);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

/**
 * 评论相对时间格式化
 * @param {number|string} ts 时间戳（秒或毫秒）
 * @returns {string}
 */
export function formatRelativeTime(ts) {
  if (!ts) return '';
  let t = Number(ts);
  if (t < 1e11) t = t * 1000; // 兼容秒
  const now = Date.now();
  const diff = now - t;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + '分钟前';
  if (diff < day) return Math.floor(diff / hour) + '小时前';
  if (diff < week) return Math.floor(diff / day) + '天前';
  // 超过一周，显示日期+时分
  const date = new Date(t);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
} 