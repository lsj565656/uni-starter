'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
exports.main = async (event, context) => {
  const { taskId, userId } = event;
  if (!taskId || !userId) return { code: 1, message: '参数不完整' };
  // 查询任务
  const taskRes = await db.collection('kl-tasks').doc(taskId).get();
  if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
  const task = taskRes.data[0];
  const isPublisher = (task.user_id === userId || (task.user_id && task.user_id.toString() === userId));
  if (isPublisher) {
    // 查找自己参与关系
    const joinRes = await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId }).get();
    const join = joinRes.data && joinRes.data[0];
    if (task.status === 'not_started') {
      // 软删除主表，参与人数清零
      await db.collection('kl-tasks').doc(taskId).update({ isActive: false, joined_count: 0 });
      // 所有关系 isActive=false, status=removed
      await db.collection('kl-users-join-task').where({ task_id: taskId }).update({ isActive: false, status: 'removed' });
      
      // 返回更新后的计数
      const [publishedCount, joinedCount] = await Promise.all([
        db.collection('kl-tasks').where({ user_id: userId, isActive: true }).count(),
        db.collection('kl-users-join-task').where({ user_id: userId, isActive: true }).count()
      ]);
      
      return { 
        code: 0, 
        message: '任务已删除（未开始，发布者）',
        publishedCount: publishedCount.total || 0,
        joinedCount: joinedCount.total || 0
      };
    } else if (task.status === 'finished' || task.status === 'invalid' || (join && join.status === 'evaluated')) {
      // 软删除主表
      await db.collection('kl-tasks').doc(taskId).update({ isActive: false });
      // 所有关系 isActive=false, status=removed
      await db.collection('kl-users-join-task').where({ task_id: taskId }).update({ isActive: false, status: 'removed' });
      
      // 返回更新后的计数
      const [publishedCount, joinedCount] = await Promise.all([
        db.collection('kl-tasks').where({ user_id: userId, isActive: true }).count(),
        db.collection('kl-users-join-task').where({ user_id: userId, isActive: true }).count()
      ]);
      
      return { 
        code: 0, 
        message: '任务已删除（已完成/已失效/已评价，发布者）',
        publishedCount: publishedCount.total || 0,
        joinedCount: joinedCount.total || 0
      };
    } else {
      return { code: 3, message: '任务进行中不可删除' };
    }
  } else {
    // 查找自己参与关系
    const joinRes = await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId }).get();
    const join = joinRes.data && joinRes.data[0];
    if (!join) return { code: 4, message: '未找到参与关系' };
    if (task.status === 'not_started') {
      // 参与人数-1
      await db.collection('kl-tasks').doc(taskId).update({ joined_count: dbCmd.inc(-1) });
      await db.collection('kl-users-join-task').doc(join._id).update({ isActive: false, status: 'quit' });
      // 返还担保
      if (task.mode === 'score' && join.guarantee_score > 0) {
        // 查当前积分余额
        const scoreRes = await db.collection('uni-id-scores')
          .where({ user_id: userId })
          .orderBy('create_date', 'desc')
          .limit(1)
          .get();
        const oldScore = scoreRes.data[0]?.balance || 0;
        await db.collection('uni-id-scores').add({
          user_id: userId,
          score: join.guarantee_score,
          type: 4, // 4=任务担保返还
          balance: oldScore + join.guarantee_score,
          comment: '退出任务返还担保积分',
          task_id: taskId,
          create_date: Date.now()
        });
      } else if (task.mode === 'price' && join.guarantee_amount > 0) {
        // 查当前余额
        const balRes = await db.collection('kl-id-balance')
          .where({ user_id: userId })
          .orderBy('create_date', 'desc')
          .limit(1)
          .get();
        const oldBal = balRes.data[0]?.balance || 0;
        await db.collection('kl-id-balance').add({
          user_id: userId,
          type: 4, // 4=任务担保返还
          amount: join.guarantee_amount,
          balance: oldBal + join.guarantee_amount,
          task_id: taskId,
          comment: '退出任务返还担保金额',
          create_date: Date.now()
        });
      }
      
      // 返回更新后的计数
      const [publishedCount, joinedCount] = await Promise.all([
        db.collection('kl-tasks').where({ user_id: userId, isActive: true }).count(),
        db.collection('kl-users-join-task').where({ user_id: userId, isActive: true }).count()
      ]);
      
      return { 
        code: 0, 
        message: '已退出任务（未开始，参与者）',
        publishedCount: publishedCount.total || 0,
        joinedCount: joinedCount.total || 0
      };
    } else if (task.status === 'finished' || task.status === 'invalid' || join.status === 'evaluated') {
      // 允许个人已评价时软删除
      await db.collection('kl-users-join-task').doc(join._id).update({ isActive: false, status: 'deleted' });
      
      // 返回更新后的计数
      const [publishedCount, joinedCount] = await Promise.all([
        db.collection('kl-tasks').where({ user_id: userId, isActive: true }).count(),
        db.collection('kl-users-join-task').where({ user_id: userId, isActive: true }).count()
      ]);
      
      return { 
        code: 0, 
        message: '已移除任务（已完成/已失效/已评价，参与者）',
        publishedCount: publishedCount.total || 0,
        joinedCount: joinedCount.total || 0
      };
    } else {
      return { code: 3, message: '任务进行中不可删除' };
    }
  }
}; 