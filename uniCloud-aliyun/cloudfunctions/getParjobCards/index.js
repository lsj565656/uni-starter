'use strict'

const db = uniCloud.database()
const collection = db.collection('kl-parjob-card')

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, city, gender, skills, ageRange, excludeUserId } = event

  try {
    // 构建查询条件
    let whereCondition = {
      is_active: true
    }

    // 城市筛选
    if (city) {
      whereCondition.city = city
    }

    // 性别筛选
    if (gender) {
      whereCondition.gender = gender
    }

    // 技能筛选
    if (skills && skills.length > 0) {
      whereCondition.skills = db.command.in(skills)
    }

    // 年龄范围筛选
    if (ageRange && ageRange.min !== undefined && ageRange.max !== undefined) {
      whereCondition.age = db.command.and([
        db.command.gte(ageRange.min),
        db.command.lte(ageRange.max)
      ])
    }

    // 排除指定用户
    if (excludeUserId) {
      whereCondition.user_id = db.command.neq(excludeUserId)
    }

    // 计算分页
    const skip = (page - 1) * pageSize

    // 查询数据
    const result = await collection
      .where(whereCondition)
      .skip(skip)
      .limit(pageSize)
      .orderBy('updated_at', 'desc')
      .get()

    // 获取总数
    const countResult = await collection.where(whereCondition).count()

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize,
        hasMore: result.data.length === pageSize
      }
    }
  } catch (error) {
    console.error('获取趴活卡片失败:', error)
    return {
      code: 1,
      message: '获取失败: ' + error.message
    }
  }
}
