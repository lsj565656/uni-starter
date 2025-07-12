// 模拟通告消息数据
export const notices = [
	{
		id: 1,
		text: "用户 小明 刚刚浏览了首页",
		type: "browse",
		time: "刚刚",
		timestamp: Date.now() - 1000 * 60 * 1 // 1分钟前
	},
	{
		id: 2,
		text: "用户 小红 发布了一个新任务：帮忙取快递",
		type: "publish",
		time: "2分钟前",
		timestamp: Date.now() - 1000 * 60 * 2 // 2分钟前
	},
	{
		id: 3,
		text: "用户 小李 加入了任务：帮忙打扫卫生",
		type: "join",
		time: "5分钟前",
		timestamp: Date.now() - 1000 * 60 * 5 // 5分钟前
	},
	{
		id: 4,
		text: "用户 小王 发布了趴活：周末有空，可提供跑腿服务",
		type: "seek",
		time: "8分钟前",
		timestamp: Date.now() - 1000 * 60 * 8 // 8分钟前
	},
	{
		id: 5,
		text: "用户 小张 完成了任务：帮忙买早餐",
		type: "complete",
		time: "10分钟前",
		timestamp: Date.now() - 1000 * 60 * 10 // 10分钟前
	},
	{
		id: 6,
		text: "用户 小赵 发布了一个新任务：帮忙搬家",
		type: "publish",
		time: "15分钟前",
		timestamp: Date.now() - 1000 * 60 * 15 // 15分钟前
	},
	{
		id: 7,
		text: "用户 小钱 加入了任务：帮忙取快递",
		type: "join",
		time: "18分钟前",
		timestamp: Date.now() - 1000 * 60 * 18 // 18分钟前
	},
	{
		id: 8,
		text: "用户 小孙 发布了趴活：晚上有空，可提供家教服务",
		type: "seek",
		time: "20分钟前",
		timestamp: Date.now() - 1000 * 60 * 20 // 20分钟前
	},
	{
		id: 9,
		text: "用户 小周 刚刚浏览了首页",
		type: "browse",
		time: "25分钟前",
		timestamp: Date.now() - 1000 * 60 * 25 // 25分钟前
	},
	{
		id: 10,
		text: "用户 小吴 完成了任务：帮忙打扫卫生",
		type: "complete",
		time: "30分钟前",
		timestamp: Date.now() - 1000 * 60 * 30 // 30分钟前
	},
	{
		id: 11,
		text: "用户 小郑 发布了一个新任务：帮忙遛狗",
		type: "publish",
		time: "35分钟前",
		timestamp: Date.now() - 1000 * 60 * 35 // 35分钟前
	},
	{
		id: 12,
		text: "用户 小王 加入了任务：帮忙搬家",
		type: "join",
		time: "40分钟前",
		timestamp: Date.now() - 1000 * 60 * 40 // 40分钟前
	},
	{
		id: 13,
		text: "用户 小陈 发布了趴活：下午有空，可提供临时工服务",
		type: "seek",
		time: "45分钟前",
		timestamp: Date.now() - 1000 * 60 * 45 // 45分钟前
	},
	{
		id: 14,
		text: "用户 小刘 刚刚浏览了首页",
		type: "browse",
		time: "50分钟前",
		timestamp: Date.now() - 1000 * 60 * 50 // 50分钟前
	},
	{
		id: 15,
		text: "用户 小黄 完成了任务：帮忙遛狗",
		type: "complete",
		time: "55分钟前",
		timestamp: Date.now() - 1000 * 60 * 55 // 55分钟前
	}
]

// 根据类型获取不同的图标
export const getNoticeIcon = (type) => {
	switch (type) {
		case 'browse':
			return 'eye'
		case 'publish':
			return 'plus'
		case 'join':
			return 'personadd'
		case 'seek':
			return 'search'
		case 'complete':
			return 'checkmarkempty'
		default:
			return 'info'
	}
}

// 根据类型获取不同的颜色
export const getNoticeColor = (type) => {
	switch (type) {
		case 'browse':
			return '#2979ff'
		case 'publish':
			return '#19be6b'
		case 'join':
			return '#ff9900'
		case 'seek':
			return '#9c26b0'
		case 'complete':
			return '#f56c6c'
		default:
			return '#909399'
	}
}

// 生成随机通告消息
export const generateRandomNotice = () => {
	const users = ['小明', '小红', '小李', '小王', '小张', '小赵', '小钱', '小孙', '小周', '小吴', '小郑', '小陈', '小刘', '小黄', '小马', '小牛', '小虎', '小兔', '小龙', '小蛇']
	const tasks = ['帮忙取快递', '帮忙打扫卫生', '帮忙搬家', '帮忙买早餐', '帮忙遛狗', '帮忙做饭', '帮忙洗衣服', '帮忙看孩子', '帮忙修电脑', '帮忙送外卖']
	const services = [
		'周末有空，可提供跑腿服务',
		'晚上有空，可提供家教服务',
		'下午有空，可提供临时工服务',
		'上午有空，可提供代购服务',
		'全天有空，可提供陪护服务',
		'工作日有空，可提供翻译服务',
		'节假日有空，可提供摄影服务',
		'晚上有空，可提供代驾服务',
		'周末有空，可提供装修服务',
		'下午有空，可提供清洁服务'
	]
	
	const user = users[Math.floor(Math.random() * users.length)]
	const task = tasks[Math.floor(Math.random() * tasks.length)]
	const service = services[Math.floor(Math.random() * services.length)]
	
	const types = [
		{ type: 'browse', text: `用户 ${user} 刚刚浏览了首页` },
		{ type: 'publish', text: `用户 ${user} 发布了一个新任务：${task}` },
		{ type: 'join', text: `用户 ${user} 加入了任务：${task}` },
		{ type: 'seek', text: `用户 ${user} 发布了趴活：${service}` },
		{ type: 'complete', text: `用户 ${user} 完成了任务：${task}` }
	]
	
	const randomType = types[Math.floor(Math.random() * types.length)]
	
	return {
		id: Date.now(),
		text: randomType.text,
		type: randomType.type,
		time: '刚刚',
		timestamp: Date.now() // 新生成的消息时间戳为当前时间
	}
} 