<template>
	<view class="detail-container">
    <!-- 顶部图片 -->
    <image class="detail-image" :src="task.image" mode="aspectFill" />

    <!-- 积分/价格、已加入人数 -->
    <view class="detail-header-row">
      <view class="score">
        <uni-icons :type="task.mode === 'score' ? 'icon-jifen' : 'icon-renminbi'" custom-prefix="iconfont" color="#ff6600" size="22" />
        <text class="score-text">{{ task.mode === 'score' ? task.score + ' 积分' : task.price + '元' }}</text>
					</view>
      <view class="joined">
        已加入 <text class="joined-num">{{ task.joined_count }}</text>/<text class="joined-max">{{ task.max_participants }}</text> 人
					</view>
				</view>

    <!-- 标签 -->
    <view class="category-tag">{{ task.category_name }}</view>

    <!-- 标题 -->
    <view class="task-title">{{ task.name }}</view>

    <!-- 地点、时间 -->
    <view class="task-meta">
      <uni-icons type="location" size="18" color="#ff6666" />
      <text class="meta-text">{{ task.location }}</text>
					</view>
    <view class="task-meta">
      <uni-icons type="calendar" size="18" color="#ff6666" />
      <text class="meta-text">{{ formatTime(task.start_time) }} —— {{ formatTime(task.end_time) }}</text>
						</view>

    <!-- 描述 -->
    <view class="task-desc">{{ task.description }}</view>

    <!-- 发布者 -->
    <view class="task-publisher">
      <image class="publisher-avatar" :src="task.user?.avatar_file?.url || '/static/logo.png'" />
      <text class="publisher-nickname">{{ task.user?.nickname }}</text>
      <text class="publisher-date">发布于{{ formatTime(task.create_date) }}</text>
				</view>

    <!-- 评论区 -->
    <comment-section
      ref="commentSection"
      v-model="barInputValue"
      :comments="comments"
      :total-count="totalCommentCount"
      :author-id="currentUserId"
      :task-owner-id="taskOwnerId"
      @submit="onCommentSubmit"
      @like="handleCommentLike"
      @expand-replies="handleExpandReplies"
      @collapse-replies="handleCollapseReplies"
      @blur="onCommentInputBlur"
    />

		<!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="input-area" @click="showCommentInputBar">
        <text class="bar-input-text">{{ barInputValue || '说点什么吧...' }}</text>
				</view>
      <view class="bar-btns">
        <view class="bar-btn" @click="onLike">
          <uni-icons :type="task.is_liked ? 'heart-filled' : 'heart'" size="22" :color="task.is_liked ? 'red' : '#888'" />
          <text>{{ task.like_count }}</text>
				</view>
        <!-- <view class="bar-btn" @click="onComment">
          <uni-icons type="chat" size="22" color="#888" />
          <text>{{ totalCommentCount }}</text>
        </view> -->
        <button class="join-btn" @click="onJoin">加入</button>
			</view>
		</view>
	</view>
</template>

