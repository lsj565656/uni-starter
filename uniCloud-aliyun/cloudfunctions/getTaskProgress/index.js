'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { taskId } = event;
  if (!taskId) return { code: 1, message: '参数不完整' };
  
  try {
    // 获取任务信息
    const taskRes = await db.collection('kl-tasks').doc(taskId).get();
    if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
    const task = taskRes.data[0];
    
    // 获取所有参与者信息（包括发布者）
    const joinsRes = await db.collection('kl-users-join-task')
      .where({ task_id: taskId, isActive: true })
      .get();
    
    const members = joinsRes.data;
    
    // 获取用户头像信息
    const userIds = members.map(m => m.user_id);
    let users = {};
    
    if (userIds.length > 0) {
      const usersRes = await db.collection('uni-id-users')
        .where({ _id: db.command.in(userIds) })
        .field({
          _id: true,
          nickname: true,
          username: true,
          mobile: true,
          avatar_file: true
        })
        .get();
      
      usersRes.data.forEach(user => {
        users[user._id] = user;
      });
    }
    
    // 组装进度信息
    const progress = members.map(member => {
      const user = users[member.user_id] || {};
      return {
        _id: member.user_id,
        nickname: user.nickname || user.username || user.mobile || '未知用户',
        avatar: user.avatar_file?.url || '',
        status: member.status, // preJoin, ready, in_progress, finished
        is_publisher: member.is_publisher,
        join_time: member.join_time,
        finish_time: member.finish_time
      };
    });
    
    // 计算完成状态
    const nonPublisherMembers = members.filter(m => !m.is_publisher);
    const allFinished = nonPublisherMembers.length === 0 || 
                       nonPublisherMembers.every(m => m.status === 'finished');
    
    return {
      code: 0,
      message: '获取进度成功',
      data: {
        task: {
          _id: task._id,
          name: task.name,
          status: task.status,
          max_participants: task.max_participants
        },
        progress,
        allFinished
      }
    };
  } catch (error) {
    return { code: 3, message: '获取进度失败', error: error.message };
  }
}; 