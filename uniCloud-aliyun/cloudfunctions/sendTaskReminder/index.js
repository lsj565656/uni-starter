'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { taskId, joinerId, userId } = event;
  if (!taskId || !joinerId || !userId) {
    return { code: 1, message: '参数不完整' };
  }

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
      return { code: 4, message: '任务已开始，无法发送提醒' };
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
      return { code: 6, message: '无法提醒发布者' };
    }
    
    // 3. 记录提醒历史（可选，用于统计）
    await db.collection('kl-task-reminders').add({
      task_id: taskId,
      from_user_id: userId,
      to_user_id: joinerId,
      task_name: task.name,
      reminder_type: 'ready_reminder',
      create_time: Date.now()
    });
    
    // 4. 这里可以集成推送服务
    // TODO: 集成uni-push或其他推送服务
    // 目前先返回成功，后续可以扩展推送功能
    
    return { 
      code: 0, 
      message: '提醒发送成功' 
    };
  } catch (error) {
    return { code: 7, message: '提醒发送失败', error: error.message };
  }
}; 