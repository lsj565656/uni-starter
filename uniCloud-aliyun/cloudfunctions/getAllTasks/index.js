// getAllTasks 云函数，支持分页、分类、搜索、筛选、排序、点赞状态
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
    pageSize = 20,
    category = '',
    mode = '', // 'score' 或 'price'
    minPrice = '',
    maxPrice = '',
    minScore = '',
    maxScore = '',
    // 其他筛选参数可扩展
  } = event;

  const pageNum = Number(page) || 1;
  const size = Number(pageSize) || 20;

  let matchStage = { isActive: true };
  if (category) matchStage.category = category;
  if (mode) matchStage.mode = mode;
  if (minPrice !== '' || maxPrice !== '') {
    matchStage.price = {};
    if (minPrice !== '') matchStage.price[dbCmd.gte] = Number(minPrice);
    if (maxPrice !== '') matchStage.price[dbCmd.lte] = Number(maxPrice);
  }
  if (minScore !== '' || maxScore !== '') {
    matchStage.score = {};
    if (minScore !== '') matchStage.score[dbCmd.gte] = Number(minScore);
    if (maxScore !== '') matchStage.score[dbCmd.lte] = Number(maxScore);
  }
  if (keyword) {
    matchStage.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }
  console.log('[getAllTasks] matchStage:', JSON.stringify(matchStage));

  let agg = db.collection('kl-tasks').aggregate().match(matchStage);

  // 多重排序
  if (Array.isArray(orderBy) && orderBy.length) {
    let sortObj = {};
    orderBy.forEach(sortItem => {
      if (sortItem && sortItem.field) {
        sortObj[sortItem.field] = sortItem.order === 'asc' ? 1 : -1;
      }
    });
    agg = agg.sort(sortObj);
  } else if (orderBy && typeof orderBy === 'string') {
    // 兼容旧版单字段排序
    let sortObj = {};
    sortObj[orderBy] = order === 'asc' ? 1 : -1;
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

  // 动态聚合成员列表
  agg = agg.lookup({
    from: 'kl-users-join-task',
    let: { taskId: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$task_id', '$$taskId'] } } },
      { $lookup: {
          from: 'uni-id-users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $project: {
          _id: '$user_id',
          avatar: '$userInfo.avatar_file.url',
          nickname: '$userInfo.nickname'
        }
      }
    ],
    as: 'members'
  });

  // 聚合用户信息
  agg = agg.lookup({
    from: 'uni-id-users',
    let: { userId: '$user_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
      { $project: { _id: 1, nickname: 1, avatar_file: 1 } }
    ],
    as: 'userInfoArr'
  });

  // 分页
  agg = agg.skip((pageNum - 1) * size).limit(size);

  try {
    const res = await agg.end();
    const list = (res.data || []).map(task => ({
      ...task,
      is_liked: Array.isArray(task.my_like) && task.my_like.length > 0,
      userInfo: Array.isArray(task.userInfoArr) && task.userInfoArr.length > 0 ? task.userInfoArr[0] : null
    }));
    // 查询总数
    const totalRes = await db.collection('kl-tasks').where(matchStage).count();
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
    console.log('[getAllTasks] aggregate error:', e.message);
    return { code: 500, message: e.message, data: [] };
  }
}; 