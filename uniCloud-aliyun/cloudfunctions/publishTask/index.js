'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { task, autoJoin, userId } = event;
  if (!task || !userId) {
    return { code: 1, message: '参数不完整' };
  }

  const transaction = await db.startTransaction();
  try {
    // 1. 创建任务
    const taskData = {
      ...task,
      user_id: userId,
      create_date: Date.now(),
      joined_count: autoJoin ? 1 : 0,
      status: 'not_started'
    };
    const addRes = await transaction.collection('kl-tasks').add(taskData);
    const taskId = addRes.id || (addRes.insertedId && addRes.insertedId[0]);
    if (!taskId) throw new Error('任务创建失败');

    // 2. 自动加入
    if (autoJoin) {
      await transaction.collection('kl-users-join-task').add({
        user_id: userId,
        task_id: taskId,
        join_time: Date.now(),
        status: 'preJoin',
        role: 'publisher',
        guarantee_score: 0,
        settle_score: 0,
        guarantee_amount: 0.00,
        settle_amount: 0.00,
        // 可加更多字段
      });
    }

    await transaction.commit();
    
    // 返回更新后的计数
    const publishedCount = await db.collection('kl-tasks')
      .where({
        user_id: userId,
        isActive: true
      })
      .count();
    
    return { 
      code: 0, 
      message: '发布成功', 
      taskId,
      publishedCount: publishedCount.total || 0
    };
  } catch (e) {
    await transaction.rollback();
    return { code: 2, message: '发布失败', error: e.message };
  }
}; 