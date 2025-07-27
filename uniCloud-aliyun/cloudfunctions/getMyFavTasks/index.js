'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const {
    userId,
    keyword = '',
    orderBy = 'create_date',
    order = 'desc',
    page = 1,
    pageSize = 20
  } = event;

  if (!userId) {
    return { code: 1, message: '您当前未登录！', data: [] };
  }

  // 兼容 ObjectId 和字符串
  let matchStage;
  try {
    let userObjectId = dbCmd.objectId(userId);
    matchStage = {
      $or: [
        { user_id: userObjectId },
        { user_id: userId }
      ]
    };
  } catch (e) {
    matchStage = { user_id: userId };
  }

  const pageNum = Number(page) || 1;
  const size = Number(pageSize) || 20;
  let list = [];
  try {
    let agg = db.collection('kl-tasks-likes').aggregate()
      .match(matchStage)
      .lookup({
        from: 'kl-tasks',
        localField: 'task_id',
        foreignField: '_id',
        as: 'task'
      })
      .unwind('$task')
      // 关联任务发布者信息
      .lookup({
        from: 'uni-id-users',
        localField: 'task.user_id',
        foreignField: '_id',
        as: 'task_user'
      })
      .addFields({
        'task.user': { $arrayElemAt: ['$task_user', 0] }
      });
    // 关键词筛选
    if (keyword) {
      agg = agg.match({
        $or: [
          { 'task.name': new RegExp(keyword, 'i') },
          { 'task.description': new RegExp(keyword, 'i') }
        ]
      });
    }
    // 排序
    let sortObj = {};
    if (orderBy === 'value') {
      // 价值优先：先按 price 降序，再按 score 降序
      sortObj['task.price'] = -1;
      sortObj['task.score'] = -1;
    } else {
      sortObj[`task.${orderBy}`] = order === 'asc' ? 1 : -1;
    }
    agg = agg.sort(sortObj);
    // 分页
    agg = agg.skip((pageNum - 1) * size).limit(size);
    const res = await agg.end();
    list = (res.data || []).map(item => ({
      ...item.task,
      is_liked: true,
      like_count: item.task.like_count || 0,
      // 确保用户信息存在
      user: item.task.user || {}
    }));
    // 查询总数
    const totalRes = await db.collection('kl-tasks-likes').where(matchStage).count();
    const total = totalRes.total || 0;
    const hasMore = pageNum * size < total;
    return {
      code: 0,
      message: 'ok',
      data: list,
      hasMore,
      page: pageNum,
      pageSize: size,
      total
    };
  } catch (e) {
    console.log('[getMyFavTasks] aggregate error:', e.message);
    return { code: 500, message: e.message, data: [] };
  }
};