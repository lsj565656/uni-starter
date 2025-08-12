// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const dbCmd = db.command
const signInTable = db.collection('opendb-sign-in');
const scoresTable = db.collection('uni-id-scores');
module.exports = {
	before: async (state, event) => {
		// console.log({state});
		if(state.type == 'create'){
			let date = todayTimestamp()
			let {total} = await signInTable.where({
				user_id:state.auth.uid,
				date,
				isDelete:false
			}).count()
			console.log(total);
			if(total){
			  throw new Error("今天已经签到")
			}
			state.newData.date = date
			state.newData.isDelete = false
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let date = todayTimestamp()
		//查最近7天的签到情况
		let {data:signInData} = await signInTable.where({
			user_id:state.auth.uid,
			date:dbCmd.gte(date-3600*24*6*1000),
			isDelete:false
		}).get()
		
		// 按日期排序，确保时间顺序正确
		signInData.sort((a, b) => a.date - b.date)
		
		let allDate = signInData.map(item=>item.date)
		
		//今天是本轮签到的第几天
		const n = signInData.length + 1; // 简化计算：已签到天数 + 1
		
		// 计算已签到的天数索引（0-6，对应第1-7天）
		let days = []
		if (signInData.length > 0) {
			// 如果这是第一轮签到，直接使用索引
			if (signInData.length <= 7) {
				days = signInData.map((item, index) => index)
			} else {
				// 如果超过7天，计算新的轮次
				const currentRound = Math.floor(signInData.length / 7)
				const dayInRound = signInData.length % 7
				days = Array.from({length: dayInRound}, (_, i) => i)
			}
		}
		
		//查出来用户当前有多少积分
		let {data: [userScore]} = await scoresTable
										.where({user_id:state.auth.uid})
										.orderBy("create_date", "desc")
										.limit(1)
										.get()
		let balance = 0
		if(userScore){
			balance = userScore.balance
		}
		
		if(state.type == 'create'){
			if(n == 7){ //如果已经满一轮就软删除之前的内容
				let setIsDeleteRes = await signInTable.where({
					user_id:state.auth.uid,
					date:dbCmd.neq(date)
				}).update({isDelete:true})
				console.log({setIsDeleteRes});
			}
			//给加积分
			let score = n == 7 ? 60 : 10 //如果连续签到7天就多加50分，也就是60分
			balance += score
			let addScores = await scoresTable.add({
				user_id:state.auth.uid,
				balance,
				score,
				type:1,
				create_date:Date.now()
			})
			console.log({addScores});
		}
		
		console.log('签到数据:', {signInData: signInData.length, n, days, balance})
		return {...result,score:balance,signInData,n,days}
	}
}


function todayTimestamp(){
	// 获取当前北京时间（UTC+8）的当天凌晨时间戳
	const now = new Date()
	const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 转换为北京时间
	const year = beijingTime.getUTCFullYear()
	const month = beijingTime.getUTCMonth()
	const day = beijingTime.getUTCDate()
	
	// 创建当天凌晨的UTC时间戳
	const todayStart = new Date(Date.UTC(year, month, day))
	return todayStart.getTime()
}