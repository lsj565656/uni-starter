'use strict';
const db = uniCloud.database();
const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  // 1. 获取 token
  const token = event.uniIdToken || context.uniIdToken;
  if (!token) return { code: 401, msg: '未登录' };

  // 2. 校验 token
  const uniIDIns = uniID.createInstance({ context });
  let authRes = await uniIDIns.checkToken(token);
  if (authRes.code !== 0) {
    return { code: 401, msg: '未登录' };
  }
  const user_id = authRes.uid;
  const { task_id } = event;
  if (!task_id) return { code: 400, msg: '缺少参数' };

  const likeColl = db.collection('kl-tasks-likes');
  const taskColl = db.collection('kl-tasks');

  // 检查是否已点赞
  const exist = await likeColl.where({ user_id, task_id }).get();
  let isLiked;
  if (exist.data && exist.data.length > 0) {
    // 已点赞，执行取消点赞
    await likeColl.where({ user_id, task_id }).remove();
    await taskColl.doc(task_id).update({ like_count: db.command.inc(-1) });
    isLiked = false;
  } else {
    // 未点赞，执行点赞
    await likeColl.add({ user_id, task_id });
    await taskColl.doc(task_id).update({ like_count: db.command.inc(1) });
    isLiked = true;
  }
  // 查询最新 likeCount
  const taskDoc = await taskColl.doc(task_id).get();
  const likeCount = (taskDoc.data && taskDoc.data[0] && typeof taskDoc.data[0].like_count === 'number') ? taskDoc.data[0].like_count : 0;
  return {
    code: 0,
    data: {
      isLiked,
      likeCount
    }
  };
};
