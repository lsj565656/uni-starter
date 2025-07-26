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
    
    // 检查是否为参与者（非发布者）
    if (String(task.user_id) === String(userId)) return { code: 4, message: '发布者不能标记完成' };
    
    // 检查参与者关系是否存在
    const joinRes = await db.collection('kl-users-join-task')
      .where({ task_id: taskId, user_id: userId, isActive: true })
      .get();
    
    if (!joinRes.data || joinRes.data.length === 0) return { code: 5, message: '未找到参与关系' };
    
    const join = joinRes.data[0];
    if (join.status !== 'in_progress') return { code: 6, message: '参与者状态不正确' };
    
    // 更新参与者状态为已完成
    await db.collection('kl-users-join-task').doc(join._id).update({
      status: 'finished',
      finish_time: Date.now()
    });
    
    return { code: 0, message: '任务标记完成成功' };
  } catch (error) {
    return { code: 7, message: '操作失败', error: error.message };
  }
}; 