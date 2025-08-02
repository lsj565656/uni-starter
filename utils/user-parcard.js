import { mutations } from '@/uni_modules/uni-id-pages/common/store.js'

/**
 * 获取用户趴活信息卡（优先从内存缓存获取）
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 用户信息卡数据
 */
export async function getUserParCard(userId) {
  // 1. 优先从内存缓存获取
  const cachedCard = mutations.getUserParCard()
  if (cachedCard) {
    console.log('从内存缓存获取用户趴活信息卡', cachedCard)
    return cachedCard
  }
  
  // 2. 从云函数获取
  try {
    console.log('从云函数获取用户趴活信息卡')
    const result = await uniCloud.callFunction({
      name: 'getUserParCard',
      data: { user_id: userId }
    })
    
    if (result.result && result.result.code === 0 && result.result.data) {
      // 缓存到内存并返回
      mutations.setUserParCard(result.result.data)
      return result.result.data
    } else {
      console.log('未找到用户趴活信息卡')
      return null
    }
  } catch (error) {
    console.error('获取用户趴活信息卡失败:', error)
    return null
  }
}

/**
 * 更新用户趴活信息卡缓存
 * @param {Object} cardData - 用户信息卡数据
 */
export function updateUserParCardCache(cardData) {
  mutations.setUserParCard(cardData)
}

/**
 * 清除用户趴活信息卡缓存
 */
export function clearUserParCardCache() {
  mutations.setUserParCard(null)
}

/**
 * 检查用户是否有趴活信息卡
 * @param {string} userId - 用户ID
 * @returns {Promise<boolean>} 是否有信息卡
 */
export async function hasUserParCard(userId) {
  const card = await getUserParCard(userId)
  return !!card
}

/**
 * 获取用户趴活信息卡的显示信息
 * @param {Object} cardData - 用户信息卡数据
 * @returns {Object} 显示信息
 */
export function getParCardDisplayInfo(cardData) {
  if (!cardData) return null
  
  return {
    nickname: cardData.nickname || '未设置',
    age: cardData.age || '未设置',
    education: cardData.education || '未设置',
    city: cardData.city || '未设置',
    skills: cardData.skills?.join(', ') || '未设置',
    strengths: cardData.strengths || '未设置',
    avatar: cardData.avatar || '/static/default-avatar.png',
    isActive: cardData.is_active !== false,
    allowHomepageView: cardData.allow_homepage_view || false
  }
} 