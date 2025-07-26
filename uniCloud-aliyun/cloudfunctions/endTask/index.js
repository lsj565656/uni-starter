'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { taskId, userId } = event;
  if (!taskId || !userId) return { code: 1, message: '参数不完整' };
  
  try {
    // 检查任务是否存在且状态为进行中
    const taskRes = await db.collection('kl-tasks').doc(taskId).get();
    if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
    const task = taskRes.data[0];
    
    if (task.status !== 'in_progress') return { code: 3, message: '任务状态不正确' };
    
    // 检查是否为发布者
    if (String(task.user_id) !== String(userId)) return { code: 4, message: '无权限操作' };
    
    // 检查所有参与者是否都已完成
    const joinsRes = await db.collection('kl-users-join-task')
      .where({ task_id: taskId, isActive: true })
      .get();
    
    const members = joinsRes.data;
    // 优化判断逻辑：同时检查 is_publisher 字段和 role 字段
    // 只有 is_publisher === true 且 role === 'publisher' 才判断为发布者
    const nonPublisherMembers = members.filter(j => !(j.is_publisher === true && j.role === 'publisher'));
    // 如果只有发布者自己参与，直接允许结束
    if (nonPublisherMembers.length === 0) {
      // 检查发布者自己的状态
      const publisherJoin = members.find(j => j.is_publisher === true && j.role === 'publisher');
      if (!publisherJoin) {
        return { code: 8, message: '未找到发布者参与记录' };
      }
      
      // 更新发布者自己的状态为已完成
      await db.collection('kl-users-join-task').doc(publisherJoin._id).update({
        status: 'finished',
        finish_time: Date.now()
      });
      
      // 更新任务状态为已完成
      await db.collection('kl-tasks').doc(taskId).update({
        status: 'finished',
        end_time: Date.now()
      });
      
      // 返回更新后的积分余额（发布者的积分）
      const newScoreRes = await db.collection('uni-id-scores')
        .where({ user_id: userId })
        .orderBy('create_date', 'desc')
        .limit(1)
        .get();
      const newScore = newScoreRes.data[0]?.balance || 0;
      
      return { 
        code: 0, 
        message: '任务完成成功',
        score: newScore,
        taskStatus: 'finished'
      };
    }
    
    // 有其他参与者时，检查是否都已完成
    const unfinishedMembers = nonPublisherMembers.filter(j => j.status !== 'finished');
    if (unfinishedMembers.length > 0) {
      return { code: 6, message: '还有参与者未完成任务' };
    }
    
    // 更新所有参与者的状态为已完成
    await db.collection('kl-users-join-task')
      .where({ task_id: taskId, isActive: true })
      .update({
        status: 'finished',
        finish_time: Date.now()
      });
    
    // 更新任务状态为已完成
    await db.collection('kl-tasks').doc(taskId).update({
      status: 'finished',
      end_time: Date.now()
    });
    
    // 计算并发放奖励（不包含发布者自己）
    const totalReward = nonPublisherMembers.length * (task.score || 0);
    if (totalReward > 0) {
      // 给每个参与者发放积分奖励
      for (const member of nonPublisherMembers) {
        const memberScoreRes = await db.collection('uni-id-scores')
          .where({ user_id: member.user_id })
          .orderBy('create_date', 'desc')
          .limit(1)
          .get();
        
        const oldScore = memberScoreRes.data[0]?.balance || 0;
        await db.collection('uni-id-scores').add({
          user_id: member.user_id,
          score: task.score,
          type: 5, // 5=任务完成奖励
          balance: oldScore + task.score,
          comment: '任务完成奖励',
          task_id: taskId,
          create_date: Date.now()
        });
      }
    }
    
    // 返回更新后的积分余额（发布者的积分）
    const newScoreRes = await db.collection('uni-id-scores')
      .where({ user_id: userId })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get();
    const newScore = newScoreRes.data[0]?.balance || 0;
    
    return { 
      code: 0, 
      message: '任务结束成功',
      score: newScore,
      taskStatus: 'finished'
    };
  } catch (error) {
    return { code: 7, message: '操作失败', error: error.message };
  }
}; 