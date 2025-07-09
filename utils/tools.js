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
  return `${y}-${m}-${d}`;
} 