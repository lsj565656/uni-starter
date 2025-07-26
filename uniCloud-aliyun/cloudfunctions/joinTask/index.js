// 云函数入口文件
const db = uniCloud.database()
exports.main = async (event, context) => {
  const args = event.args || event
  const { taskId, isPublisher, userId } = args
  // let userId = context.auth && context.auth.uid
  if (!taskId || !userId) return { code: 1, msg: '参数缺失' }
  // 查任务
  const taskRes = await db.collection('kl-tasks').doc(taskId).get()
  const task = taskRes.data[0]
  if (!task) return { code: 2, msg: '任务不存在' }
  // 查用户
  const userRes = await db.collection('uni-id-users').doc(userId).get()
  const user = userRes.data[0]
  if (!user) return { code: 3, msg: '用户不存在' }
  // 是否已加入（只查 isActive: true）
  const active = await db.collection('kl-users-join-task')
    .where({ task_id: taskId, user_id: userId, isActive: true }).count()
  if (active.total > 0) return { code: 4, msg: '已加入' }
  // 查软删除（isActive: false）
  const soft = await db.collection('kl-users-join-task')
    .where({ task_id: taskId, user_id: userId, isActive: false }).get()
  if (soft.data && soft.data.length > 0) {
    // update 恢复
    await db.collection('kl-users-join-task').doc(soft.data[0]._id).update({
      isActive: true,
      status: 'preJoin',
      join_time: Date.now(),
      // 其它字段可按需重置
    })
    // 计算担保
    let guarantee = 0
    if (task.mode === 'score') guarantee = Math.ceil(task.score * 0.5)
    if (task.mode === 'price') guarantee = Number((task.price * 0.5).toFixed(2))
    if (task.mode === 'score') {
      // 查积分
      const scoreRes = await db.collection('uni-id-scores')
        .where({ user_id: userId })
        .orderBy('create_date', 'desc')
        .limit(1)
        .get()
      const oldScore = scoreRes.data[0]?.balance || 0
      if (oldScore < guarantee) return { code: 5, msg: '积分不足' }
      await db.collection('uni-id-scores').add({
        user_id: userId,
        score: Math.abs(guarantee), // 只存正数
        type: 3, // 3=任务担保支出
        balance: oldScore - guarantee,
        comment: '加入任务担保积分',
        task_id: taskId,
        create_date: Date.now()
      })
    } else if (task.mode === 'price') {
      // 查余额
      const balRes = await db.collection('kl-id-balance')
        .where({ user_id: userId })
        .orderBy('create_date', 'desc')
        .limit(1)
        .get()
      const oldBal = balRes.data[0]?.balance || 0
      if (oldBal < guarantee) return { code: 6, msg: '余额不足' }
      await db.collection('kl-id-balance').add({
        user_id: userId,
        type: 3, // 3=任务担保支出
        amount: Math.abs(guarantee), // 只存正数
        balance: oldBal - guarantee,
        task_id: taskId,
        comment: '加入任务担保金额',
        create_date: Date.now()
      })
    }
    // 更新任务参与人数
    await db.collection('kl-tasks').doc(taskId).update({
      joined_count: db.command.inc(1)
    })
    return { code: 0, msg: '重新加入成功' }
  }
  // 发布者加入
  if (isPublisher) {
    await db.collection('kl-tasks').doc(taskId).update({
      is_publisher_joined: true,
      joined_count: db.command.inc(1)
    })
    await db.collection('kl-users-join-task').add({
      task_id: taskId,
      user_id: userId,
      is_publisher: true,
      status: 'joined',
      join_time: Date.now(),
      role: 'publisher',
      guarantee_score: 0,
      settle_score: 0,
      guarantee_amount: 0,
      settle_amount: 0,
      isActive: true
    })
    return { code: 0, msg: '发布者加入成功' }
  }
  // 普通用户加入
  await db.collection('kl-tasks').doc(taskId).update({
    joined_count: db.command.inc(1)
  })
  // 计算担保
  let guarantee = 0
  if (task.mode === 'score') guarantee = Math.ceil(task.score * 0.5)
  if (task.mode === 'price') guarantee = Number((task.price * 0.5).toFixed(2))
  await db.collection('kl-users-join-task').add({
    task_id: taskId,
    user_id: userId,
    is_publisher: false,
    status: 'preJoin',
    join_time: Date.now(),
    role: 'member',
    guarantee_score: guarantee,
    settle_score: 0,
    guarantee_amount: 0,
    settle_amount: 0,
    isActive: true
  })
  if (task.mode === 'score') {
    // 查积分
    const scoreRes = await db.collection('uni-id-scores')
      .where({ user_id: userId })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get()
    const oldScore = scoreRes.data[0]?.balance || 0
    if (oldScore < guarantee) return { code: 5, msg: '积分不足' }
    await db.collection('uni-id-scores').add({
      user_id: userId,
      score: Math.abs(guarantee), // 只存正数
      type: 3, // 3=任务担保支出
      balance: oldScore - guarantee,
      comment: '加入任务担保积分',
      task_id: taskId,
      create_date: Date.now()
    })
  } else if (task.mode === 'price') {
    // 查余额
    const balRes = await db.collection('kl-id-balance')
      .where({ user_id: userId })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get()
    const oldBal = balRes.data[0]?.balance || 0
    if (oldBal < guarantee) return { code: 6, msg: '余额不足' }
    await db.collection('kl-id-balance').add({
      user_id: userId,
      type: 3, // 3=任务担保支出
      amount: Math.abs(guarantee), // 只存正数
      balance: oldBal - guarantee,
      task_id: taskId,
      comment: '加入任务担保金额',
      create_date: Date.now()
    })
  }
  
  // 返回更新后的参与任务计数
  const joinedCount = await db.collection('kl-users-join-task')
    .where({
      user_id: userId,
      isActive: true
    })
    .count();
  
  return { 
    code: 0, 
    msg: '加入成功',
    joinedCount: joinedCount.total || 0
  }
} 