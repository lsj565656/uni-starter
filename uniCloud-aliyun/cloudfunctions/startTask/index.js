'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  const { taskId, userId } = event;
  if (!taskId || !userId) return { code: 1, message: '参数不完整' };
  // 校验是否为发布者
  const taskRes = await db.collection('kl-tasks').doc(taskId).get();
  if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
  const task = taskRes.data[0];
  if (String(task.user_id) !== String(userId)) return { code: 3, message: '无权限操作' };
  // 1. 获取所有有效参与关系
  const joinsRes = await db.collection('kl-users-join-task').where({ task_id: taskId, isActive: true }).get();
  const joins = joinsRes.data || [];
  // 2. 过滤掉发布者自己
  const members = joins.filter(j => !j.is_publisher);
  if (members.length === 0) return { code: 4, message: '未有人加入' };
  // 3. 检查 ready 数量
  const readyMembers = members.filter(j => j.status === 'ready');
  if (readyMembers.length === 0) return { code: 5, message: '参与者未就绪' };
  // 4. 检查时间
  const now = Date.now();
  if (task.start_time - now > 30 * 60 * 1000) return { code: 6, message: '开始前半小时不可提前开始任务' };
  // 5. 计算所需积分（不包含发布者自己）
  const N = readyMembers.filter(j => !j.is_publisher).length;
  const totalScore = N * (task.score || 0);
  // 6. 检查发布者积分
  const scoreRes = await db.collection('uni-id-scores')
    .where({ user_id: userId })
    .orderBy('create_date', 'desc')
    .limit(1)
    .get();
  const oldScore = scoreRes.data[0]?.balance || 0;
  if (oldScore < totalScore) return { code: 8, message: '积分不足，无法开始任务' };
  // 7. 扣除积分
  await db.collection('uni-id-scores').add({
    user_id: userId,
    score: Math.abs(totalScore),
    type: 4, // 4=任务发起支出
    balance: oldScore - totalScore,
    comment: `任务开始，扣除${N}人*${task.score}积分`,
    task_id: taskId,
    create_date: now
  });
  // 8. 批量将所有ready状态的参与者流转为joined
  await db.collection('kl-users-join-task').where({ task_id: taskId, status: 'ready', isActive: true }).update({ status: 'joined' });
  // 9. 主表status设为in_progress
  await db.collection('kl-tasks').doc(taskId).update({ status: 'in_progress' });
  return { code: 0, message: '任务已开始' };
}; 