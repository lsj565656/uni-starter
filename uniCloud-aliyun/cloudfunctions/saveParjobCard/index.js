'use strict';

const db = uniCloud.database()
const collection = db.collection('kl-parjob-card')

exports.main = async (event, context) => {
	const { 
		user_id, 
		nickname, 
		avatar, 
		gender, 
		age, 
		education, 
		city, 
		skills, 
		tags, 
		strengths, 
		photos, 
		diploma_photos, 
		certificate_photos, 
		show_fields, 
		is_active, 
		allow_homepage_view 
	} = event
	
	// 验证必填字段
	if (!user_id || !nickname || !avatar) {
		return {
			code: 1,
			message: '用户ID、昵称、头像为必填字段'
		}
	}
	
	try {
		// 检查是否已存在该用户的趴活卡片
		const existingCard = await collection.where({
			user_id: user_id
		}).get()
		
		const now = new Date()
		const cardData = {
			user_id,
			nickname,
			avatar,
			gender: gender || '',
			age: age ? parseInt(age) : null,
			education: education || '',
			city: city || '',
			skills: skills || [],
			tags: tags || [],
			strengths: strengths || '',
			photos: photos || [],
			diploma_photos: diploma_photos || [],
			certificate_photos: certificate_photos || [],
			show_fields: show_fields || {
				age: true,
				gender: true,
				education: true,
				city: true,
				skills: true,
				strengths: true,
				tags: true,
				photos: true
			},
			is_active: is_active !== undefined ? is_active : true,
			allow_homepage_view: allow_homepage_view !== undefined ? allow_homepage_view : false,
			updated_at: now
		}
		
		let result
		
		if (existingCard.data.length > 0) {
			// 更新现有记录
			const cardId = existingCard.data[0]._id
			result = await collection.doc(cardId).update(cardData)
		} else {
			// 创建新记录
			cardData.created_at = now
			result = await collection.add(cardData)
		}
		
		return {
			code: 0,
			message: '保存成功',
			data: result
		}
		
	} catch (error) {
		console.error('保存趴活卡片失败:', error)
		return {
			code: 2,
			message: '保存失败: ' + error.message
		}
	}
} 