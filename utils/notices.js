// 模拟通告消息数据
export const notices = [
  {
    id: 1,
    text: '用户 小明 刚刚浏览了首页',
    type: 'browse',
    time: '刚刚',
    timestamp: Date.now() - 1000 * 60 * 1 // 1分钟前
  },
  {
    id: 2,
    text: '用户 小红 发布了一个新任务：帮忙取快递',
    type: 'publish',
    time: '2分钟前',
    timestamp: Date.now() - 1000 * 60 * 2 // 2分钟前
  },
  {
    id: 3,
    text: '用户 小李 加入了任务：帮忙打扫卫生',
    type: 'join',
    time: '5分钟前',
    timestamp: Date.now() - 1000 * 60 * 5 // 5分钟前
  },
  {
    id: 4,
    text: '用户 小王 开始趴活：周末有空，可提供跑腿服务',
    type: 'seek',
    time: '8分钟前',
    timestamp: Date.now() - 1000 * 60 * 8 // 8分钟前
  },
  {
    id: 5,
    text: '用户 小张 完成了任务：帮忙买早餐',
    type: 'complete',
    time: '10分钟前',
    timestamp: Date.now() - 1000 * 60 * 10 // 10分钟前
  },
  {
    id: 6,
    text: '用户 小赵 发布了一个新任务：帮忙搬家',
    type: 'publish',
    time: '15分钟前',
    timestamp: Date.now() - 1000 * 60 * 15 // 15分钟前
  },
  {
    id: 7,
    text: '用户 小钱 加入了任务：帮忙取快递',
    type: 'join',
    time: '18分钟前',
    timestamp: Date.now() - 1000 * 60 * 18 // 18分钟前
  },
  {
    id: 8,
    text: '用户 小孙 开始趴活：晚上有空，可提供家教服务',
    type: 'seek',
    time: '20分钟前',
    timestamp: Date.now() - 1000 * 60 * 20 // 20分钟前
  },
  {
    id: 9,
    text: '用户 小周 刚刚浏览了首页',
    type: 'browse',
    time: '25分钟前',
    timestamp: Date.now() - 1000 * 60 * 25 // 25分钟前
  },
  {
    id: 10,
    text: '用户 小吴 完成了任务：帮忙打扫卫生',
    type: 'complete',
    time: '30分钟前',
    timestamp: Date.now() - 1000 * 60 * 30 // 30分钟前
  },
  {
    id: 11,
    text: '用户 小郑 发布了一个新任务：帮忙遛狗',
    type: 'publish',
    time: '35分钟前',
    timestamp: Date.now() - 1000 * 60 * 35 // 35分钟前
  },
  {
    id: 12,
    text: '用户 小王 加入了任务：帮忙搬家',
    type: 'join',
    time: '40分钟前',
    timestamp: Date.now() - 1000 * 60 * 40 // 40分钟前
  },
  {
    id: 13,
    text: '用户 小陈 开始趴活：下午有空，可提供临时工服务',
    type: 'seek',
    time: '45分钟前',
    timestamp: Date.now() - 1000 * 60 * 45 // 45分钟前
  },
  {
    id: 14,
    text: '用户 小刘 刚刚浏览了首页',
    type: 'browse',
    time: '50分钟前',
    timestamp: Date.now() - 1000 * 60 * 50 // 50分钟前
  },
  {
    id: 15,
    text: '用户 小黄 完成了任务：帮忙遛狗',
    type: 'complete',
    time: '55分钟前',
    timestamp: Date.now() - 1000 * 60 * 55 // 55分钟前
  }
]

