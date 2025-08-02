'use strict';

const db = uniCloud.database()
const collection = db.collection('kl-parjob-card')

exports.main = async (event, context) => {
	const { user_id } = event
	
	// 验证用户ID
	if (!user_id) {
		return {
			code: 1,
			message: '用户ID不能为空'
		}
	}
	
	try {
		// 获取当前用户信息（从云函数上下文）
		const { uid } = context.auth || {}
		
		// 验证用户ID一致性
		if (uid && uid !== user_id) {
			return {
				code: 3,
				message: '用户ID不匹配，无法获取其他用户的数据'
			}
		}
		
		// 使用云函数中的用户ID或前端传递的用户ID
		const finalUserId = uid || user_id
		
		// 查询用户趴活信息卡
		const result = await collection.where({
			user_id: finalUserId
		}).get()
		
		if (result.data.length > 0) {
			// 找到用户信息卡
			const userCard = result.data[0]
			return {
				code: 0,
				message: '获取成功',
				data: userCard
			}
		} else {
			// 未找到用户信息卡
			return {
				code: 2,
				message: '未找到用户信息卡',
				data: null
			}
		}
		
	} catch (error) {
		console.error('获取用户趴活信息卡失败:', error)
		return {
			code: 4,
			message: '获取失败: ' + error.message
		}
	}
} 