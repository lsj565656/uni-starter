'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  const { taskId, userId, status } = event;
  if (!taskId || !userId || !status) return { code: 1, message: '参数不完整' };
  
  // 查主表状态
  const taskRes = await db.collection('kl-tasks').doc(taskId).get();
  if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
  const task = taskRes.data[0];
  
  // 查参与关系
  const joinRes = await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId, isActive: true }).get();
  if (!joinRes.data || !joinRes.data[0]) return { code: 4, message: '未找到参与关系' };
  const join = joinRes.data[0];
  
  console.log('updateJoinStatus status', status, 'join.status', join.status, 'task.status', task.status);
  
  // 状态流转逻辑
  if (status === 'ready' && join.status === 'preJoin') {
    // 就绪状态：preJoin -> ready
    if (task.status === 'in_progress' || task.status === 'invalid') {
      return { code: 3, message: '发布者已开始任务，无法再就绪/取消' };
    }
    await db.collection('kl-users-join-task').doc(join._id).update({ status: 'ready' });
    return { code: 0, message: '已就绪' };
  } else if (status === 'preJoin' && join.status === 'ready') {
    // 取消就绪：ready -> preJoin
    if (task.status === 'in_progress' || task.status === 'invalid') {
      return { code: 3, message: '发布者已开始任务，无法再就绪/取消' };
    }
    await db.collection('kl-users-join-task').doc(join._id).update({ status: 'preJoin' });
    return { code: 0, message: '已取消就绪' };
  } else if (status === 'finished' && join.status === 'in_progress') {
    // 标记完成：in_progress -> finished
    if (task.status !== 'in_progress') {
      return { code: 6, message: '任务未在进行中，无法标记完成' };
    }
    await db.collection('kl-users-join-task').doc(join._id).update({ 
      status: 'finished',
      finish_time: Date.now()
    });
    return { code: 0, message: '已标记完成' };
  } else if (status === 'in_progress' && join.status === 'finished') {
    // 取消完成：finished -> in_progress
    if (task.status !== 'in_progress') {
      return { code: 6, message: '任务未在进行中，无法取消完成' };
    }
    await db.collection('kl-users-join-task').doc(join._id).update({ 
      status: 'in_progress',
      finish_time: null
    });
    return { code: 0, message: '已取消完成' };
  } else {
    return { code: 5, message: '状态流转不合法' };
  }
}; 