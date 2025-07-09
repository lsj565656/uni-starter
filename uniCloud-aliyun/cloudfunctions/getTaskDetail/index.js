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
    // 你的 user_id 字段是 objectId，不是数组
    const userRes = await db.collection('uni-id-users')
    .where({ _id: task.user_id })
    .field('nickname,avatar_file')
    .get();
    if (userRes.data && userRes.data[0]) user = userRes.data[0];
  }
  return { code: 0, data: { ...task, user } };
};