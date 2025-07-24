// 获取当前用户发布的任务，支持分页和筛选，并聚合成员信息
'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, filter = '全部', extra = '全部' } = event;
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
  // 只在“已完成”等分类用主表 status
  if (filter === '待开始') {
    matchStage.status = 'not_started';
  } else if (filter === '进行中') {
    matchStage.status = 'in_progress';
  } else if (filter === '已完成') {
    matchStage.status = 'finished';
  } else if (filter === '已失效') {
    matchStage.status = 'invalid';
  }
  // “已评价”不加主表 status 筛选
  let agg = db.collection('kl-tasks').aggregate().match(matchStage);
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
  agg = agg.lookup({
    from: 'uni-id-users',
    let: { userId: '$user_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
      { $project: { _id: 1, nickname: 1, avatar_file: 1 } }
    ],
    as: 'userInfoArr'
  });
  // 只在聚合后做 extra 过滤
  agg = agg.addFields({
    isUserAlsoMember: {
      $in: [userObjectId, '$members._id']
    }
  });
  // 拼接 rateInfo 字段和 myJoinStatus
  agg = agg.lookup({
    from: 'kl-users-join-task',
    let: { taskId: '$_id' },
    pipeline: [
      { $match: { $expr: { $and: [ { $eq: ['$task_id', '$$taskId'] }, { $eq: ['$user_id', userObjectId] } ] } } },
      { $project: { rate: 1, rate_comment: 1, rate_time: 1, status: 1 } }
    ],
    as: 'rateInfoArr'
  });
  agg = agg.addFields({
    rateInfo: { $arrayElemAt: ['$rateInfoArr', 0] },
    myJoinStatus: { $arrayElemAt: ['$rateInfoArr.status', 0] }
  });
  if (extra === '仅发布的') {
    agg = agg.match({ isUserAlsoMember: false });
  } else if (extra === '发布并参与的') {
    agg = agg.match({ isUserAlsoMember: true });
  }
  // 只在“已评价”分类时聚合后筛选
  if (filter === '已评价') {
    agg = agg.match({ myJoinStatus: 'evaluated' });
  } else if (filter === '已完成') {
    agg = agg.match({ myJoinStatus: { $ne: 'evaluated' } });
  }
  agg = agg.skip((page - 1) * pageSize).limit(pageSize);
  try {
    const res = await agg.end();
    const list = (res.data || []).map(task => ({
      ...task,
      userInfo: Array.isArray(task.userInfoArr) && task.userInfoArr.length > 0 ? task.userInfoArr[0] : null
    }));
    // 查询总数（需同步extra逻辑）
    let total = 0;
    if (extra === '全部') {
      // 简单情况直接where计数，避免聚合count限制
      const totalRes = await db.collection('kl-tasks').where(matchStage).count();
      total = totalRes.total || 0;
    } else {
      // 复杂extra，仍用聚合count（受限100条）
      let totalAgg = db.collection('kl-tasks').aggregate().match(matchStage)
        .lookup({
          from: 'kl-users-join-task',
          let: { taskId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$task_id', '$$taskId'] } } },
            { $project: { user_id: 1 } }
          ],
          as: 'members'
        })
        .addFields({
          isUserAlsoMember: {
            $in: [userObjectId, '$members.user_id']
          }
        });
      if (extra === '仅发布的') {
        totalAgg = totalAgg.match({ isUserAlsoMember: false });
      } else if (extra === '发布并参与的') {
        totalAgg = totalAgg.match({ isUserAlsoMember: true });
      }
      const totalRes = await totalAgg.count();
      total = totalRes.total || 0;
    }
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