'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  const { taskId, userId, status } = event;
  if (!taskId || !userId || !status) return { code: 1, message: '参数不完整' };
  // 只允许 preJoin -> ready
  const joinRes = await db.collection('kl-users-join-task').where({ task_id: taskId, user_id: userId, status: 'preJoin', isActive: true }).get();
  if (!joinRes.data || !joinRes.data[0]) return { code: 2, message: '未找到可流转的参与关系' };
  await db.collection('kl-users-join-task').doc(joinRes.data[0]._id).update({ status: 'ready' });
  return { code: 0, message: '已就绪' };
}; 