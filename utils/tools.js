/**
 * 时间戳转 yyyy-MM-dd 格式
 * @param {number|string} ts 时间戳（秒或毫秒）
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return ''
  let t = Number(ts)
  if (t < 1e11) t = t * 1000 // 兼容秒
  const date = new Date(t)
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

/**
 * 评论相对时间格式化
 * @param {number|string} ts 时间戳（秒或毫秒）
 * @returns {string}
 */
export function formatRelativeTime(ts) {
  if (!ts) return ''
  let t = Number(ts)
  if (t < 1e11) t = t * 1000 // 兼容秒
  const now = Date.now()
  const diff = now - t
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < week) return Math.floor(diff / day) + '天前'
  // 超过一周，显示日期+时分
  const date = new Date(t)
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

// 数字转中文大写（支持大数，分位不重复，去除多余“零”）
export function numberToChinese(number_) {
  if (typeof number_ !== 'number' || isNaN(number_)) return ''
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const cnIntRadice = [
    '',
    '拾',
    '佰',
    '仟',
    '万',
    '拾万',
    '佰万',
    '仟万',
    '亿',
    '拾亿',
    '佰亿',
    '仟亿',
    '万亿'
  ]
  const integerNumber = Math.floor(number_)
  if (integerNumber === 0) return cnNums[0]
  let string_ = ''
  const numberString = integerNumber.toString()
  for (let index = 0; index < numberString.length; index++) {
    const n = numberString[numberString.length - 1 - index]
    string_ = cnNums[Number(n)] + cnIntRadice[index] + string_
  }
  // 去除多余的“零”
  string_ = string_
    .replaceAll(/零[仟佰拾]/g, '零')
    .replaceAll(/零+/g, '零')
    .replaceAll('零万', '万')
    .replaceAll('零亿', '亿')
    .replaceAll('亿万', '亿')
    .replaceAll(/零+$/g, '')
    .replace(/^壹拾/, '拾')
  return string_
}
// 分位显示，返回数组，首位加 highlight 字段
export function formatAmountUnits(number_) {
  if (typeof number_ !== 'number' || isNaN(number_)) return []
  const units = ['个', '十', '百', '千', '万', '十万', '百万']
  const string_ = Math.floor(number_).toString().split('').reverse()
  return string_
    .map((n, index) => ({
      unit: units[index],
      highlight: index === string_.length - 1
    }))
    .reverse()
}

// 友好时长
export function formatDuration(start, end) {
  if (!start || !end) return ''
  const ms = new Date(end) - new Date(start)
  if (ms <= 0) return ''
  const min = Math.floor(ms / 60_000)
  if (min < 60) return min + '分钟'
  const hour = Math.floor(min / 60)
  const minLeft = min % 60
  if (hour < 24) {
    return minLeft ? `${hour}小时零${minLeft}分钟` : `${hour}小时`
  }
  const day = Math.floor(hour / 24)
  const hourLeft = hour % 24
  if (day < 7) {
    return hourLeft ? `${day}天零${hourLeft}小时` : `${day}天`
  }
  if (day < 30) {
    const week = Math.floor(day / 7)
    const dayLeft = day % 7
    let string_ = week ? `${week}周` : ''
    if (dayLeft) string_ += `零${dayLeft}天`
    return string_
  }
  return '大于一月'
}

/**
 * 获取系统信息（兼容微信小程序和APP）
 * @returns {object} 系统信息对象
 */
export function getSystemInfo() {
  // #ifdef MP-WEIXIN
  try {
    // 微信小程序使用新的API组合
    const windowInfo = wx.getWindowInfo()
    const deviceInfo = wx.getDeviceInfo()
    const appBaseInfo = wx.getAppBaseInfo()
    
    return {
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      statusBarHeight: windowInfo.statusBarHeight,
      screenWidth: deviceInfo.screenWidth,
      screenHeight: deviceInfo.screenHeight,
      pixelRatio: deviceInfo.pixelRatio,
      platform: appBaseInfo.platform,
      system: appBaseInfo.system,
      version: appBaseInfo.version,
      SDKVersion: appBaseInfo.SDKVersion
    }
  } catch (error) {
    // 如果新API都不可用，返回默认值
    console.warn('微信小程序新API不可用，使用默认值:', error)
    return {
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 20,
      screenWidth: 375,
      screenHeight: 667,
      pixelRatio: 2,
      platform: 'devtools',
      system: 'iOS 14.0',
      version: '1.0.0',
      SDKVersion: '3.0.0'
    }
  }
  // #endif
  
  // #ifndef MP-WEIXIN
  // APP和其他平台使用uni.getSystemInfoSync
  try {
    return uni.getSystemInfoSync()
  } catch (error) {
    console.warn('uni.getSystemInfoSync失败，使用默认值:', error)
    return {
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 20,
      screenWidth: 375,
      screenHeight: 667,
      pixelRatio: 2,
      platform: 'devtools',
      system: 'iOS 14.0',
      version: '1.0.0',
      SDKVersion: '3.0.0'
    }
  }
  // #endif
}

/**
 * 获取窗口宽度
 * @returns {number} 窗口宽度
 */
export function getWindowWidth() {
  try {
    const systemInfo = getSystemInfo()
    return systemInfo.windowWidth || systemInfo.screenWidth || 375
  } catch (error) {
    console.warn('获取窗口宽度失败，使用默认值:', error)
    return 375
  }
}

/**
 * 获取状态栏高度
 * @returns {number} 状态栏高度
 */
export function getStatusBarHeight() {
  try {
    const systemInfo = getSystemInfo()
    return systemInfo.statusBarHeight || 0
  } catch (error) {
    console.warn('获取状态栏高度失败，使用默认值:', error)
    return 0
  }
}

/**
 * 获取窗口高度
 * @returns {number} 窗口高度
 */
export function getWindowHeight() {
  try {
    const systemInfo = getSystemInfo()
    return systemInfo.windowHeight || systemInfo.screenHeight || 667
  } catch (error) {
    console.warn('获取窗口高度失败，使用默认值:', error)
    return 667
  }
}