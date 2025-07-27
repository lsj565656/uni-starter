'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { task, userId } = event;
  if (!task || !task._id || !userId) {
    return { code: 1, message: '参数不完整' };
  }
  // 禁止更新 name、category、category_name、location、location_text
  const forbidden = ['name', 'category', 'category_name', 'location', 'location_text'];
  const allowed = ['description', 'media', 'media_detail', 'mode', 'score', 'price', 'max_participants', 'is_publisher_joined', 'isActive', 'start_time', 'end_time'];
  const updateData = {};
  allowed.forEach(key => {
    if (key in task && !forbidden.includes(key)) updateData[key] = task[key];
  });
  // 额外防御：如果前端传了 forbidden 字段，强制不更新
  forbidden.forEach(key => { if (key in updateData) delete updateData[key]; });
  // 移除 joined_count，由事务处理
  if ('joined_count' in updateData) delete updateData.joined_count;
  if (Object.keys(updateData).length === 0) {
    return { code: 4, message: '无可更新字段' };
  }
  
  try {
    // 校验 userId 必须为任务发布者
    const oldTask = await db.collection('kl-tasks').doc(task._id).get();
    if (!oldTask.data || !oldTask.data[0] || oldTask.data[0].user_id != userId) {
      return { code: 2, message: '无权限修改该任务' };
    }
    
    const oldTaskData = oldTask.data[0];
    const oldIsPublisherJoined = oldTaskData.is_publisher_joined || false;
    const newIsPublisherJoined = task.is_publisher_joined || false;
    
    // 处理发布者参与状态的变化
    if (oldIsPublisherJoined !== newIsPublisherJoined) {
      // 检查任务状态，如果任务已经开始，不允许修改参与状态
      if (oldTaskData.status !== 'not_started') {
        return { code: 5, message: '任务已开始，无法修改参与状态' };
      }
      
      // 在事务外部查找发布者的参与记录
      const joinRes = await db.collection('kl-users-join-task').where({
        task_id: task._id,
        user_id: userId,
        is_publisher: true
      }).get();
      
      console.log('发布者参与记录:', joinRes.data);
      console.log('旧参与状态:', oldIsPublisherJoined, '新参与状态:', newIsPublisherJoined);
      
      // 开始事务
      const transaction = await db.startTransaction();
      
      try {
        // 更新任务主表
        await transaction.collection('kl-tasks').doc(task._id).update(updateData);
        
        if (newIsPublisherJoined) {
          // 发布者要参与任务
          if (joinRes.data && joinRes.data.length > 0) {
            // 如果存在软删除的记录，恢复它
            const existingJoin = joinRes.data[0];
            if (!existingJoin.isActive) {
              await transaction.collection('kl-users-join-task').doc(existingJoin._id).update({
                isActive: true,
                status: 'ready',
                join_time: Date.now()
              });
              
              // 更新任务参与人数（恢复软删除的记录）
              await transaction.collection('kl-tasks').doc(task._id).update({
                joined_count: db.command.inc(1)
              });
            }
            // 如果已经是活跃状态，不需要做任何操作
          } else {
            // 创建新的参与记录
            await transaction.collection('kl-users-join-task').add({
              task_id: task._id,
              user_id: userId,
              is_publisher: true,
              status: 'ready',
              join_time: Date.now(),
              role: 'publisher',
              guarantee_score: 0,
              settle_score: 0,
              guarantee_amount: 0,
              settle_amount: 0,
              isActive: true
            });
            
            // 更新任务参与人数（新增参与记录）
            await transaction.collection('kl-tasks').doc(task._id).update({
              joined_count: db.command.inc(1)
            });
          }
        } else {
          // 发布者要退出任务
          if (joinRes.data && joinRes.data.length > 0) {
            const existingJoin = joinRes.data[0];
            // 只有当前是活跃状态时才需要软删除
            if (existingJoin.isActive) {
              await transaction.collection('kl-users-join-task').doc(existingJoin._id).update({
                isActive: false,
                status: 'quit'
              });
              
              // 更新任务参与人数（软删除活跃记录）
              await transaction.collection('kl-tasks').doc(task._id).update({
                joined_count: db.command.inc(-1)
              });
            }
          }
        }
        
        await transaction.commit();
      } catch (e) {
        await transaction.rollback();
        throw e;
      }
    } else {
      // 没有参与状态变化，直接更新任务主表
      await db.collection('kl-tasks').doc(task._id).update(updateData);
    }
    
    // 返回更新后的参与任务计数
    const joinedCount = await db.collection('kl-users-join-task')
      .where({
        user_id: userId,
        isActive: true
      })
      .count();
    
    return { 
      code: 0, 
      message: '修改成功',
      joinedCount: joinedCount.total || 0
    };
  } catch (e) {
    return { code: 3, message: '修改失败', error: e.message };
  }
}; 