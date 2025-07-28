'use strict';

const db = uniCloud.database()
const collection = db.collection('kl-parjob-card')

exports.main = async (event, context) => {
	const { user_id } = event
	
	if (!user_id) {
		return {
			code: 1,
			message: '用户ID不能为空'
		}
	}
	
	try {
		const result = await collection
			.where({
				user_id: user_id
			})
			.get()
		
		if (result.data.length === 0) {
			return {
				code: 2,
				message: '未找到该用户的趴活卡片',
				data: null
			}
		}
		
		return {
			code: 0,
			message: '获取成功',
			data: result.data[0]
		}
		
	} catch (error) {
		console.error('获取用户趴活卡片失败:', error)
		return {
			code: 3,
			message: '获取失败: ' + error.message
		}
	}
} 