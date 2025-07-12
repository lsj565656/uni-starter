import { images } from './images'

export const flourProcess = [
	{
		id: 1,
		name: '发布任务',
		icon: 'icon-wanjie',
		time: '18:00',
		images: [
			images.process.mianfen,
			'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg',
			'https://s3.bmp.ovh/imgs/2025/06/10/74a9c32cd547c77f.jpg'
		],
		status: 'completed'
	},
	{
		id: 2,
		name: '选择发任务/趴活',
		icon: 'icon-wanjie',
		time: '18:15',
		images: [
			images.process.hemianguo,
			'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg',
			'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg',
			'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg'
		],
		status: 'completed'
	},
	{
		id: 3,
		name: '完善任务/个人信息',
		icon: 'icon-wanjie',
		time: '18:30',
		image: images.process.baozhi_1,
		status: 'completed'
	},
	{
		id: 4,
		name: '成功发布后等待',
		icon: 'icon-wanjie',
		time: '18:45',
		image: images.process.baozhi_2,
		status: 'completed'
	},
	{
		id: 5,
		name: '参与者加入后任务进行',
		icon: 'icon-wanjie',
		time: '19:00',
		image: images.process.shaobing,
		status: 'completed'
	},
	{
		id: 6,
		name: '任务结算',
		icon: 'icon-wanjie',
		time: '19:20',
		image: images.process.shaobing,
		status: 'completed'
	}
] 