// 领域和技能对应关系表
// 从 categories.js 中读取数据，根据 is_map_skill 字段过滤
import { categories } from './categories.js'

// 从 categories 中提取需要技能映射的分类
export const categorySkillsMapping = (() => {
  const mapping = {}
  const filteredCategories = categories.filter(cat => cat.is_map_skill && cat.skills && cat.skills.length > 0)
  
  filteredCategories.forEach(cat => {
    // 直接使用 categories 中的 key
    if (cat.key) {
      mapping[cat.key] = {
        name: cat.name || cat.text,
        description: cat.description,
        skills: cat.skills,
        catId: cat.catId,
        icon: cat.icon,
        route: cat.route
      }
    }
  })
  
  return mapping
})()

// 获取所有技能列表
export function getAllSkills() {
  const allSkills = []
  Object.values(categorySkillsMapping).forEach(category => {
    allSkills.push(...category.skills)
  })
  return [...new Set(allSkills)] // 去重
}

// 根据技能获取所属分类
export function getCategoryBySkill(skill) {
  for (const [key, category] of Object.entries(categorySkillsMapping)) {
    if (category.skills.includes(skill)) {
      return {
        key,
        name: category.name,
        description: category.description,
        catId: category.catId
      }
    }
  }
  return null
}

// 获取指定分类的所有技能
export function getSkillsByCategory(categoryKey) {
  return categorySkillsMapping[categoryKey]?.skills || []
}

// 获取所有分类列表
export function getAllCategories() {
  return categories
    .filter(cat => cat.is_map_skill && cat.is_active)
    .map(cat => ({
      key: cat.key,
      name: cat.name || cat.text,
      description: cat.description,
      skills: cat.skills,
      skillCount: cat.skills.length,
      catId: cat.catId,
      icon: cat.icon,
      route: cat.route
    }))
}

// 搜索技能（支持模糊匹配）
export function searchSkills(keyword) {
  const results = []
  const lowerKeyword = keyword.toLowerCase()

  categories
    .filter(cat => cat.is_map_skill && cat.skills && cat.skills.length > 0)
    .forEach(cat => {
      const matchedSkills = cat.skills.filter(skill => 
        skill.toLowerCase().includes(lowerKeyword)
      )
      if (matchedSkills.length > 0) {
        results.push({
          category: {
            key: cat.key,
            name: cat.name || cat.text,
            description: cat.description,
            catId: cat.catId,
            icon: cat.icon
          },
          skills: matchedSkills
        })
      }
    })

  return results
}

// 获取热门技能（基于使用频率）
export const popularSkills = [
  '出游',
  '打球',
  '轰趴',
  '家教兼职',
  '保洁服务',
  '宠物美容',
  '修手机',
  '修电脑',
  '通下水道',
  '陪诊师',
  '羽毛球',
  '篮球',
  '晨跑夜跑',
  '旅游规划',
  '特色美食',
  '上门做菜',
  '营养师',
  '瑜伽教练',
  '宠物寄养',
  '搬家服务'
]

// 获取推荐技能（基于用户画像）
export function getRecommendedSkills(userProfile = {}) {
  const recommendations = []

  // 根据用户年龄推荐
  if (userProfile.age < 25) {
    recommendations.push('电竞', '轰趴', '剧本杀', '密室逃脱', '滑板', '轮滑')
  } else if (userProfile.age > 50) {
    recommendations.push('晨跑夜跑', '太极', '中医理疗师', '营养师', '老人护理')
  }

  // 根据用户性别推荐
  if (userProfile.gender === 2) {
    // 女性
    recommendations.push('瑜伽教练', '美容护理', '烘焙师', '茶艺师', '母婴护理')
  } else if (userProfile.gender === 1) {
    // 男性
    recommendations.push('篮球', '足球', '力量训练', '修手机', '修电脑')
  }

  // 根据用户城市推荐
  if (userProfile.city?.includes('北京') || userProfile.city?.includes('上海')) {
    recommendations.push('旅游规划', '美食探店', '咖啡师', '调酒师')
  }

  return [...new Set(recommendations)]
}

// 技能难度等级
export const skillDifficultyLevels = {
  beginner: {
    name: '初级',
    skills: ['出游', '晨跑夜跑', '保洁服务', '遛狗服务', '美食探店']
  },
  intermediate: {
    name: '中级',
    skills: ['家教兼职', '宠物美容', '修手机', '羽毛球', '旅游规划', '上门做菜']
  },
  advanced: {
    name: '高级',
    skills: ['医生问诊', '律师咨询', '建筑师设计', '高级护理师', '瑜伽教练', '营养师']
  }
}

// 获取技能难度
export function getSkillDifficulty(skill) {
  for (const [level, data] of Object.entries(skillDifficultyLevels)) {
    if (data.skills.includes(skill)) {
      return {
        level,
        name: data.name
      }
    }
  }
  return { level: 'beginner', name: '初级' }
}

// 根据 catId 获取分类信息
export function getCategoryByCatId(catId) {
  return categories.find(cat => cat.catId === catId)
}

// 根据 key 获取分类信息
export function getCategoryByKey(key) {
  return categories.find(cat => cat.key === key)
}

// 获取所有活跃分类（有技能映射的）
export function getActiveCategories() {
  return categories.filter(cat => cat.is_map_skill && cat.is_active)
}

// 获取分类的图标
export function getCategoryIcon(categoryKey) {
  const category = categories.find(cat => cat.key === categoryKey)
  return category?.icon || ''
}

// 获取分类的路由
export function getCategoryRoute(categoryKey) {
  const category = categories.find(cat => cat.key === categoryKey)
  return category?.route || ''
}