// 抽奖相关数据
export const lotteries = {
  // 奖品列表
  prizes: [
    { id: 1, name: '积分+200', type: 'score', value: 200, weight: 5 },
    { id: 2, name: '便民水卡', type: 'physical', value: 1, weight: 8 },
    { id: 3, name: '积分+50', type: 'score', value: 50, weight: 10 },
    { id: 4, name: '卡通手办', type: 'physical', value: 2, weight: 8 },
    { id: 5, name: '毛绒玩具', type: 'physical', value: 3, weight: 8 },
    { id: 6, name: '加油卡', type: 'physical', value: 4, weight: 8 },
    { id: 7, name: '谢谢参与', type: 'empty', value: 0, weight: 20 }
  ],
  
  // 用户列表（用于生成随机中奖用户）
  users: [
    '小明', '小红', '小李', '小王', '小张', '小赵', '小钱', '小孙', '小周', '小吴',
    '小郑', '小陈', '小刘', '小黄', '小马', '小牛', '小虎', '小兔', '小龙', '小蛇',
    '小羊', '小猴', '小鸡', '小狗', '小猪', '小鹿', '小象', '小狮', '小虎', '小豹'
  ],
  
  // 抽奖中奖记录（模拟数据）
  records: [
    {
      id: 1,
      userId: 'user1',
      nickname: '文文',
      prize: '扭扭车',
      time: Date.now() - 1000 * 60 * 5, // 5分钟前
      type: 'lottery'
    },
    {
      id: 2,
      userId: 'user2',
      nickname: '罡风啊',
      prize: '遥控车',
      time: Date.now() - 1000 * 60 * 12, // 12分钟前
      type: 'lottery'
    },
    {
      id: 3,
      userId: 'user3',
      nickname: '美满人生',
      prize: '积分+200',
      time: Date.now() - 1000 * 60 * 18, // 18分钟前
      type: 'lottery'
    },
    {
      id: 4,
      userId: 'user4',
      nickname: '赵四',
      prize: '便民水卡',
      time: Date.now() - 1000 * 60 * 25, // 25分钟前
      type: 'lottery'
    },
    {
      id: 5,
      userId: 'user5',
      nickname: '小明',
      prize: '毛绒玩具',
      time: Date.now() - 1000 * 60 * 35, // 35分钟前
      type: 'lottery'
    },
    {
      id: 6,
      userId: 'user6',
      nickname: '小红',
      prize: '加油卡',
      time: Date.now() - 1000 * 60 * 42, // 42分钟前
      type: 'lottery'
    }
  ]
}

// 根据类型获取不同的图标
export const getNoticeIcon = type => {
  switch (type) {
    case 'browse': {
      return 'eye'
    }
    case 'publish': {
      return 'plus'
    }
    case 'join': {
      return 'personadd'
    }
    case 'seek': {
      return 'search'
    }
    case 'complete': {
      return 'checkmarkempty'
    }
    case 'lottery': {
      return 'gift'
    }
    default: {
      return 'info'
    }
  }
}

// 根据类型获取不同的颜色
export const getNoticeColor = type => {
  switch (type) {
    case 'browse': {
      return '#2979ff'
    }
    case 'publish': {
      return '#19be6b'
    }
    case 'join': {
      return '#ff9900'
    }
    case 'seek': {
      return '#9c26b0'
    }
    case 'complete': {
      return '#f56c6c'
    }
    case 'lottery': {
      return '#ff6b00'
    }
    default: {
      return '#909399'
    }
  }
}

// 格式化时间显示
export const formatTimeAgo = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 1000 * 60) { // 1分钟内
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) { // 1小时内
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) { // 24小时内
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours}小时前`
  } else if (diff < 1000 * 60 * 60 * 24 * 7) { // 7天内
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return `${days}天前`
  } else {
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }
}

// 生成随机抽奖中奖通告
export const generateRandomLotteryNotice = () => {
  const user = lotteries.users[Math.floor(Math.random() * lotteries.users.length)]
  const prize = lotteries.prizes[Math.floor(Math.random() * lotteries.prizes.length)]
  
  // 根据奖品类型生成不同的文本
  let prizeText = prize.name
  if (prize.type === 'score') {
    prizeText = `积分+${prize.value}`
  } else if (prize.type === 'physical') {
    prizeText = prize.name
  } else if (prize.type === 'empty') {
    prizeText = '谢谢参与'
  }
  
  return {
    id: Date.now(),
    text: `恭喜 ${user} 抽中了${prizeText}`,
    type: 'lottery',
    time: '刚刚',
    timestamp: Date.now(),
    userId: `user_${Math.floor(Math.random() * 1000)}`,
    nickname: user,
    prize: prizeText,
    prizeType: prize.type
  }
}

// 生成随机通告消息
export const generateRandomNotice = () => {
  const users = [
    '小明',
    '小红',
    '小李',
    '小王',
    '小张',
    '小赵',
    '小钱',
    '小孙',
    '小周',
    '小吴',
    '小郑',
    '小陈',
    '小刘',
    '小黄',
    '小马',
    '小牛',
    '小虎',
    '小兔',
    '小龙',
    '小蛇'
  ]
  const tasks = [
    '帮忙取快递',
    '帮忙打扫卫生',
    '帮忙搬家',
    '帮忙买早餐',
    '帮忙遛狗',
    '帮忙做饭',
    '帮忙洗衣服',
    '帮忙看孩子',
    '帮忙修电脑',
    '帮忙送外卖'
  ]
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
    { type: 'seek', text: `用户 ${user} 开始趴活：${service}` },
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

// 混合生成随机通告（包含抽奖和普通通告）
export const generateMixedRandomNotice = () => {
  // 30% 概率生成抽奖通告，70% 概率生成普通通告
  if (Math.random() < 0.3) {
    return generateRandomLotteryNotice()
  } else {
    return generateRandomNotice()
  }
}
