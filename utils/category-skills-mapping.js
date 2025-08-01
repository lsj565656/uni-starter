// 领域和技能对应关系表
// 适用于约玩、邻帮、家政、宠物、维修、陪诊、健身、旅行、吃喝等场景

export const categorySkillsMapping = {
  // 约玩类 - 大家一起娱乐活动
  entertainment: {
    name: '约玩',
    description: '大家一起娱乐活动',
    skills: [
      '出游',
      '打球',
      '轰趴',
      '电竞',
      '桌游',
      'KTV',
      '密室逃脱',
      '剧本杀',
      '野餐',
      '烧烤',
      '露营',
      '徒步',
      '摄影',
      '绘画',
      '手工DIY',
      '音乐',
      '舞蹈',
      '瑜伽',
      '冥想',
      '读书会'
    ],
    tags: ['娱乐', '社交', '休闲', '户外', '室内']
  },

  // 邻帮 - 邻里互助服务
  neighborhood: {
    name: '邻帮',
    description: '邻里之间互相帮助的服务',
    skills: [
      '家教兼职',
      '上门理发',
      '上门送菜',
      '律师咨询',
      '医生问诊',
      '建筑师设计',
      '家装设计师',
      '护士护理',
      '心理咨询',
      '财务咨询',
      '翻译服务',
      '代购服务',
      '代驾服务',
      '搬家服务',
      '装修咨询',
      '园艺服务',
      '临时看护',
      '跑腿服务'
    ],
    tags: ['邻里互助', '专业服务', '便民服务', '咨询指导']
  },

  // 家政类 - 家庭生活服务
  housekeeping: {
    name: '家政',
    description: '家庭生活相关服务',
    skills: [
      '生活收纳师',
      '保洁服务',
      '母婴护理',
      '月嫂服务',
      '老人护理',
      '病患护理',
      '家庭厨师',
      '管家服务',
      '洗衣熨烫',
      '家居整理',
      '深度清洁',
      '家电清洗',
      '玻璃清洗',
      '地毯清洗',
      '帘纱洗换',
      '除醛除螨',
      '除尘除渍'
    ],
    tags: ['家政服务', '生活服务', '清洁护理', '家庭管理']
  },

  // 宠物类 - 宠物相关服务
  pet: {
    name: '宠物',
    description: '宠物相关服务',
    skills: [
      '宠物医生',
      '宠物美容',
      '宠物寄养',
      '遛狗服务',
      '宠物训练',
      '宠物护理',
      '宠物用品',
      '宠物殡葬',
      '宠物营养师',
      '行为矫正',
      '宠物急救',
      '疫苗接种',
      '绝育手术',
      '宠物体检',
      '宠物按摩',
      '宠物SPA',
      '宠物社交'
    ],
    tags: ['宠物服务', '动物护理', '宠物健康', '宠物美容']
  },

  // 维修类 - 各类维修服务
  maintenance: {
    name: '维修',
    description: '各类设备维修服务',
    skills: [
      '修手机',
      '修电脑',
      '防水补漏',
      '水电维修',
      '家电维修',
      '家具维修',
      '门窗维修',
      '管道疏通',
      '网络维修',
      '地暖维修',
      '电梯维修',
      '安防系统维修'
    ],
    tags: ['维修服务', '技术维修', '设备维护', '故障排除']
  },

  // 陪诊类 - 医疗陪护服务
  medical: {
    name: '陪诊',
    description: '医疗陪护相关服务',
    skills: [
      '陪诊师',
      '高级护理师',
      '营养师',
      '康复师',
      '理疗师',
      '心理咨询师',
      '体检陪护',
      '手术陪护',
      '住院陪护',
      '老人陪诊',
      '慢性病管理',
      '健康管理师'
    ],
    tags: ['医疗陪护', '健康服务', '专业护理', '医疗咨询']
  },

  // 健身类 - 运动健身服务
  fitness: {
    name: '健身',
    description: '运动健身相关服务',
    skills: [
      '羽毛球',
      '单杠训练',
      '轮滑',
      '台球',
      '篮球',
      '晨跑夜跑',
      '健身房指导',
      '瑜伽教练',
      '普拉提',
      '游泳教练',
      '网球教练',
      '乒乓球',
      '足球',
      '排球',
      '攀岩',
      '滑雪',
      '滑板',
      '骑行',
      '力量训练'
    ],
    tags: ['运动健身', '体育训练', '体能训练', '健康生活']
  },

  // 旅行类 - 旅游出行服务
  travel: {
    name: '旅行',
    description: '旅游出行相关服务',
    skills: [
      '打卡攻略',
      '爬山',
      '自驾游',
      '旅游规划',
      '导游服务',
      '摄影指导',
      '户外探险',
      '民宿推荐',
      '文化体验',
      '亲子游',
      '情侣游',
      '团队游',
      '定制旅行',
      '租车服务',
      '地陪'
    ],
    tags: ['旅游出行', '休闲娱乐', '文化体验', '户外探险']
  },

  // 吃喝类 - 美食餐饮服务
  food: {
    name: '吃喝',
    description: '美食餐饮相关服务',
    skills: [
      '特色美食',
      '上门做菜',
      '烘焙师',
      '咖啡师',
      '调酒师',
      '茶艺师',
      '品酒师',
      '美食探店',
      '团餐打卡',
      '私房菜',
      '减肥餐',
      '增肌餐',
      '素食料理',
      '西餐制作',
      '日料制作'
    ],
    tags: ['美食餐饮', '健康饮食', '烹饪服务', '美食体验']
  }
}

// 获取所有技能列表
export function getAllSkills() {
  const allSkills = []
  Object.values(categorySkillsMapping).forEach(category => {
    allSkills.push(...category.skills)
  })
  return [...new Set(allSkills)] // 去重
}

// 根据技能获取所属领域
export function getCategoryBySkill(skill) {
  for (const [key, category] of Object.entries(categorySkillsMapping)) {
    if (category.skills.includes(skill)) {
      return {
        key,
        name: category.name,
        description: category.description
      }
    }
  }
  return null
}

// 获取指定领域的所有技能
export function getSkillsByCategory(categoryKey) {
  return categorySkillsMapping[categoryKey]?.skills || []
}

// 获取所有领域列表
export function getAllCategories() {
  return Object.entries(categorySkillsMapping).map(([key, category]) => ({
    key,
    name: category.name,
    description: category.description,
    skills: category.skills,
    skillCount: category.skills.length
  }))
}

// 搜索技能（支持模糊匹配）
export function searchSkills(keyword) {
  const results = []
  const lowerKeyword = keyword.toLowerCase()

  Object.entries(categorySkillsMapping).forEach(([key, category]) => {
    const matchedSkills = category.skills.filter(skill => skill.toLowerCase().includes(lowerKeyword))
    if (matchedSkills.length > 0) {
      results.push({
        category: {
          key,
          name: category.name,
          description: category.description
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
  '家教',
  '保洁服务',
  '宠物美容',
  '修手机',
  '修电脑',
  '通下水道',
  '陪诊服务',
  '羽毛球',
  '篮球',
  '晨跑夜跑',
  '旅游规划',
  '特色美食',
  '上门做菜',
  '营养师指导',
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
    recommendations.push('晨跑夜跑', '太极', '中医理疗师', '营养师指导', '老人护理')
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
    skills: ['家教', '宠物美容', '修手机', '羽毛球', '旅游规划', '上门做菜']
  },
  advanced: {
    name: '高级',
    skills: ['医生问诊', '律师咨询', '建筑师设计', '高级护理师', '瑜伽教练', '营养师指导']
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
