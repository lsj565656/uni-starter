'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { task, userId } = event;
  if (!task || !task._id || !userId) {
    return { code: 1, message: '参数不完整' };
  }
  // 禁止更新 name、category、category_name、location、location_text
  const forbidden = ['name', 'category', 'category_name', 'location', 'location_text'];
  const allowed = ['description', 'media', 'media_detail', 'mode', 'score', 'price', 'max_participants', 'is_publisher_joined', 'isActive', 'start_time', 'end_time', 'joined_count'];
  const updateData = {};
  allowed.forEach(key => {
    if (key in task && !forbidden.includes(key)) updateData[key] = task[key];
  });
  // 额外防御：如果前端传了 forbidden 字段，强制不更新
  forbidden.forEach(key => { if (key in updateData) delete updateData[key]; });
  if (Object.keys(updateData).length === 0) {
    return { code: 4, message: '无可更新字段' };
  }
  try {
    // 校验 userId 必须为任务发布者
    const oldTask = await db.collection('kl-tasks').doc(task._id).get();
    if (!oldTask.data || !oldTask.data[0] || oldTask.data[0].user_id != userId) {
      return { code: 2, message: '无权限修改该任务' };
    }
    await db.collection('kl-tasks').doc(task._id).update(updateData);
    return { code: 0, message: '修改成功' };
  } catch (e) {
    return { code: 3, message: '修改失败', error: e.message };
  }
}; 