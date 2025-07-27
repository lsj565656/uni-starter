'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { taskId, userId } = event;
  if (!taskId || !userId) return { code: 1, message: '参数不完整' };
  
  try {
    // 检查任务是否存在且状态为进行中
    const taskRes = await db.collection('kl-tasks').doc(taskId).get();
    if (!taskRes.data || !taskRes.data[0]) return { code: 2, message: '任务不存在' };
    const task = taskRes.data[0];
    
    if (task.status !== 'in_progress') return { code: 3, message: '任务状态不正确' };
    
    // 检查是否为参与者（非发布者）
    if (String(task.user_id) === String(userId)) return { code: 4, message: '发布者不能标记完成' };
    
    // 检查参与者关系是否存在
    const joinRes = await db.collection('kl-users-join-task')
      .where({ task_id: taskId, user_id: userId, isActive: true })
      .get();
    
    if (!joinRes.data || joinRes.data.length === 0) return { code: 5, message: '未找到参与关系' };
    
    const join = joinRes.data[0];
    if (join.status !== 'in_progress') return { code: 6, message: '参与者状态不正确' };
    
    // 更新参与者状态为已完成
    await db.collection('kl-users-join-task').doc(join._id).update({
      status: 'finished',
      finish_time: Date.now()
    });
    
    // 返回结果
    return {
      code: 0,
      message: '标记完成成功'
    };
  } catch (error) {
    return { code: 7, message: '操作失败', error: error.message };
  }
};

// 获取各分类的数量统计（参与的任务）
async function getCategoryCounts(userId, extra) {
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 先查 kl-users-join-task 表，获取我参与的任务ID
  const joinRes = await db.collection('kl-users-join-task').where({ user_id: userId, isActive: true }).get();
  const taskIds = joinRes.data.map(j => j.task_id);
  
  if (!taskIds.length) {
    return {
      '全部': 0,
      '待开始': 0,
      '进行中': 0,
      '已完成': 0,
      '已失效': 0,
      '已评价': 0
    };
  }
  
  // 获取所有参与的任务详情
  const tasksRes = await db.collection('kl-tasks').where({ _id: dbCmd.in(taskIds), isActive: true }).get();
  const tasks = tasksRes.data;
  
  // 获取用户的参与状态信息
  const userJoinsRes = await db.collection('kl-users-join-task').where({ 
    user_id: userId, 
    task_id: dbCmd.in(taskIds), 
    isActive: true 
  }).get();
  const userJoins = userJoinsRes.data;
  
  // 创建任务ID到参与状态的映射
  const taskJoinMap = {};
  userJoins.forEach(join => {
    taskJoinMap[join.task_id] = join;
  });
  
  // 统计各分类数量
  const counts = {
    '全部': 0,
    '待开始': 0,
    '进行中': 0,
    '已完成': 0,
    '已失效': 0,
    '已评价': 0
  };
  
  tasks.forEach(task => {
    const userJoin = taskJoinMap[task._id];
    if (!userJoin) return;
    
    // 根据extra过滤
    let shouldCount = true;
    if (extra === '仅我参与的') {
      shouldCount = task.user_id !== userId;
    } else if (extra === '我发布并参与的') {
      shouldCount = task.user_id === userId;
    }
    
    if (!shouldCount) return;
    
    counts['全部']++;
    
    // 根据任务状态和用户参与状态分类
    if (task.status === 'not_started') {
      counts['待开始']++;
    } else if (task.status === 'in_progress') {
      counts['进行中']++;
    } else if (task.status === 'finished') {
      if (userJoin.status === 'evaluated') {
        counts['已评价']++;
      } else {
        counts['已完成']++;
      }
    } else if (task.status === 'invalid') {
      counts['已失效']++;
    }
  });
  
  return counts;
}

// 获取各分类的数量统计（发布的任务）
async function getPublishedCategoryCounts(userId, extra) {
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取用户发布的所有任务
  const tasksRes = await db.collection('kl-tasks').where({ user_id: userId, isActive: true }).get();
  const tasks = tasksRes.data;
  
  if (!tasks.length) {
    return {
      '全部': 0,
      '待开始': 0,
      '进行中': 0,
      '已完成': 0,
      '已失效': 0,
      '已评价': 0
    };
  }
  
  const taskIds = tasks.map(t => t._id);
  
  // 获取用户的参与状态信息
  const userJoinsRes = await db.collection('kl-users-join-task').where({ 
    user_id: userId, 
    task_id: dbCmd.in(taskIds), 
    isActive: true 
  }).get();
  const userJoins = userJoinsRes.data;
  
  // 创建任务ID到参与状态的映射
  const taskJoinMap = {};
  userJoins.forEach(join => {
    taskJoinMap[join.task_id] = join;
  });
  
  // 统计各分类数量
  const counts = {
    '全部': 0,
    '待开始': 0,
    '进行中': 0,
    '已完成': 0,
    '已失效': 0,
    '已评价': 0
  };
  
  tasks.forEach(task => {
    const userJoin = taskJoinMap[task._id];
    
    // 根据extra过滤
    let shouldCount = true;
    if (extra === '仅发布的') {
      shouldCount = !userJoin; // 没有参与记录，说明只是发布者
    } else if (extra === '发布并参与的') {
      shouldCount = !!userJoin; // 有参与记录，说明既是发布者又是参与者
    }
    
    if (!shouldCount) return;
    
    counts['全部']++;
    
    // 根据任务状态和用户参与状态分类
    if (task.status === 'not_started') {
      counts['待开始']++;
    } else if (task.status === 'in_progress') {
      counts['进行中']++;
    } else if (task.status === 'finished') {
      if (userJoin && userJoin.status === 'evaluated') {
        counts['已评价']++;
      } else {
        counts['已完成']++;
      }
    } else if (task.status === 'invalid') {
      counts['已失效']++;
    }
  });
  
  return counts;
} 