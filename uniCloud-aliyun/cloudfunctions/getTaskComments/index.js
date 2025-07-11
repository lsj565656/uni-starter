'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { taskId, page = 1, pageSize = 20, currentUserId } = event;
  
  if (!taskId) {
    return {
      code: -1,
      message: '任务ID不能为空'
    };
  }
  
  try {
    const skip = (page - 1) * pageSize;
    
    // 1. 获取一级评论（分页）
    const rootCommentsQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: '0'
      })
      .orderBy('create_date', 'desc')
      .skip(skip)
      .limit(pageSize);
    
    const rootComments = await rootCommentsQuery.get();
    
    if (rootComments.data.length === 0) {
      return {
        code: 0,
        data: {
          comments: [],
          total: 0,
          hasMore: false
        }
      };
    }
    
    // 2. 获取这些一级评论的所有回复
    const rootIds = rootComments.data.map(comment => comment._id);
    const repliesQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: dbCmd.in(rootIds)
      })
      .orderBy('create_date', 'desc');
    
    const replies = await repliesQuery.get();
    
    // 3. 合并数据并构建树结构
    const allComments = [...rootComments.data, ...replies.data];
    const commentTree = buildCommentTree(allComments);
    
    // 4. 应用排序逻辑
    const sortedComments = reorderReplies(commentTree);
    
    // 5. 获取总数
    const totalQuery = db.collection('kl-task-comment')
      .where({
        task_id: taskId,
        pid: '0'
      })
      .count();
    
    const total = await totalQuery;
    
    // 6. 处理点赞状态
    if (currentUserId) {
      await processLikeStatus(sortedComments, currentUserId);
    }
    
    return {
      code: 0,
      data: {
        comments: sortedComments,
        total: total.total,
        hasMore: skip + pageSize < total.total
      }
    };
    
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return {
      code: -1,
      message: '获取评论列表失败',
      error: error.message
    };
  }
};

// 构建评论树
function buildCommentTree(flatComments) {
  const commentMap = new Map();
  const roots = [];
  
  // 创建映射
  flatComments.forEach(comment => {
    commentMap.set(comment._id, { 
      ...comment, 
      id: comment._id,
      createdAt: new Date(comment.create_date).getTime(),
      replies: [] 
    });
  });
  
  // 构建树结构
  flatComments.forEach(comment => {
    if (comment.pid === '0') {
      roots.push(commentMap.get(comment._id));
    } else {
      const parent = commentMap.get(comment.pid);
      if (parent) {
        parent.replies.push(commentMap.get(comment._id));
      }
    }
  });
  
  return roots;
}

// 重新排序评论（层级关系优先）
function reorderReplies(comments) {
  if (!Array.isArray(comments)) return [];
  
  // 递归函数：按层级关系重新组织评论，保持视觉齐平
  const organizeByHierarchy = (commentList, parentId = null, maxDepth = 10) => {
    if (!Array.isArray(commentList) || maxDepth <= 0) return [];
    
    const result = [];
    
    // 先找直接回复当前父评论的评论
    const directReplies = commentList.filter(c => c.pid === parentId);
    
    // 按时间排序直接回复
    directReplies.sort((a, b) => b.createdAt - a.createdAt);
    
    for (const reply of directReplies) {
      // 添加当前回复
      result.push({ ...reply, replies: [] });
      
      // 递归查找该回复的所有子回复，并插入到该回复后面
      const childReplies = commentList.filter(c => c.pid === reply.id);
      if (childReplies.length > 0) {
        // 按时间排序子回复
        childReplies.sort((a, b) => b.createdAt - a.createdAt);
        // 将子回复平铺插入到当前回复后面
        for (const child of childReplies) {
          result.push({ ...child, replies: [] });
          
          // 递归处理更深层的回复
          const deeperReplies = organizeByHierarchy(commentList, child.id, maxDepth - 1);
          result.push(...deeperReplies);
        }
      }
    }
    
    return result;
  };
  
  // 处理每个一级评论
  for (const comment of comments) {
    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      // 按层级关系组织评论，保持视觉齐平
      comment.replies = organizeByHierarchy(comment.replies, comment.id);
    }
  }
  
  // 一级评论按时间倒序排序
  return comments.slice().sort((a, b) => b.createdAt - a.createdAt);
}

// 处理点赞状态
async function processLikeStatus(comments, currentUserId) {
  // 获取所有评论ID
  const commentIds = [];
  const collectIds = (commentList) => {
    commentList.forEach(comment => {
      commentIds.push(comment.id);
      if (comment.replies && comment.replies.length > 0) {
        collectIds(comment.replies);
      }
    });
  };
  collectIds(comments);
  
  if (commentIds.length === 0) return;
  
  // 查询当前用户的点赞记录
  const likeQuery = db.collection('kl-task-comment-likes')
    .where({
      comment_id: dbCmd.in(commentIds),
      user_id: currentUserId
    })
    .get();
  
  const likeRecords = await likeQuery;
  const likedCommentIds = new Set(likeRecords.data.map(record => record.comment_id));
  
  // 更新评论的点赞状态
  const updateLikeStatus = (commentList) => {
    commentList.forEach(comment => {
      comment.is_liked = likedCommentIds.has(comment.id);
      if (comment.replies && comment.replies.length > 0) {
        updateLikeStatus(comment.replies);
      }
    });
  };
  updateLikeStatus(comments);
} 