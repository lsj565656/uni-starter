'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  const { id } = event;
  if (!id) return { code: 400, msg: '缺少参数' };
  // 查任务详情
  const taskRes = await db.collection('kl-tasks').doc(id).get();
  if (!taskRes.data || !taskRes.data[0]) return { code: 404, msg: '未找到任务' };
  const task = taskRes.data[0];
  // 查用户信息
  let user = {};
  if (task.user_id) {
    // 参考 joinTask 云函数，直接用 doc(id).get()，避免 projection 报错
    const userRes = await db.collection('uni-id-users').doc(task.user_id).get();
    if (userRes.data && userRes.data[0]) user = userRes.data[0];
  }
  return { code: 0, data: { ...task, user } };
};