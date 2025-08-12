'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data, uid: eventUid } = event;
  let uid = eventUid;
  
  // 优先使用传递的uid，如果没有则使用context.auth中的uid
  if (!uid && context.auth) {
    uid = context.auth.uid;
  }
  
  if (!uid) {
    return {
      code: 401,
      message: '用户未登录'
    };
  }
  
  switch (action) {
    case 'getUserScore':
      return await getUserScore(uid);
    case 'getScoreHistory':
      return await getScoreHistory(uid, data);
    case 'doLottery':
      return await doLottery(uid, data);
    case 'getLotteryRecords':
      return await getLotteryRecords(uid);
    case 'exchangePrize':
      return await exchangePrize(uid, data);
    case 'getSignInData':
      return await getSignInData(uid);
    default:
      return {
        code: 400,
        message: '未知操作'
      };
  }
};

// 获取用户积分
async function getUserScore(uid) {
  try {
    // 从积分变动表中获取最新的积分余额
    const scoreRes = await db.collection('uni-id-scores')
      .where({ user_id: uid })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get();
    
    let currentScore = 0;
    let totalEarned = 0;
    let totalSpent = 0;
    
    if (scoreRes.data.length > 0) {
      // 获取最新余额
      currentScore = scoreRes.data[0].balance || 0;
      
      // 计算总收入和支出
      const allScores = await db.collection('uni-id-scores')
        .where({ user_id: uid })
        .get();
      
      allScores.data.forEach(item => {
        if (item.score > 0) {
          totalEarned += item.score;
        } else {
          totalSpent += Math.abs(item.score);
        }
      });
    }
    
    return {
      code: 200,
      data: {
        score: currentScore,
        totalEarned,
        totalSpent
      }
    };
  } catch (error) {
    return {
      code: 500,
      message: '获取积分失败',
      error: error.message
    };
  }
}

