'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { userId } = event;
  if (!userId) {
    return { code: 1, message: '用户ID不能为空' };
  }

  try {
    // 统计发布的任务数量（未软删除的）
    const publishedCount = await db.collection('kl-tasks')
      .where({
        user_id: userId,
        isActive: true
      })
      .count();

    // 统计参与的任务数量（未软删除的）
    const joinedCount = await db.collection('kl-users-join-task')
      .where({
        user_id: userId,
        isActive: true
      })
      .count();

    return {
      code: 0,
      message: '统计成功',
      data: {
        publishedCount: publishedCount.total || 0,
        joinedCount: joinedCount.total || 0
      }
    };
  } catch (error) {
    return {
      code: 2,
      message: '统计失败',
      error: error.message
    };
  }
}; 