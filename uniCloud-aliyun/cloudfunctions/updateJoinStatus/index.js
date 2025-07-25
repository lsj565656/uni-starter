'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  const { taskId, userId, status } = event;
  if (!taskId || !userId || !status) return { code: 1, message: '参数不完整' };
  // 查主表状态
  const taskRes = await db.collection('kl-tasks').doc(taskId).get();
  if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
  const task = taskRes.data[0];
  if (task.status === 'in_progress' || task.status === 'invalid') {
    // 任务已开始或失效
    await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId }).update({ status: 'invalid', isActive: false });
    return { code: 3, message: '发布者已开始任务，无法再就绪/取消' };
  }
  // 只允许 preJoin <-> ready
  const joinRes = await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId, isActive: true }).get();
  if (!joinRes.data || !joinRes.data[0]) return { code: 4, message: '未找到参与关系' };
  const join = joinRes.data[0];
  if (status === 'ready' && join.status === 'preJoin') {
    await db.collection('kl-users-join-task').doc(join._id).update({ status: 'ready' });
    return { code: 0, message: '已就绪' };
  } else if (status === 'preJoin' && join.status === 'ready') {
    await db.collection('kl-users-join-task').doc(join._id).update({ status: 'preJoin' });
    return { code: 0, message: '已取消就绪' };
  } else {
    return { code: 5, message: '状态流转不合法' };
  }
}; 