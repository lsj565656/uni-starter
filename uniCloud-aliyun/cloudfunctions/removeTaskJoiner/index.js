'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { taskId, joinerId, userId } = event;
  if (!taskId || !joinerId || !userId) {
    return { code: 1, message: '参数不完整' };
  }

  const transaction = await db.startTransaction();
  try {
    // 1. 验证任务和权限
    const taskRes = await db.collection('kl-tasks').doc(taskId).get();
    if (!taskRes.data || !taskRes.data[0]) {
      return { code: 2, message: '任务不存在' };
    }
    const task = taskRes.data[0];
    
    // 验证是否为发布者
    if (task.user_id !== userId) {
      return { code: 3, message: '无权限操作' };
    }
    
    // 验证任务状态
    if (task.status !== 'not_started') {
      return { code: 4, message: '任务已开始，无法剔除参与者' };
    }
    
    // 2. 查找参与者记录
    const joinRes = await db.collection('kl-users-join-task')
      .where({ 
        task_id: taskId, 
        user_id: joinerId,
        isActive: true 
      })
      .get();
    
    if (!joinRes.data || joinRes.data.length === 0) {
      return { code: 5, message: '参与者记录不存在' };
    }
    
    const joinRecord = joinRes.data[0];
    
    // 验证是否为发布者
    if (joinRecord.is_publisher) {
      return { code: 6, message: '无法剔除发布者' };
    }
    
    // 3. 软删除参与者记录
    await transaction.collection('kl-users-join-task')
      .doc(joinRecord._id)
      .update({
        isActive: false,
        status: 'removed',
        remove_time: Date.now()
      });
    
    // 4. 更新任务参与人数
    await transaction.collection('kl-tasks')
      .doc(taskId)
      .update({
        joined_count: db.command.inc(-1)
      });
    
    // 5. 返还担保积分/金额
    if (task.mode === 'score' && joinRecord.guarantee_score > 0) {
      // 查当前积分余额
      const scoreRes = await db.collection('uni-id-scores')
        .where({ user_id: joinerId })
        .orderBy('create_date', 'desc')
        .limit(1)
        .get();
      const oldScore = scoreRes.data[0]?.balance || 0;
      
      await transaction.collection('uni-id-scores').add({
        user_id: joinerId,
        score: joinRecord.guarantee_score,
        type: 4, // 4=任务担保返还
        balance: oldScore + joinRecord.guarantee_score,
        comment: '被剔除任务返还担保积分',
        task_id: taskId,
        create_date: Date.now()
      });
    } else if (task.mode === 'price' && joinRecord.guarantee_amount > 0) {
      // 查当前余额
      const balRes = await db.collection('kl-id-balance')
        .where({ user_id: joinerId })
        .orderBy('create_date', 'desc')
        .limit(1)
        .get();
      const oldBal = balRes.data[0]?.balance || 0;
      
      await transaction.collection('kl-id-balance').add({
        user_id: joinerId,
        type: 4, // 4=任务担保返还
        amount: joinRecord.guarantee_amount,
        balance: oldBal + joinRecord.guarantee_amount,
        task_id: taskId,
        comment: '被剔除任务返还担保金额',
        create_date: Date.now()
      });
    }
    
    await transaction.commit();
    
    return { 
      code: 0, 
      message: '剔除成功' 
    };
  } catch (error) {
    await transaction.rollback();
    return { code: 7, message: '剔除失败', error: error.message };
  }
}; 