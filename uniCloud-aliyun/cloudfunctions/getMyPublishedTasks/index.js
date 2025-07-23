// 获取当前用户发布的任务，支持分页和筛选，并聚合成员信息
'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, filter = '全部' } = event;
  const uid = context.auth && context.auth.uid || event.userId;
  if (!uid) {
    return { code: 401, message: '未登录', data: [] };
  }
  let userObjectId = uid;
  if (dbCmd.objectId && typeof dbCmd.objectId === 'function') {
    try {
      userObjectId = dbCmd.objectId(uid);
    } catch (e) {}
  }
  let matchStage = { user_id: userObjectId };
  // 可根据 filter 字段扩展筛选条件
  if (filter === '进行中') {
    matchStage.start_time = dbCmd.lte(Date.now());
    matchStage.end_time = dbCmd.gte(Date.now());
  } else if (filter === '已完成') {
    matchStage.finished = true;
  } else if (filter === '已结束') {
    matchStage.end_time = dbCmd.lt(Date.now());
  } else if (filter === '已失效') {
    matchStage.invalid = true;
  }
  let agg = db.collection('kl-tasks').aggregate().match(matchStage);
  // 聚合成员信息
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
  // 聚合发布者信息
  agg = agg.lookup({
    from: 'uni-id-users',
    let: { userId: '$user_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
      { $project: { _id: 1, nickname: 1, avatar_file: 1 } }
    ],
    as: 'userInfoArr'
  });
  agg = agg.skip((page - 1) * pageSize).limit(pageSize);
  try {
    const res = await agg.end();
    const list = (res.data || []).map(task => ({
      ...task,
      userInfo: Array.isArray(task.userInfoArr) && task.userInfoArr.length > 0 ? task.userInfoArr[0] : null
    }));
    // 查询总数
    const totalRes = await db.collection('kl-tasks').where(matchStage).count();
    const total = totalRes.total || 0;
    const hasMore = page * pageSize < total;
    return {
      code: 0,
      data: list,
      hasMore,
      page,
      pageSize,
      total
    };
  } catch (e) {
    return { code: 500, message: e.message, data: [] };
  }
}; 