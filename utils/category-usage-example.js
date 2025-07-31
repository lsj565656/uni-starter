// 领域技能分类使用示例
// 展示如何在趴活广场应用中使用分类体系

import { 
  categorySkillsMapping, 
  getAllSkills, 
  getCategoryBySkill, 
  getSkillsByCategory,
  getAllCategories,
  searchSkills,
  popularSkills,
  getRecommendedSkills,
  getSkillDifficulty
} from './category-skills-mapping.js'

// 示例1: 在用户信息卡中使用
export function enhanceUserProfile(userProfile) {
  // 为用户推荐相关技能
  const recommendedSkills = getRecommendedSkills(userProfile)
  
  // 获取用户技能的难度等级
  const userSkillsWithDifficulty = userProfile.skills?.map(skill => ({
    skill,
    difficulty: getSkillDifficulty(skill),
    category: getCategoryBySkill(skill)
  })) || []
  
  return {
    ...userProfile,
    recommendedSkills,
    skillsWithDifficulty: userSkillsWithDifficulty
  }
}

// 示例2: 在筛选功能中使用
export function createFilterOptions() {
  const categories = getAllCategories()
  
  return {
    // 按领域筛选
    categoryFilter: categories.map(cat => ({
      value: cat.key,
      label: cat.name,
      count: cat.skillCount
    })),
    
    // 热门技能筛选
    popularSkillsFilter: popularSkills.map(skill => ({
      value: skill,
      label: skill,
      category: getCategoryBySkill(skill)?.name
    })),
    
    // 难度等级筛选
    difficultyFilter: [
      { value: 'beginner', label: '初级', color: '#52c41a' },
      { value: 'intermediate', label: '中级', color: '#faad14' },
      { value: 'advanced', label: '高级', color: '#f5222d' }
    ]
  }
}

// 示例3: 在搜索功能中使用
export function searchUsersBySkills(keyword, users) {
  const searchResults = searchSkills(keyword)
  
  // 根据搜索结果筛选用户
  const matchedUsers = users.filter(user => {
    if (!user.skills) return false
    
    return user.skills.some(skill => {
      return searchResults.some(result => 
        result.skills.includes(skill)
      )
    })
  })
  
  return {
    users: matchedUsers,
    searchResults,
    keyword
  }
}

// 示例4: 在推荐系统中使用
export function generateUserRecommendations(user, allUsers) {
  const userSkills = user.skills || []
  const userCategories = userSkills.map(skill => getCategoryBySkill(skill)?.key).filter(Boolean)
  
  // 基于技能匹配推荐用户
  const skillBasedRecommendations = allUsers.filter(otherUser => {
    if (otherUser._id === user._id) return false
    
    const otherUserSkills = otherUser.skills || []
    return otherUserSkills.some(skill => userSkills.includes(skill))
  })
  
  // 基于领域匹配推荐用户
  const categoryBasedRecommendations = allUsers.filter(otherUser => {
    if (otherUser._id === user._id) return false
    
    const otherUserCategories = (otherUser.skills || []).map(skill => 
      getCategoryBySkill(skill)?.key
    ).filter(Boolean)
    
    return otherUserCategories.some(cat => userCategories.includes(cat))
  })
  
  return {
    skillBased: skillBasedRecommendations.slice(0, 10),
    categoryBased: categoryBasedRecommendations.slice(0, 10)
  }
}

// 示例5: 在任务发布中使用
export function getTaskCategoryOptions() {
  return getAllCategories().map(category => ({
    value: category.key,
    label: category.name,
    description: category.description,
    skills: getSkillsByCategory(category.key)
  }))
}

// 示例6: 在数据统计中使用
export function generateCategoryStats(users) {
  const stats = {}
  
  getAllCategories().forEach(category => {
    const categoryUsers = users.filter(user => {
      const userSkills = user.skills || []
      return userSkills.some(skill => 
        getSkillsByCategory(category.key).includes(skill)
      )
    })
    
    stats[category.key] = {
      name: category.name,
      userCount: categoryUsers.length,
      percentage: (categoryUsers.length / users.length * 100).toFixed(1),
      topSkills: getTopSkillsInCategory(categoryUsers, category.key)
    }
  })
  
  return stats
}

// 获取某个领域中最热门的技能
function getTopSkillsInCategory(users, categoryKey) {
  const skillCount = {}
  const categorySkills = getSkillsByCategory(categoryKey)
  
  users.forEach(user => {
    const userSkills = user.skills || []
    userSkills.forEach(skill => {
      if (categorySkills.includes(skill)) {
        skillCount[skill] = (skillCount[skill] || 0) + 1
      }
    })
  })
  
  return Object.entries(skillCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }))
}

// 示例7: 在用户界面中使用
export function createCategoryUI() {
  return getAllCategories().map(category => ({
    id: category.key,
    title: category.name,
    subtitle: category.description,
    icon: getCategoryIcon(category.key),
    color: getCategoryColor(category.key),
    skills: getSkillsByCategory(category.key).slice(0, 6), // 显示前6个技能
    totalSkills: category.skillCount
  }))
}

// 获取领域图标
function getCategoryIcon(categoryKey) {
  const iconMap = {
    entertainment: '🎮',
    neighborhood: '🏘️',
    housekeeping: '🏠',
    pet: '🐕',
    maintenance: '🔧',
    medical: '🏥',
    fitness: '💪',
    travel: '✈️',
    food: '🍽️'
  }
  return iconMap[categoryKey] || '📋'
}

// 获取领域颜色
function getCategoryColor(categoryKey) {
  const colorMap = {
    entertainment: '#ff6b6b',
    neighborhood: '#4ecdc4',
    housekeeping: '#45b7d1',
    pet: '#96ceb4',
    maintenance: '#feca57',
    medical: '#ff9ff3',
    fitness: '#54a0ff',
    travel: '#5f27cd',
    food: '#ff9f43'
  }
  return colorMap[categoryKey] || '#95a5a6'
}

// 示例8: 在数据验证中使用
export function validateUserSkills(skills) {
  const allValidSkills = getAllSkills()
  const invalidSkills = skills.filter(skill => !allValidSkills.includes(skill))
  
  if (invalidSkills.length > 0) {
    return {
      valid: false,
      invalidSkills,
      suggestions: invalidSkills.map(skill => 
        searchSkills(skill.slice(0, 2)).flatMap(result => result.skills)
      )
    }
  }
  
  return { valid: true }
}

// 示例9: 在智能匹配中使用
export function calculateSkillMatch(user1, user2) {
  const skills1 = user1.skills || []
  const skills2 = user2.skills || []
  
  // 计算技能重叠度
  const commonSkills = skills1.filter(skill => skills2.includes(skill))
  const totalSkills = [...new Set([...skills1, ...skills2])]
  
  const skillMatch = commonSkills.length / totalSkills.length
  
  // 计算领域匹配度
  const categories1 = skills1.map(skill => getCategoryBySkill(skill)?.key).filter(Boolean)
  const categories2 = skills2.map(skill => getCategoryBySkill(skill)?.key).filter(Boolean)
  
  const commonCategories = categories1.filter(cat => categories2.includes(cat))
  const totalCategories = [...new Set([...categories1, ...categories2])]
  
  const categoryMatch = commonCategories.length / totalCategories.length
  
  return {
    skillMatch: (skillMatch * 100).toFixed(1),
    categoryMatch: (categoryMatch * 100).toFixed(1),
    overallMatch: ((skillMatch + categoryMatch) / 2 * 100).toFixed(1),
    commonSkills,
    commonCategories
  }
} 