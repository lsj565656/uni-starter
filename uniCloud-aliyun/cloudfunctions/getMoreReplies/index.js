'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { 
    taskId, 
    parentId, 
    page = 1, 
    pageSize = 10, 
    currentUserId 
  } = event;
  
  if (!taskId || !parentId) {
    return {
      code: -1,
      message: '参数不完整'
    };
  }
  
  try {
    const skip = (page - 1) * pageSize;
    
    // 获取指定父评论的所有回复（分页）
    const repliesQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: parentId
      })
      .orderBy('create_date', 'desc')
      .skip(skip)
      .limit(pageSize);
    
    const replies = await repliesQuery.get();
    
    if (replies.data.length === 0) {
      return {
        code: 0,
        data: {
          replies: [],
          total: 0,
          hasMore: false
        }
      };
    }
    
    // 获取这些回复的所有子回复
    const replyIds = replies.data.map(reply => reply._id);
    const childRepliesQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: dbCmd.in(replyIds)
      })
      .orderBy('create_date', 'desc');
    
    const childReplies = await childRepliesQuery.get();
    
    // 合并数据并构建树结构
    const allReplies = [...replies.data, ...childReplies.data];
    const replyTree = buildReplyTree(allReplies, parentId);
    
    // 应用排序逻辑
    const sortedReplies = reorderReplies(replyTree);
    
    // 获取总数
    const totalQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: parentId
      })
      .count();
    
    const total = await totalQuery;
    
    // 处理点赞状态
    if (currentUserId) {
      await processLikeStatus(sortedReplies, currentUserId);
    }
    
    return {
      code: 0,
      data: {
        replies: sortedReplies,
        total: total.total,
        hasMore: skip + pageSize < total.total
      }
    };
    
  } catch (error) {
    console.error('获取更多回复失败:', error);
    return {
      code: -1,
      message: '获取更多回复失败',
      error: error.message
    };
  }
};

// 构建回复树
function buildReplyTree(flatReplies, parentId) {
  const replyMap = new Map();
  const roots = [];
  
  // 创建映射
  flatReplies.forEach(reply => {
    replyMap.set(reply._id, { 
      ...reply, 
      id: reply._id,
      createdAt: new Date(reply.create_date).getTime(),
      replies: [] 
    });
  });
  
  // 构建树结构
  flatReplies.forEach(reply => {
    if (reply.pid === parentId) {
      roots.push(replyMap.get(reply._id));
    } else {
      const parent = replyMap.get(reply.pid);
      if (parent) {
        parent.replies.push(replyMap.get(reply._id));
      }
    }
  });
  
  return roots;
}

// 重新排序回复（层级关系优先）
function reorderReplies(replies) {
  if (!Array.isArray(replies)) return [];
  
  // 递归函数：按层级关系重新组织回复，保持视觉齐平
  const organizeByHierarchy = (replyList, parentId = null, maxDepth = 10) => {
    if (!Array.isArray(replyList) || maxDepth <= 0) return [];
    
    const result = [];
    
    // 先找直接回复当前父评论的回复
    const directReplies = replyList.filter(r => r.pid === parentId);
    
    // 按时间排序直接回复
    directReplies.sort((a, b) => b.createdAt - a.createdAt);
    
    for (const reply of directReplies) {
      // 添加当前回复
      result.push({ ...reply, replies: [] });
      
      // 递归查找该回复的所有子回复，并插入到该回复后面
      const childReplies = replyList.filter(r => r.pid === reply.id);
      if (childReplies.length > 0) {
        // 按时间排序子回复
        childReplies.sort((a, b) => b.createdAt - a.createdAt);
        // 将子回复平铺插入到当前回复后面
        for (const child of childReplies) {
          result.push({ ...child, replies: [] });
          
          // 递归处理更深层的回复
          const deeperReplies = organizeByHierarchy(replyList, child.id, maxDepth - 1);
          result.push(...deeperReplies);
        }
      }
    }
    
    return result;
  };
  
  // 按层级关系组织回复，保持视觉齐平
  return organizeByHierarchy(replies);
}

// 处理点赞状态
async function processLikeStatus(replies, currentUserId) {
  // 获取所有回复ID
  const replyIds = [];
  const collectIds = (replyList) => {
    replyList.forEach(reply => {
      replyIds.push(reply.id);
      if (reply.replies && reply.replies.length > 0) {
        collectIds(reply.replies);
      }
    });
  };
  collectIds(replies);
  
  if (replyIds.length === 0) return;
  
  // 查询当前用户的点赞记录
  const likeQuery = db.collection('kl-task-comment-likes')
    .where({
      comment_id: dbCmd.in(replyIds),
      user_id: currentUserId
    })
    .get();
  
  const likeRecords = await likeQuery;
  const likedReplyIds = new Set(likeRecords.data.map(record => record.comment_id));
  
  // 更新回复的点赞状态
  const updateLikeStatus = (replyList) => {
    replyList.forEach(reply => {
      reply.is_liked = likedReplyIds.has(reply.id);
      if (reply.replies && reply.replies.length > 0) {
        updateLikeStatus(reply.replies);
      }
    });
  };
  updateLikeStatus(replies);
} 