<script>
import { formatTime } from '@/utils/tools.js';
import { mockComments } from '@/utils/comments.js'

	export default {
		data() {
			return {
      id: '',
      task: {
        image: '',
        score: 0,
        price: 0,
        mode: 'score',
        joined_count: 0,
        max_participants: 1,
        category_name: '',
        name: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        user: {
          nickname: '',
          avatar_file: { url: '' }
        },
        create_date: '',
        is_liked: false,
        like_count: 0
      },
      comments: mockComments,
      currentUserId: 'u1',
      taskOwnerId: 'u2',
      totalCommentCount: 0,
      barInputValue: '',
    }
  },
  watch: {
    comments: {
      handler(val) {
        this.totalCommentCount = this.calcTotalCommentCount(val)
      },
      deep: true,
      immediate: true
			}
		},
		mounted() {
    // 对评论树做排序和重排
    this.comments = this.reorderReplies(this.comments)
		},
		methods: {
    formatTime,
    onLike() {
      const wasLiked = !!this.task.is_liked;
      const oldLikeCount = typeof this.task.like_count === 'number' ? this.task.like_count : 0;
      // 乐观更新
      if (wasLiked) {
        this.task.is_liked = false;
        this.task.like_count = Math.max(oldLikeCount - 1, 0);
      } else {
        this.task.is_liked = true;
        this.task.like_count = oldLikeCount + 1;
      }
      uniCloud.callFunction({
        name: 'likeTask',
        data: { task_id: this.id }
      }).then(res => {
        const result = res.result;
        if (result && result.code === 0) {
          // 成功后不处理，UI已响应
        } else {
          // 失败回滚
          this.task.is_liked = wasLiked;
          this.task.like_count = oldLikeCount;
        }
      }).catch(() => {
        // 网络异常回滚
        this.task.is_liked = wasLiked;
        this.task.like_count = oldLikeCount;
      });
    },
    onComment() {
      uni.showToast({ title: '评论功能开发中', icon: 'none' });
    },
    onJoin() {
      uni.showToast({ title: '加入功能开发中', icon: 'none' });
    },
    fetchTaskDetail(id) {
      uniCloud.callFunction({
        name: 'getTaskDetail',
        data: { id }
      }).then(res => {
        if (res.result && res.result.data) {
          this.task = { ...this.task, ...res.result.data };
        }
				});
			},
    handleExpandReplies(commentId) {
      const idx = this.comments.findIndex(c => c.id === commentId)
      if (idx === -1) return
      const allReplies = this.allRepliesMap[commentId]
      if (!allReplies) return
      this.$set(this.comments[idx], 'replies', allReplies)
    },
    handleCollapseReplies(commentId) {
      const idx = this.comments.findIndex(c => c.id === commentId)
      if (idx === -1) return
      const allReplies = this.allRepliesMap[commentId]
      if (!allReplies) return
      this.$set(this.comments[idx], 'replies', allReplies.slice(0, 2))
    },
    calcTotalCommentCount(comments) {
      let count = 0
      for (const c of comments) {
        count += 1
        if (c.replies && c.replies.length) {
          count += this.calcTotalCommentCount(c.replies)
        }
      }
      return count
    },
    handleCommentLike(commentId) {
      // 递归查找评论并处理点赞
      const findAndLikeComment = (commentList) => {
        for (const comment of commentList) {
          if (comment.id === commentId) {
            comment.is_liked = !comment.is_liked;
            comment.like_count = (comment.like_count || 0) + (comment.is_liked ? 1 : -1);
            return true;
          }
          
          // 递归查找子评论
          if (comment.replies && comment.replies.length > 0) {
            if (findAndLikeComment(comment.replies)) {
              return true;
            }
          }
        }
        return false;
      };

      findAndLikeComment(this.comments);
    },
    showCommentInputBar() {
      // 只需弹出输入框，v-model 会自动同步内容
      if (this.$refs.commentSection && this.$refs.commentSection.onReply) {
        this.$refs.commentSection.onReply({ id: '', commenter_name: '' })
      } else if (this.$refs.commentSection) {
        this.$refs.commentSection.showInputBar = true
      }
    },
    onCommentInputBlur(val) {
      this.barInputValue = val && val.trim() ? val : ''
    },
    onCommentSubmit({ content, replyTo }) {
      const now = Date.now();
      const newComment = {
        id: 'c' + now,
        pid: replyTo && replyTo.commentId ? replyTo.commentId : '0',
        task_id: this.id,
        content,
        createdAt: now,
        commenter_id: this.currentUserId,
        commenter_name: '我', // 实际应取当前用户昵称
        commenter_avatar: '/static/avatar_me.png', // 实际应取当前用户头像
        like_count: 0,
        is_liked: false,
        replies: [],
        reply_count: 0
      };

      if (!replyTo || !replyTo.commentId) {
        // 一级评论
        this.comments.unshift(newComment);
        this.barInputValue = '';
        
        // 重新排序评论，确保层级关系正确
        this.comments = this.reorderReplies(this.comments);
      } else {
        // 查找被回复的评论并设置 target_name
        const findTargetComment = (commentList, targetId) => {
          for (const comment of commentList) {
            if (comment.id === targetId) {
              return comment;
            }
            if (comment.replies && comment.replies.length > 0) {
              const found = findTargetComment(comment.replies, targetId);
              if (found) return found;
            }
          }
          return null;
        };
        
        // 查找被回复评论所属的一级评论
        const findParentComment = (commentList, targetId) => {
          for (const comment of commentList) {
            if (comment.id === targetId) {
              return comment;
            }
            if (comment.replies && comment.replies.length > 0) {
              // 检查当前一级评论的 replies 中是否包含目标评论
              const hasTarget = comment.replies.some(reply => reply.id === targetId);
              if (hasTarget) {
                return comment;
              }
              // 递归查找更深层
              const found = findParentComment(comment.replies, targetId);
              if (found) return found;
            }
          }
          return null;
        };

        // 查找被回复的评论
        const targetComment = findTargetComment(this.comments, replyTo.commentId);
        if (targetComment) {
          // 设置被回复的用户信息
          newComment.target_name = targetComment.commenter_name;
        }
        
        // 查找被回复评论所属的一级评论
        const parentComment = findParentComment(this.comments, replyTo.commentId);
        if (parentComment) {
          // 将新评论插入到一级评论的 replies 数组中
          if (!parentComment.replies) {
            this.$set(parentComment, 'replies', []);
          }
          parentComment.replies.unshift(newComment);
          parentComment.reply_count = (parentComment.reply_count || 0) + 1;
        } else {
          // fallback: 没找到就push到第一个主评论下
          if (this.comments.length) {
            if (!this.comments[0].replies) this.$set(this.comments[0], 'replies', []);
            this.comments[0].replies.push(newComment);
            this.comments[0].reply_count = (this.comments[0].reply_count || 0) + 1;
          }
        }
        
        this.barInputValue = '';
        
        // 重新排序评论，确保层级关系正确
        this.comments = this.reorderReplies(this.comments);
      }
    },
    reorderReplies(comments) {
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
  },
  onLoad(options) {
    if (options.id) this.id = options.id;
    // 直接用所有参数初始化 task
    this.task = {
      ...this.task,
      name: options.name ? decodeURIComponent(options.name) : '',
      image: options.image ? decodeURIComponent(options.image) : '',
      description: options.description ? decodeURIComponent(options.description) : '',
      like_count: options.like_count ? Number(options.like_count) : 0,
      is_liked: options.is_liked == 1,
      joined_count: options.joined_count ? Number(options.joined_count) : 0,
      max_participants: options.max_participants ? Number(options.max_participants) : 1,
      user: {
        nickname: options.nickname ? decodeURIComponent(options.nickname) : '',
        avatar_file: { url: options.avatar_url ? decodeURIComponent(options.avatar_url) : '' }
      },
      score: options.score ? Number(options.score) : 0,
      price: options.price ? Number(options.price) : 0,
      mode: options.mode ? options.mode : 'score',
      location: options.location ? decodeURIComponent(options.location) : '',
      start_time: options.start_time ? Number(options.start_time) : '',
      end_time: options.end_time ? Number(options.end_time) : '',
      create_date: options.create_date ? Number(options.create_date) : '',
      category_name: options.category_name ? decodeURIComponent(options.category_name) : '',
      // 可继续加其它字段
    };
  },
  onPullDownRefresh() {
    if (!this.id) return;
    uniCloud.callFunction({
      name: 'getTaskDetail',
      data: { id: this.id }
    }).then(res => {
      if (res.result && res.result.data) {
        // 保留本地 is_liked/like_count
        const { is_liked, like_count } = this.task;
        this.task = { ...this.task, ...res.result.data, is_liked, like_count };
      }
      uni.stopPullDownRefresh();
    }).catch(() => {
      uni.stopPullDownRefresh();
    });
		}
	}
</script>

<style scoped>
.detail-container {
	min-height: 100vh;
	background-color: #fff;
  padding-bottom: 70px;
}
.detail-image {
  width: 100vw;
  height: 220px;
  object-fit: cover;
}
.detail-header-row {
			display: flex;
  justify-content: space-between;
			align-items: center;
  padding: 16px 16px 0 16px;
}
.score {
		display: flex;
		align-items: center;
  color: #ff6600;
  font-size: 20px;
}
.score-text {
  margin-left: 6px;
  font-weight: bold;
}
.joined {
				color: #666;
  font-size: 16px;
}
.joined-num {
  color: #ff3333;
  font-weight: bold;
}
.joined-max {
  color: #888;
}
.category-tag {
  margin: 10px 16px 0 16px;
  display: inline-block;
  background: #ffe0b2;
  color: #ff9800;
  border-radius: 8px;
  padding: 2px 10px;
  font-size: 13px;
}
.task-title {
  font-size: 22px;
  font-weight: 600;
  margin: 12px 16px 0 16px;
  color: #222;
}
.task-meta {
	display: flex;
	align-items: center;
  margin: 8px 16px 0 16px;
  color: #888;
  font-size: 15px;
}
.meta-text {
  margin-left: 4px;
}
.task-desc {
  margin: 16px 16px 0 16px;
  font-size: 15px;
  color: #444;
  line-height: 1.7;
}
.task-publisher {
			display: flex;
			align-items: center;
  margin: 18px 16px 0 16px;
  font-size: 14px;
  color: #888;
}
.publisher-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-right: 8px;
}
.publisher-nickname {
  color: #1976d2;
  margin-right: 8px;
}
.publisher-date {
  color: #aaa;
}
.bottom-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 8px;
  z-index: 100;
}
.input-area {
		flex: 1;
			display: flex;
			align-items: center;
  background: #f5f5f5;
  border-radius: 18px;
  padding: 4px 12px;
  font-size: 16px;
  color: #222;
  min-height: 36px;
  max-height: 36px;
  line-height: 24px;
  overflow: hidden;
}
.bar-input-text {
  color: #bbb;
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reply-to {
  color: #1976d2;
  margin-right: 2px;
}
.bar-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-btn {
		display: flex;
		align-items: center;
  margin-right: 8px;
  font-size: 16px;
  background: none;
  border: none;
  padding: 0;
}
.bar-btn text {
  margin-left: 2px;
}
uni-button:after {
  border: none !important;
}
.bar-right {
  flex: 1;
		display: flex;
  justify-content: flex-end;
}
.join-btn {
				background: linear-gradient(90deg, #ff9800, #ffc107);
				color: #fff;
  border: none;
  border-radius: 18px;
  padding: 0 18px;
  height: 36px;
  font-size: 16px;
  font-weight: 600;
}
/* 删除.float-input-bar及相关样式 */
</style>