// 获取积分历史
async function getScoreHistory(uid, { page = 1, pageSize = 20, type = 'all' } = {}) {
  try {
    // 验证用户ID
    if (!uid) {
      console.error('❌ 用户ID为空，无法查询数据')
      return {
        code: 400,
        message: '用户ID不能为空'
      }
    }
    
    // 先验证用户ID是否存在于数据库中
    const userCheck = await db.collection('uni-id-scores')
      .where({ user_id: uid })
      .limit(1)
      .get()
    
    // 构建查询条件
    let query = db.collection('uni-id-scores').where({
      user_id: uid
    });
    
    // 根据类型筛选
    if (type === 'get') {
      // 收入类型：1(收入) 和 4(任务返还收入)
      query = query.where({ type: dbCmd.in([1, 4]) });
    } else if (type === 'cost') {
      // 支出类型：2(支出) 和 3(任务担保支出)
      query = query.where({ type: dbCmd.in([2, 3]) });
    }
    
    // 先获取总数
    const totalRes = await query.count();
    const total = totalRes.total;
    
    // 获取分页数据
    const listRes = await query
      .orderBy('create_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 验证返回数据的用户ID
    const invalidUserIds = listRes.data.filter(item => item.user_id !== uid)
    if (invalidUserIds.length > 0) {
      console.error('❌ 发现不属于当前用户的数据:', {
        count: invalidUserIds.length,
        invalidIds: invalidUserIds.map(item => ({
          _id: item._id,
          user_id: item.user_id,
          expected_uid: uid,
          type: item.type,
          comment: item.comment
        }))
      })
      
      // 强制过滤掉不属于当前用户的数据
      const filteredData = listRes.data.filter(item => item.user_id === uid)
      
      // 使用过滤后的数据继续处理
      listRes.data = filteredData
    }
    
    // 处理数据，确保score字段正确显示正负
    const processedList = listRes.data.map(item => {
      let processedItem = { ...item };
      
      // 根据type字段确定score的正负
      if (item.type === 1 || item.type === 4) {
        // 收入类型，确保score为正数
        processedItem.score = Math.abs(item.score);
        processedItem.scoreDisplay = `+${Math.abs(item.score)}`;
      } else if (item.type === 2 || item.type === 3) {
        // 支出类型，确保score为负数
        processedItem.score = -Math.abs(item.score);
        processedItem.scoreDisplay = `-${Math.abs(item.score)}`;
      }
      
      // 添加类型描述
      switch (item.type) {
        case 1:
          processedItem.typeDesc = '收入';
          break;
        case 2:
          processedItem.typeDesc = '支出';
          break;
        case 3:
          processedItem.typeDesc = '任务担保支出';
          break;
        case 4:
          processedItem.typeDesc = '任务返还收入';
          break;
        default:
          processedItem.typeDesc = '未知';
      }
      
      return processedItem;
    });
    
    return {
      code: 200,
      data: {
        list: processedList,
        total,
        page,
        pageSize
      }
    };
  } catch (error) {
    console.error('getScoreHistory 执行失败:', error)
    return {
      code: 500,
      message: '获取积分历史失败',
      error: error.message
    };
  }
}

// 执行抽奖
async function doLottery(uid, { costScore = 10 } = {}) {
  try {
    // 检查用户积分是否足够 - 从积分变动表获取最新余额
    const scoreRes = await db.collection('uni-id-scores')
      .where({ user_id: uid })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get();
    
    let currentBalance = 0;
    if (scoreRes.data.length > 0) {
      currentBalance = scoreRes.data[0].balance || 0;
    }
    
    if (currentBalance < costScore) {
      return {
        code: 400,
        message: '积分不足'
      };
    }
    
    // 生成奖品
    const prize = generatePrize();
    
    // 记录积分变动 - 扣除积分
    const newBalance = currentBalance - costScore;
    await db.collection('uni-id-scores').add({
      user_id: uid,
      score: -costScore,
      type: 2,
      balance: newBalance,
      comment: '积分抽奖消费',
      create_date: new Date()
    });
    
    // 记录抽奖记录
    const lotteryRecord = {
      user_id: uid,
      prize_name: prize.name,
      prize_type: prize.type,
      prize_value: prize.value,
      is_winner: prize.isWinner,
      is_exchanged: false,
      cost_score: costScore,
      lottery_time: new Date(),
      comment: prize.comment
    };
    
    const lotteryRes = await db.collection('kl-lottery-records').add(lotteryRecord);
    
    // 如果中奖且是积分奖励，直接加到用户账户
    if (prize.isWinner && prize.type === 1) {
      const finalBalance = newBalance + prize.value;
      await db.collection('uni-id-scores').add({
        user_id: uid,
        score: prize.value,
        type: 1,
        balance: finalBalance,
        comment: `抽奖获得${prize.name}`,
        create_date: new Date()
      });
    }
    
    return {
      code: 200,
      data: {
        prize,
        recordId: lotteryRes.id
      }
    };
  } catch (error) {
    console.error('抽奖失败:', error);
    return {
      code: 500,
      message: '抽奖失败',
      error: error.message
    };
  }
}

// 生成奖品
function generatePrize() {
  const prizes = [
    { name: '积分+200', type: 1, value: 200, isWinner: true, comment: '恭喜获得积分奖励' },
    { name: '便民水卡', type: 2, value: 1, isWinner: true, comment: '恭喜获得实物奖品' },
    { name: '积分+50', type: 1, value: 50, isWinner: true, comment: '恭喜获得积分奖励' },
    { name: '卡通手办', type: 2, value: 2, isWinner: true, comment: '恭喜获得实物奖品' },
    { name: '谢谢参与', type: 3, value: 0, isWinner: false, comment: '很遗憾，下次再来' },
    { name: '毛绒玩具', type: 2, value: 3, isWinner: true, comment: '恭喜获得实物奖品' },
    { name: '加油卡', type: 2, value: 4, isWinner: true, comment: '恭喜获得实物奖品' },
    { name: '谢谢参与', type: 3, value: 0, isWinner: false, comment: '很遗憾，下次再来' }
  ];
  
  // 中奖概率：30%
  const isWinner = Math.random() < 0.3;
  
  if (isWinner) {
    const winningPrizes = prizes.filter(p => p.isWinner);
    return winningPrizes[Math.floor(Math.random() * winningPrizes.length)];
  } else {
    const losingPrizes = prizes.filter(p => !p.isWinner);
    return losingPrizes[Math.floor(Math.random() * losingPrizes.length)];
  }
}

// 获取抽奖记录
async function getLotteryRecords(uid) {
  try {
    const res = await db.collection('kl-lottery-records')
      .where({ user_id: uid })
      .orderBy('lottery_time', 'desc')
      .limit(50)
      .get();
    
    return {
      code: 200,
      data: res.data
    };
  } catch (error) {
    return {
      code: 500,
      message: '获取抽奖记录失败',
      error: error.message
    };
  }
}

// 兑换奖品
async function exchangePrize(uid, { recordId } = {}) {
  try {
    const res = await db.collection('kl-lottery-records')
      .where({
        _id: recordId,
        user_id: uid,
        is_winner: true,
        is_exchanged: false
      })
      .update({
        is_exchanged: true,
        exchange_time: new Date()
      });
    
    if (res.updated === 0) {
      return {
        code: 400,
        message: '奖品不存在或已兑换'
      };
    }
    
    return {
      code: 200,
      message: '兑换成功'
    };
  } catch (error) {
    return {
      code: 500,
      message: '兑换失败',
      error: error.message
    };
  }
}

// 获取签到数据
async function getSignInData(uid) {
  try {
    // 获取当前北京时间（UTC+8）的当天凌晨时间戳
    const now = new Date()
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 转换为北京时间
    const year = beijingTime.getUTCFullYear()
    const month = beijingTime.getUTCMonth()
    const day = beijingTime.getUTCDate()
    
    // 创建当天凌晨的UTC时间戳
    const todayStart = new Date(Date.UTC(year, month, day))
    const todayTimestamp = todayStart.getTime()
    
    // 查最近7天的签到情况（与uni-sign-in组件逻辑完全一致）
    const { data: signInData } = await db.collection('opendb-sign-in')
      .where({
        user_id: uid,
        date: dbCmd.gte(todayTimestamp - 3600 * 24 * 6 * 1000),
        isDelete: false
      })
      .get()
    
    // 按日期排序，确保时间顺序正确
    signInData.sort((a, b) => a.date - b.date)
    
    let signInResult = {
      days: [],
      n: 0,
      score: 0
    }
    
    if (signInData && signInData.length > 0) {
      // 今天是本轮签到的第几天（与uni-sign-in组件逻辑完全一致）
      const n = signInData.length + 1
      
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
      
      signInResult = {
        days: days,
        n: n,
        score: 0
      }
    }
    
    // 获取用户当前积分
    const scoreRes = await db.collection('uni-id-scores')
      .where({ user_id: uid })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get()
    
    if (scoreRes.data && scoreRes.data.length > 0) {
      signInResult.score = scoreRes.data[0].balance || 0
    }
    
    return {
      code: 200,
      data: signInResult
    }
  } catch (error) {
    console.error('getSignInData 执行失败:', error)
    return {
      code: 500,
      message: '获取签到数据失败',
      error: error.message
    }
  }
} 