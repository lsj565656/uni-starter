'use strict';

const db = uniCloud.database()
const collection = db.collection('kl-parjob-card')

exports.main = async (event, context) => {
  try {
    // 获取所有开启趴活状态的用户卡片
    const result = await collection.where({
      is_active: true
    }).get()
    
    if (result.data && result.data.length > 0) {
      return {
        code: 0,
        message: '获取成功',
        data: result.data
      }
    } else {
      return {
        code: 0,
        message: '暂无活跃用户',
        data: []
      }
    }
  } catch (error) {
    console.error('获取活跃用户列表失败:', error)
    return {
      code: 1,
      message: '获取失败: ' + error.message,
      data: []
    }
  }
} 