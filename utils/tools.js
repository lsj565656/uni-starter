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

// 数字转中文大写（支持大数，分位不重复，去除多余“零”）
export function numberToChinese(num) {
  if (typeof num !== 'number' || isNaN(num)) return '';
  const cnNums = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
  const cnIntRadice = ['', '拾', '佰', '仟', '万', '拾万', '佰万', '仟万', '亿', '拾亿', '佰亿', '仟亿', '万亿'];
  let integerNum = Math.floor(num);
  if (integerNum === 0) return cnNums[0];
  let str = '';
  let numStr = integerNum.toString();
  for (let i = 0; i < numStr.length; i++) {
    let n = numStr[numStr.length - 1 - i];
    str = cnNums[Number(n)] + cnIntRadice[i] + str;
  }
  // 去除多余的“零”
  str = str.replace(/零[拾佰仟]/g, '零')
           .replace(/零+/g, '零')
           .replace(/零万/g, '万')
           .replace(/零亿/g, '亿')
           .replace(/亿万/g, '亿')
           .replace(/零+$/g, '')
           .replace(/^壹拾/, '拾');
  return str;
}
// 分位显示，返回数组，首位加 highlight 字段
export function formatAmountUnits(num) {
  if (typeof num !== 'number' || isNaN(num)) return [];
  const units = ['个', '十', '百', '千', '万', '十万', '百万'];
  const str = Math.floor(num).toString().split('').reverse();
  return str.map((n, i) => ({
    unit: units[i],
    highlight: i === str.length - 1
  })).reverse();
}

// 友好时长
export function formatDuration(start, end) {
  if (!start || !end) return '';
  const ms = new Date(end) - new Date(start);
  if (ms <= 0) return '';
  const min = Math.floor(ms / 60000);
  if (min < 60) return min + '分钟';
  const hour = Math.floor(min / 60);
  const minLeft = min % 60;
  if (hour < 24) {
    return minLeft
      ? `${hour}小时零${minLeft}分钟`
      : `${hour}小时`;
  }
  const day = Math.floor(hour / 24);
  const hourLeft = hour % 24;
  if (day < 7) {
    return hourLeft
      ? `${day}天零${hourLeft}小时`
      : `${day}天`;
  }
  if (day < 30) {
    const week = Math.floor(day / 7);
    const dayLeft = day % 7;
    let str = week ? `${week}周` : '';
    if (dayLeft) str += `零${dayLeft}天`;
    return str;
  }
  return '大于一月';
} 