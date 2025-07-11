# 评论系统实现文档

## 概述

本评论系统实现了完整的嵌套评论（楼中楼）功能，支持分页加载、实时交互，采用扁平化数据库存储结构。

## 数据库设计

### 1. 评论表 (kl-task-comment)

```json
{
  "pid": "0",                    // 父评论ID，0表示一级评论
  "task_id": "t1",              // 任务ID
  "content": "评论内容",         // 评论内容
  "commenter_id": "u1",         // 评论者ID
  "commenter_name": "小明",     // 评论者昵称
  "commenter_avatar": "/static/avatar1.png", // 评论者头像
  "target_name": "被回复用户",   // 被回复的用户昵称
  "like_count": 2,              // 点赞数
  "is_liked": false,            // 当前用户是否点赞
  "reply_count": 3,             // 回复数
  "task_owner_id": "u2",        // 任务发布者ID
  "create_date": "2024-01-01T10:00:00.000Z" // 创建时间
}
```

### 2. 点赞表 (kl-task-comment-likes)

```json
{
  "comment_id": "c1",           // 评论ID
  "user_id": "u1",             // 用户ID
  "task_id": "t1",             // 任务ID
  "create_date": "2024-01-01T10:00:00.000Z" // 创建时间
}
```

## 云函数

### 1. getTaskComments - 获取评论列表

**功能**: 获取任务的一级评论和其下所有回复，支持分页

**参数**:
- `taskId`: 任务ID
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `currentUserId`: 当前用户ID

**返回**:
```json
{
  "code": 0,
  "data": {
    "comments": [...],  // 评论列表（树状结构）
    "total": 100,       // 总评论数
    "hasMore": true     // 是否有更多
  }
}
```

### 2. addTaskComment - 添加评论

**功能**: 添加新评论或回复

**参数**:
- `taskId`: 任务ID
- `content`: 评论内容
- `pid`: 父评论ID（0表示一级评论）
- `targetName`: 被回复用户昵称
- `currentUserId`: 当前用户ID
- `currentUserName`: 当前用户昵称
- `currentUserAvatar`: 当前用户头像
- `taskOwnerId`: 任务发布者ID

### 3. getMoreReplies - 获取更多回复

**功能**: 获取指定评论的更多回复，支持分页

**参数**:
- `taskId`: 任务ID
- `parentId`: 父评论ID
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `currentUserId`: 当前用户ID

## 前端组件

### 1. CommentSection - 评论区域组件

**Props**:
- `comments`: 评论列表
- `totalCount`: 总评论数
- `authorId`: 当前用户ID
- `taskOwnerId`: 任务发布者ID
- `loading`: 加载状态
- `hasMore`: 是否有更多评论

**Events**:
- `submit`: 提交评论
- `like`: 点赞评论
- `expand-replies`: 展开回复
- `collapse-replies`: 收起回复
- `load-more`: 加载更多评论
- `load-more-replies`: 加载更多回复

### 2. CommentItem - 评论项组件

**Props**:
- `comment`: 评论对象
- `authorId`: 当前用户ID
- `taskOwnerId`: 任务发布者ID
- `level`: 评论层级（1为一级评论）

## 分页加载逻辑

### 1. 主评论分页
- 初始加载20条一级评论
- 点击"加载更多评论"加载下一页
- 每次加载20条

### 2. 回复分页
- 初始显示前2条回复
- 点击"查看全部X条回复"展开所有回复
- 展开后支持"加载更多回复"，每次加载10条
- 点击"收起"回到只显示2条的状态

## 显示规则

### 1. 层级显示
- **一级评论**: 正常显示，无缩进
- **二级评论**: 正常显示，无"回复"前缀
- **三级及以上评论**: 显示"回复 @用户名："前缀

### 2. 排序规则
- 一级评论按时间倒序排列
- 回复按层级关系优先，同级按时间倒序
- 保持视觉齐平，避免过度缩进

## 数据结构转换

### 扁平到树状转换
```javascript
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
```

## 使用示例

### 1. 在页面中使用
```vue
<template>
  <comment-section
    :comments="comments"
    :total-count="totalCommentCount"
    :author-id="currentUserId"
    :task-owner-id="taskOwnerId"
    :loading="commentLoading"
    :has-more="hasMoreComments"
    @submit="onCommentSubmit"
    @like="handleCommentLike"
    @load-more="loadMoreComments"
    @load-more-replies="handleLoadMoreReplies"
  />
</template>
```

### 2. 加载评论
```javascript
async loadComments(page = 1) {
  const res = await uniCloud.callFunction({
    name: 'getTaskComments',
    data: {
      taskId: this.id,
      page,
      pageSize: 20,
      currentUserId: this.currentUserId
    }
  });
  
  if (res.result.code === 0) {
    const { comments, total, hasMore } = res.result.data;
    this.comments = page === 1 ? comments : [...this.comments, ...comments];
    this.hasMoreComments = hasMore;
    this.totalCommentCount = total;
  }
}
```

### 3. 添加评论
```javascript
async onCommentSubmit({ content, replyTo }) {
  const res = await uniCloud.callFunction({
    name: 'addTaskComment',
    data: {
      taskId: this.id,
      content: content.trim(),
      pid: replyTo?.commentId || '0',
      targetName: replyTo?.commenterName || null,
      currentUserId: this.currentUserId,
      currentUserName: '我',
      currentUserAvatar: '/static/avatar_me.png',
      taskOwnerId: this.taskOwnerId
    }
  });
  
  if (res.result.code === 0) {
    const newComment = res.result.data;
    // 添加到对应位置
    if (!replyTo?.commentId) {
      this.comments.unshift(newComment);
    } else {
      const parentComment = this.findCommentById(replyTo.commentId);
      if (parentComment) {
        if (!parentComment.replies) {
          this.$set(parentComment, 'replies', []);
        }
        parentComment.replies.unshift(newComment);
        parentComment.reply_count++;
      }
    }
  }
}
```

## 性能优化

1. **分页加载**: 避免一次性加载大量数据
2. **缓存机制**: 回复分页结果缓存，避免重复请求
3. **扁平存储**: 数据库采用扁平结构，便于查询和索引
4. **懒加载**: 回复默认只显示2条，按需展开
5. **乐观更新**: 点赞等操作先更新UI，再同步到服务器

## 注意事项

1. 确保数据库索引优化（task_id, pid, create_date）
2. 评论内容长度限制（500字）
3. 防止XSS攻击，对用户输入进行过滤
4. 权限控制：只能删除自己的评论或任务发布者删除
5. 时间格式化使用相对时间，提升用户体验 