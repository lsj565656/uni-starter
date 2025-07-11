'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { 
    taskId, 
    content, 
    pid = '0', 
    targetName = null,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    taskOwnerId 
  } = event;
  
  if (!taskId || !content || !currentUserId || !currentUserName) {
    return {
      code: -1,
      message: '参数不完整'
    };
  }
  
  if (content.length > 500) {
    return {
      code: -1,
      message: '评论内容不能超过500字'
    };
  }
  
  try {
    const now = new Date();
    
    // 构建评论数据
    const commentData = {
      pid,
      task_id: taskId,
      content: content.trim(),
      commenter_id: currentUserId,
      commenter_name: currentUserName,
      commenter_avatar: currentUserAvatar,
      target_name: targetName,
      like_count: 0,
      is_liked: false,
      reply_count: 0,
      task_owner_id: taskOwnerId,
      create_date: now,
      update_date: now
    };
    
    // 插入评论
    const result = await db.collection('kl-task-comment').add(commentData);
    
    if (!result.id) {
      throw new Error('插入评论失败');
    }
    
    // 如果是回复评论，更新父评论的回复数
    if (pid !== '0') {
      await updateParentReplyCount(pid);
    }
    
    // 获取插入的评论完整信息
    const insertedComment = await db.collection('kl-task-comment')
      .doc(result.id)
      .get();
    
    if (insertedComment.data.length === 0) {
      throw new Error('获取插入的评论失败');
    }
    
    const comment = insertedComment.data[0];
    
    return {
      code: 0,
      message: '评论成功',
      data: {
        ...comment,
        id: comment._id,
        createdAt: new Date(comment.create_date).getTime(),
        replies: []
      }
    };
    
  } catch (error) {
    console.error('添加评论失败:', error);
    return {
      code: -1,
      message: '添加评论失败',
      error: error.message
    };
  }
};

// 更新父评论的回复数
async function updateParentReplyCount(parentId) {
  try {
    // 计算父评论的直接回复数
    const replyCount = await db.collection('kl-task-comment')
      .where({
        pid: parentId
      })
      .count();
    
    // 更新父评论的回复数
    await db.collection('kl-task-comment')
      .doc(parentId)
      .update({
        reply_count: replyCount.total,
        update_date: new Date()
      });
      
  } catch (error) {
    console.error('更新父评论回复数失败:', error);
  }
} 