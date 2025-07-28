// getHotTasks 云函数，支持获取热门任务，包含用户信息关联查询
'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const {
    userId,
    keyword = '',
    orderBy = [{ field: 'create_date', order: 'desc' }],
    page = 1,
    pageSize = 20,
    limit = null // 用于首页限制数量
  } = event;

  const pageNum = Number(page) || 1;
  const size = limit ? Number(limit) : (Number(pageSize) || 20);

  let matchStage = { 
    isActive: true,
    isHot: true // 只获取热门任务
  };
  
  if (keyword) {
    matchStage.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  let agg = db.collection('kl-tasks').aggregate().match(matchStage);

  // 关联用户信息
  agg = agg.lookup({
    from: 'uni-id-users',
    localField: 'user_id',
    foreignField: '_id',
    as: 'user'
  });

  // 处理用户信息，取第一个用户
  agg = agg.addFields({
    user: { $arrayElemAt: ['$user', 0] }
  });

  // 多重排序
  if (Array.isArray(orderBy) && orderBy.length) {
    let sortObj = {};
    orderBy.forEach(sortItem => {
      if (sortItem && sortItem.field) {
        sortObj[sortItem.field] = sortItem.order === 'asc' ? 1 : -1;
      }
    });
    agg = agg.sort(sortObj);
  } else {
    agg = agg.sort({ create_date: -1 });
  }

  // 关联点赞表，查出当前用户是否点赞
  if (userId) {
    let userObjectId;
    try {
      userObjectId = dbCmd.objectId(userId);
    } catch (e) {
      userObjectId = userId;
    }
    agg = agg.lookup({
      from: 'kl-tasks-likes',
      let: { taskId: '$_id' },
      pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ['$task_id', '$$taskId'] },
          { $or: [ { $eq: ['$user_id', userObjectId] }, { $eq: ['$user_id', userId] } ] }
        ] } } }
      ],
      as: 'my_like'
    });
  }

  // 分页或限制数量
  if (limit) {
    agg = agg.limit(size);
  } else {
    agg = agg.skip((pageNum - 1) * size).limit(size);
  }

  try {
    const res = await agg.end();
    const list = (res.data || []).map(task => ({
      ...task,
      is_liked: Array.isArray(task.my_like) && task.my_like.length > 0,
      // 确保用户信息存在
      user: task.user || {}
    }));
    
    // 查询总数
    const totalRes = await db.collection('kl-tasks').where(matchStage).count();
    const total = totalRes.total || 0;
    const hasMore = limit ? false : (pageNum * size < total);
    
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
    console.log('[getHotTasks] aggregate error:', e.message);
    return { code: 500, message: e.message, data: [] };
  }
};