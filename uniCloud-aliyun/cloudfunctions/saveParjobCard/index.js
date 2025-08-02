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
		location, 
		location_text, 
		skills, 
		categorie_tags, 
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
		// 获取当前用户信息（从云函数上下文）
		const { uid } = context.auth || {}
		
		// 验证用户ID一致性
		if (uid && uid !== user_id) {
			return {
				code: 3,
				message: '用户ID不匹配，无法操作其他用户的数据'
			}
		}
		
		// 使用云函数中的用户ID或前端传递的用户ID
		const finalUserId = uid || user_id
		
		// 检查是否已存在该用户的趴活卡片
		const existingCard = await collection.where({
			user_id: finalUserId
		}).get()
		
		const now = new Date()
		const cardData = {
			user_id: finalUserId,
			nickname: nickname || '',
			avatar: avatar || '',
			gender: gender !== undefined ? parseInt(gender) : 0,
			age: age ? parseInt(age) : null,
			education: education || '',
			city: city || '',
			location: Array.isArray(location) ? location : [],
			location_text: Array.isArray(location_text) ? location_text : [],
			skills: Array.isArray(skills) ? skills : [],
			categorie_tags: Array.isArray(categorie_tags) ? categorie_tags : [],
			strengths: strengths || '',
			photos: Array.isArray(photos) ? photos : [],
			diploma_photos: Array.isArray(diploma_photos) ? diploma_photos : [],
			certificate_photos: Array.isArray(certificate_photos) ? certificate_photos : [],
			show_fields: show_fields || {
				age: true,
				gender: true,
				education: true,
				city: true,
				skills: true,
				strengths: true,
				categorie_tags: true,
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
			
			console.log('更新趴活卡片成功:', {
				user_id: finalUserId,
				card_id: cardId,
				update_time: now
			})
		} else {
			// 创建新记录
			cardData.created_at = now
			result = await collection.add(cardData)
			
			console.log('创建趴活卡片成功:', {
				user_id: finalUserId,
				card_id: result.id,
				create_time: now
			})
		}
		
		return {
			code: 0,
			message: existingCard.data.length > 0 ? '更新成功' : '创建成功',
			data: {
				card_id: result.id || existingCard.data[0]._id,
				is_new: existingCard.data.length === 0
			}
		}
		
	} catch (error) {
		console.error('保存趴活卡片失败:', error)
		return {
			code: 2,
			message: '保存失败: ' + error.message
		}
	}
} 