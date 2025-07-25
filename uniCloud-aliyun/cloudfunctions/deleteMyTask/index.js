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
    if (task.status === 'not_started') {
      // 软删除主表，参与人数清零
      await db.collection('kl-tasks').doc(taskId).update({ isActive: false, joined_count: 0 });
      // 所有关系 isActive=false, status=removed
      await db.collection('kl-users-join-task').where({ task_id: taskId }).update({ isActive: false, status: 'removed' });
      return { code: 0, message: '任务已删除（未开始，发布者）' };
    } else if (task.status === 'finished' || task.status === 'invalid') {
      // 软删除主表
      await db.collection('kl-tasks').doc(taskId).update({ isActive: false });
      // 所有关系 isActive=false, status=removed
      await db.collection('kl-users-join-task').where({ task_id: taskId }).update({ isActive: false, status: 'removed' });
      return { code: 0, message: '任务已删除（已完成/已失效，发布者）' };
    } else {
      return { code: 3, message: '任务进行中不可删除' };
    }
  } else {
    if (task.status === 'not_started') {
      // 参与人数-1
      await db.collection('kl-tasks').doc(taskId).update({ joined_count: dbCmd.inc(-1) });
      // 自己关系 isActive=false, status=quit
      await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId }).update({ isActive: false, status: 'quit' });
      return { code: 0, message: '已退出任务（未开始，参与者）' };
    } else if (task.status === 'finished' || task.status === 'invalid') {
      // 自己关系 isActive=false, status=deleted
      await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId }).update({ isActive: false, status: 'deleted' });
      return { code: 0, message: '已移除任务（已完成/已失效，参与者）' };
    } else {
      return { code: 3, message: '任务进行中不可删除' };
    }
  }
}; 