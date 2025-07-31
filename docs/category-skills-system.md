# 领域技能分类体系

## 概述

本分类体系为趴活广场应用设计，涵盖9大领域，180+技能，满足用户多样化的服务需求。

## 分类结构

### 1. 约玩 (Entertainment) 🎮
**描述**: 大家一起娱乐活动
**核心技能**: 出游、打球、轰趴、电竞、桌游、KTV、密室逃脱、剧本杀等
**适用场景**: 社交娱乐、休闲放松、团队活动

### 2. 邻帮里 (Neighborhood) 🏘️
**描述**: 邻里之间互相帮助的服务
**核心技能**: 家教、上门理发、律师咨询、医生问诊、建筑师设计等
**适用场景**: 邻里互助、专业服务、便民服务

### 3. 家政 (Housekeeping) 🏠
**描述**: 家庭生活相关服务
**核心技能**: 生活收纳师、保洁服务、母婴护理、月嫂服务、老人护理等
**适用场景**: 家庭服务、生活管理、清洁护理

### 4. 宠物 (Pet) 🐕
**描述**: 宠物相关服务
**核心技能**: 宠物医生、训犬师、宠物美容、宠物寄养、遛狗服务等
**适用场景**: 宠物护理、动物健康、宠物美容

### 5. 维修 (Maintenance) 🔧
**描述**: 各类设备维修服务
**核心技能**: 修手机、修电脑、通下水道、防水补漏、水电维修等
**适用场景**: 设备维修、技术维护、故障排除

### 6. 陪诊 (Medical) 🏥
**描述**: 医疗陪护相关服务
**核心技能**: 自由职业陪诊、高级护理师、医生陪诊、护士陪护、营养师指导等
**适用场景**: 医疗陪护、健康服务、专业护理

### 7. 健身 (Fitness) 💪
**描述**: 运动健身相关服务
**核心技能**: 羽毛球、单杠训练、轮滑、台球、篮球、晨跑夜跑等
**适用场景**: 运动健身、体育训练、健康生活

### 8. 旅行 (Travel) ✈️
**描述**: 旅游出行相关服务
**核心技能**: 打卡攻略、爬山向导、团票报旅行、自驾游、旅游规划等
**适用场景**: 旅游出行、休闲娱乐、文化体验

### 9. 吃喝 (Food) 🍽️
**描述**: 美食餐饮相关服务
**核心技能**: 特色美食、上门做菜、厨师服务、营养师指导、烘焙师等
**适用场景**: 美食餐饮、健康饮食、烹饪服务

## 技能难度等级

### 初级 (Beginner)
- 出游、晨跑夜跑、保洁服务、遛狗服务、美食探店
- 特点: 门槛低，容易上手，适合新手

### 中级 (Intermediate)
- 家教、宠物美容、修手机、羽毛球、旅游规划、上门做菜
- 特点: 需要一定技能和经验

### 高级 (Advanced)
- 医生问诊、律师咨询、建筑师设计、高级护理师、瑜伽教练、营养师指导
- 特点: 专业性强，需要资质认证

## 使用场景

### 1. 用户信息卡
- 用户选择技能时按领域分类展示
- 推荐相关技能给用户
- 显示技能难度等级

### 2. 筛选功能
- 按领域筛选用户
- 按技能筛选用户
- 按难度等级筛选

### 3. 搜索功能
- 支持技能名称模糊搜索
- 按领域搜索相关技能
- 智能推荐相关技能

### 4. 推荐系统
- 基于技能匹配推荐用户
- 基于领域匹配推荐用户
- 个性化推荐算法

### 5. 数据统计
- 各领域用户分布统计
- 热门技能排行
- 技能匹配度分析

## API 接口

### 获取所有技能
```javascript
import { getAllSkills } from '@/utils/category-skills-mapping.js'
const allSkills = getAllSkills()
```

### 获取所有领域
```javascript
import { getAllCategories } from '@/utils/category-skills-mapping.js'
const categories = getAllCategories()
```

### 根据技能获取领域
```javascript
import { getCategoryBySkill } from '@/utils/category-skills-mapping.js'
const category = getCategoryBySkill('瑜伽教练')
```

### 搜索技能
```javascript
import { searchSkills } from '@/utils/category-skills-mapping.js'
const results = searchSkills('瑜伽')
```

### 获取推荐技能
```javascript
import { getRecommendedSkills } from '@/utils/category-skills-mapping.js'
const recommendations = getRecommendedSkills({
  age: 25,
  gender: 2,
  city: '北京'
})
```

## 数据结构

### 领域数据结构
```javascript
{
  key: 'entertainment',
  name: '约玩',
  description: '大家一起娱乐活动',
  skills: ['出游', '打球', '轰趴', ...],
  tags: ['娱乐', '社交', '休闲', '户外', '室内']
}
```

### 用户技能数据结构
```javascript
{
  skill: '瑜伽教练',
  difficulty: { level: 'advanced', name: '高级' },
  category: { key: 'fitness', name: '健身', description: '运动健身相关服务' }
}
```

## 扩展指南

### 添加新技能
1. 在 `categorySkillsMapping` 中找到对应领域
2. 在 `skills` 数组中添加新技能
3. 更新 `skillDifficultyLevels` 中的难度等级
4. 更新 `popularSkills` 数组（如需要）

### 添加新领域
1. 在 `categorySkillsMapping` 中添加新领域对象
2. 包含 `name`、`description`、`skills`、`tags` 属性
3. 更新相关工具函数
4. 添加对应的图标和颜色

### 自定义推荐算法
1. 修改 `getRecommendedSkills` 函数
2. 添加更多用户画像维度
3. 调整推荐权重
4. 添加机器学习算法

## 最佳实践

1. **技能选择**: 建议用户选择3-5个技能，涵盖不同领域
2. **难度平衡**: 初级、中级、高级技能搭配选择
3. **领域覆盖**: 选择相关领域的技能，提高匹配度
4. **定期更新**: 根据用户反馈和市场需求更新技能列表
5. **数据验证**: 使用 `validateUserSkills` 验证用户输入的技能

## 更新日志

- **v1.0.0**: 初始版本，包含9大领域，180+技能
- **v1.1.0**: 添加技能难度等级和推荐算法
- **v1.2.0**: 优化搜索功能和匹配算法 