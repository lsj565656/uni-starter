'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { task_id, user_id, rate, rate_comment } = event;
  if (!task_id || !user_id || typeof rate !== 'number') {
    return { code: 1, message: '参数不完整' };
  }
  try {
    // 查找参与关系
    const joinRes = await db.collection('kl-users-join-task').where({ task_id, user_id }).get();
    if (!joinRes.data || !joinRes.data[0]) {
      return { code: 2, message: '未找到参与关系' };
    }
    const join = joinRes.data[0];
    if (typeof join.rate === 'number') {
      return { code: 3, message: '已评价过' };
    }
    await db.collection('kl-users-join-task').doc(join._id).update({
      rate,
      rate_comment: rate_comment || '',
      rate_time: Date.now(),
      status: 'evaluated'
    });
    return { code: 0, message: '评价成功' };
  } catch (e) {
    return { code: 500, message: '评价失败', error: e.message };
  }
}; 