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
      <image class="publisher-avatar" :src="task.user?.ownerAvatarUrl?.url || '/static/logo.png'" />
      <text class="publisher-nickname">{{ task.user?.ownerNickname }}</text>
      <text class="publisher-date">发布于{{ formatTime(task.create_date) }}</text>
				</view>

    <!-- 评论区 -->
    <comment-section
      ref="commentSection"
      v-model="barInputValue"
      :comments="comments"
      :total-count="totalCommentCount"
      :author-id="this.userInfo._id"
      :task-owner-id="this.task.user?.ownerUserId"
      :loading="commentLoading"
      :has-more="hasMoreComments"
      @submit="onCommentSubmit"
      @like="handleCommentLike"
      @expand-replies="handleExpandReplies"
      @collapse-replies="handleCollapseReplies"
      @load-more="loadMoreComments"
      @load-more-replies="handleLoadMoreReplies"
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
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

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
        comments: [],
        // comments: mockComments,
        taskOwnerId: 'u2', // 实际应从任务数据获取
        totalCommentCount: 0,
        barInputValue: '',
        commentLoading: false,
        hasMoreComments: false,
        currentPage: 1,
        pageSize: 20,
        // 存储每个评论的回复分页状态
        replyPaginationMap: new Map()
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
    computed: {
      userInfo() {
        return store.userInfo
      }
    },
		mounted() {
      this.loadComments();
		},
		methods: {
      formatTime,
      
      // 加载评论列表
      async loadComments(page = 1) {
        if (this.commentLoading) return;
        
        this.commentLoading = true;
        
        try {
          const res = await uniCloud.callFunction({
            name: 'getTaskComments',
            data: {
              taskId: this.id,
              page,
              pageSize: this.pageSize,
              currentUserId: this.userInfo._id
            }
          });
          
          if (res.result && res.result.code === 0) {
            const { comments, total, hasMore } = res.result.data;
            
            if (page === 1) {
              // 第一页，替换数据
              this.comments = comments;
              this.currentPage = 1;
            } else {
              // 加载更多，追加数据
              this.comments = [...this.comments, ...comments];
            }
            
            this.hasMoreComments = hasMore;
            this.totalCommentCount = total;
          } else {
            uni.showToast({
              title: res.result?.message || '加载评论失败',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('加载评论失败:', error);
          uni.showToast({
            title: '加载评论失败',
            icon: 'none'
          });
        } finally {
          this.commentLoading = false;
        }
      },
      
      // 加载更多评论
      loadMoreComments() {
        if (this.hasMoreComments && !this.commentLoading) {
          this.loadComments(this.currentPage + 1);
        }
      },
      
      // 加载更多回复
      async loadMoreReplies(commentId, page = 1) {
        const paginationKey = `${commentId}_${page}`;
        if (this.replyPaginationMap.has(paginationKey)) {
          return this.replyPaginationMap.get(paginationKey);
        }
        
        try {
          const res = await uniCloud.callFunction({
            name: 'getMoreReplies',
            data: {
              taskId: this.id,
              parentId: commentId,
              page,
              pageSize: 10,
              currentUserId: this.userInfo._id
            }
          });
          
          if (res.result && res.result.code === 0) {
            const { replies, total, hasMore } = res.result.data;
            
            // 缓存结果
            this.replyPaginationMap.set(paginationKey, {
              replies,
              total,
              hasMore
            });
            
            return { replies, total, hasMore };
          } else {
            throw new Error(res.result?.message || '加载回复失败');
          }
        } catch (error) {
          console.error('加载回复失败:', error);
          uni.showToast({
            title: '加载回复失败',
            icon: 'none'
          });
          return { replies: [], total: 0, hasMore: false };
        }
      },
      
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
      
      // 展开回复
      async handleExpandReplies(commentId) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;
        
        // 标记为已展开
        this.$set(comment, 'expanded', true);
        
        // 如果已经有完整回复，直接展开
        if (comment.replies && comment.replies.length >= comment.reply_count) {
          return;
        }
        
        // 加载更多回复
        const { replies, hasMore } = await this.loadMoreReplies(commentId, 1);
        
        if (replies.length > 0) {
          // 合并回复
          const existingReplies = comment.replies || [];
          comment.replies = [...existingReplies, ...replies];
          comment.hasMoreReplies = hasMore;
        }
      },
      
      // 收起回复
      handleCollapseReplies(commentId) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;
        
        // 标记为未展开
        this.$set(comment, 'expanded', false);
        
        // 只保留前2条回复
        if (comment.replies && comment.replies.length > 2) {
          comment.replies = comment.replies.slice(0, 2);
          comment.hasMoreReplies = true;
        }
      },
      
      // 查找评论
      findCommentById(commentId) {
        const findInList = (commentList) => {
          for (const comment of commentList) {
            if (comment.id === commentId) {
              return comment;
            }
            if (comment.replies && comment.replies.length > 0) {
              const found = findInList(comment.replies);
              if (found) return found;
            }
          }
          return null;
        };
        
        return findInList(this.comments);
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
      
      async onCommentSubmit({ content, replyTo }) {
        if (!content.trim()) {
          uni.showToast({
            title: '请输入评论内容',
            icon: 'none'
          });
          return;
        }
        
        try {
          const res = await uniCloud.callFunction({
            name: 'addTaskComment',
            data: {
              taskId: this.id,
              content: content.trim(),
              pid: replyTo && replyTo.commentId ? replyTo.commentId : '0',
              targetName: replyTo && replyTo.commenterName ? replyTo.commenterName : null,
              currentUserId: this.userInfo._id,
              currentUserName: this.userInfo.nickname, // 实际应从用户系统获取
              currentUserAvatar: this.userInfo.avatar_file.url, // 实际应从用户系统获取
              taskOwnerId: this.task.user?.ownerUserId
            }
          });
          
          if (res.result && res.result.code === 0) {
            const newComment = res.result.data;
            
            if (!replyTo || !replyTo.commentId) {
              // 一级评论，添加到列表顶部
              this.comments.unshift(newComment);
            } else {
              // 回复评论，添加到对应父评论的回复中
              const parentComment = this.findCommentById(replyTo.commentId);
              if (parentComment) {
                if (!parentComment.replies) {
                  this.$set(parentComment, 'replies', []);
                }
                parentComment.replies.unshift(newComment);
                parentComment.reply_count = (parentComment.reply_count || 0) + 1;
              }
            }
            
            this.barInputValue = '';
            
            uni.showToast({
              title: '评论成功',
              icon: 'success'
            });
          } else {
            throw new Error(res.result?.message || '评论失败');
          }
        } catch (error) {
          console.error('评论失败:', error);
          uni.showToast({
            title: error.message || '评论失败',
            icon: 'none'
          });
        }
      },
      
      // 加载更多回复
      async handleLoadMoreReplies(commentId) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;
        
        // 设置加载状态
        this.$set(comment, 'loadingReplies', true);
        
        try {
          // 计算当前页码
          const currentPage = Math.floor((comment.replies?.length || 0) / 10) + 1;
          const { replies, hasMore } = await this.loadMoreReplies(commentId, currentPage);
          
          if (replies.length > 0) {
            // 合并回复
            const existingReplies = comment.replies || [];
            comment.replies = [...existingReplies, ...replies];
            comment.hasMoreReplies = hasMore;
          }
        } catch (error) {
          console.error('加载更多回复失败:', error);
          uni.showToast({
            title: '加载更多回复失败',
            icon: 'none'
          });
        } finally {
          this.$set(comment, 'loadingReplies', false);
        }
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
        ownerUserId: options.ownerUserId ? decodeURIComponent(options.ownerUserId) : '',
        ownerNickname: options.ownerNickname ? decodeURIComponent(options.ownerNickname) : '',
        ownerAvatarUrl: { url: options.ownerAvatarUrl ? decodeURIComponent(options.ownerAvatarUrl) : '' }
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
    Promise.all([
      // 刷新任务详情
      uniCloud.callFunction({
        name: 'getTaskDetail',
        data: { id: this.id }
      }),
      // 刷新评论列表
      this.loadComments(1)
    ]).then(([taskRes]) => {
      if (taskRes.result && taskRes.result.data) {
        // 保留本地 is_liked/like_count
        const { is_liked, like_count } = this.task;
        this.task = { ...this.task, ...taskRes.result.data, is_liked, like_count };
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
