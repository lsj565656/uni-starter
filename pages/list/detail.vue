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
      :comments="comments"
      :total-count="totalCommentCount"
      :author-id="currentUserId"
      :task-owner-id="taskOwnerId"
      @submit="handleCommentSubmit"
      @like="handleCommentLike"
      @expand-replies="handleExpandReplies"
      @collapse-replies="handleCollapseReplies"
    />

		<!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bar-left">
        <button class="bar-btn" @click="onLike">
          <uni-icons :type="task.is_liked ? 'heart-filled' : 'heart'" size="22" :color="task.is_liked ? 'red' : '#888'" />
          <text>{{ task.like_count }}</text>
        </button>
        <button class="bar-btn" @click="onComment">
          <uni-icons type="chat" size="22" color="#888" />
          <text>{{ comments.length }}</text>
				</button>
			</view>
      <view class="bar-right">
        <button class="join-btn" @click="onJoin">立即加入</button>
					</view>
			</view>
	</view>
</template>

<script>
import { formatTime } from '@/utils/tools.js';

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
      currentUserId: 'u1',
      taskOwnerId: 'u2',
      allRepliesMap: {
        c100: [
          {
            id: 'c101', pid: 'c100', task_id: 't1', content: '确实有点难，不过有挑战才有收获！', createdAt: 1720000011000,
            commenter_id: 'u5', commenter_name: '小刚', commenter_avatar: '/static/avatar5.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 1, is_liked: false
          },
          {
            id: 'c102', pid: 'c100', task_id: 't1', content: '我觉得还好，大家一起加油！', createdAt: 1720000012000,
            commenter_id: 'u6', commenter_name: '小雨', commenter_avatar: '/static/avatar6.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c103', pid: 'c100', task_id: 't1', content: '我来围观一下，哈哈！', createdAt: 1720000013000,
            commenter_id: 'u7', commenter_name: '小王', commenter_avatar: '/static/avatar7.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c104', pid: 'c100', task_id: 't1', content: '有难度才有意思！', createdAt: 1720000014000,
            commenter_id: 'u8', commenter_name: '小美', commenter_avatar: '/static/avatar8.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c105', pid: 'c100', task_id: 't1', content: '我支持你！', createdAt: 1720000015000,
            commenter_id: 'u9', commenter_name: '小志', commenter_avatar: '/static/avatar9.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c106', pid: 'c100', task_id: 't1', content: '加油加油！', createdAt: 1720000016000,
            commenter_id: 'u10', commenter_name: '小芳', commenter_avatar: '/static/avatar10.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c107', pid: 'c100', task_id: 't1', content: '我也来试试！', createdAt: 1720000017000,
            commenter_id: 'u11', commenter_name: '小亮', commenter_avatar: '/static/avatar11.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          },
          {
            id: 'c108', pid: 'c100', task_id: 't1', content: '大家一起努力！', createdAt: 1720000018000,
            commenter_id: 'u12', commenter_name: '小翠', commenter_avatar: '/static/avatar12.png',
            target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
          }
        ]
      },
      totalCommentCount: 0
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
    handleCommentSubmit({ content, replyTo }) {
      if (!content.trim()) return
      const now = Date.now()
      const newComment = {
        id: 'c' + now,
        pid: '0',
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
      }
      if (!replyTo) {
        // 一级评论
        this.comments.unshift(newComment)
      } else {
        // 回复
        const parentIdx = this.comments.findIndex(c => c.id === replyTo.commentId)
        if (parentIdx !== -1) {
          // 回复主评论
          newComment.pid = this.comments[parentIdx].id
          if (!this.comments[parentIdx].replies) this.$set(this.comments[parentIdx], 'replies', [])
          this.comments[parentIdx].replies.push(newComment)
          this.comments[parentIdx].reply_count += 1
				} else {
          // 回复子评论（只支持2级，主流App做法）
          for (const c of this.comments) {
            const replyIdx = c.replies?.findIndex(r => r.id === replyTo.commentId)
            if (replyIdx !== -1) {
              newComment.pid = c.id
              newComment.target_id = c.replies[replyIdx].commenter_id
              newComment.target_name = c.replies[replyIdx].commenter_name
              newComment.target_avatar = c.replies[replyIdx].commenter_avatar
              c.replies.push(newComment)
              c.reply_count += 1
              break
            }
          }
        }
      }
    },
    handleCommentLike(commentId) {
      // 先找主评论
      let found = false
      for (const c of this.comments) {
        if (c.id === commentId) {
          c.is_liked = !c.is_liked
          c.like_count += c.is_liked ? 1 : -1
          found = true
          break
        }
        // 再找子评论
        if (c.replies && c.replies.length) {
          const r = c.replies.find(r => r.id === commentId)
          if (r) {
            r.is_liked = !r.is_liked
            r.like_count += r.is_liked ? 1 : -1
            found = true
            break
          }
        }
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
    // 初始化评论，只给前2条replies
    this.comments = [
      {
        id: 'c1', pid: '0', task_id: 't1', content: '任务很棒，已加入！', createdAt: 1720000000000,
        commenter_id: 'u1', commenter_name: '小明', commenter_avatar: '/static/avatar1.png', like_count: 2, is_liked: false,
        replies: [
          {
            id: 'c2', pid: 'c1', task_id: 't1', content: '谢谢支持！', createdAt: 1720000001000,
            commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_id: 'u1', target_name: '小明', target_avatar: '/static/avatar1.png', like_count: 1, is_liked: true
          },
          {
            id: 'c3', pid: 'c1', task_id: 't1', content: '我也加入了！', createdAt: 1720000002000,
            commenter_id: 'u3', commenter_name: '小红', commenter_avatar: '/static/avatar3.png', target_id: 'u1', target_name: '小明', target_avatar: '/static/avatar1.png', like_count: 0, is_liked: false
          }
        ],
        reply_count: 2
      },
      {
        id: 'c4', pid: '0', task_id: 't1', content: '请问几点开始？', createdAt: 1720000003000,
        commenter_id: 'u3', commenter_name: '小红', commenter_avatar: '/static/avatar3.png', like_count: 0, is_liked: false,
        replies: [
          {
            id: 'c5', pid: 'c4', task_id: 't1', content: '明天早上8点哦', createdAt: 1720000004000,
            commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_id: 'u3', target_name: '小红', target_avatar: '/static/avatar3.png', like_count: 0, is_liked: false
          }
        ],
        reply_count: 1
      },
      {
        id: 'c100', pid: '0', task_id: 't1', content: '这个任务有点难度，大家怎么看？', createdAt: 1720000010000,
        commenter_id: 'u4', commenter_name: '大壮', commenter_avatar: '/static/avatar4.png', like_count: 5, is_liked: false,
        replies: this.allRepliesMap.c100.slice(0, 2),
        reply_count: 8
      }
    ]
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

// 假设 task_owner_id = 'u2'（作者猫）
export const mockComments = [
  {
    id: 'c1',
    pid: '0',
    task_id: 't1',
    content: '任务很棒，已加入！',
    createdAt: 1720000000000,
    commenter_id: 'u1',
    commenter_name: '小明',
    commenter_avatar: '/static/avatar1.png',
    like_count: 2,
    is_liked: false,
    replies: [
      {
        id: 'c2',
        pid: 'c1',
        task_id: 't1',
        content: '谢谢支持！',
        createdAt: 1720000001000,
        commenter_id: 'u2',
        commenter_name: '作者猫',
        commenter_avatar: '/static/avatar2.png',
        target_id: 'u1',
        target_name: '小明',
        target_avatar: '/static/avatar1.png',
        like_count: 1,
        is_liked: true
      },
      {
        id: 'c3',
        pid: 'c1',
        task_id: 't1',
        content: '我也加入了！',
        createdAt: 1720000002000,
        commenter_id: 'u3',
        commenter_name: '小红',
        commenter_avatar: '/static/avatar3.png',
        target_id: 'u1',
        target_name: '小明',
        target_avatar: '/static/avatar1.png',
        like_count: 0,
        is_liked: false
      }
    ],
    reply_count: 2
  },
  {
    id: 'c4',
    pid: '0',
    task_id: 't1',
    content: '请问几点开始？',
    createdAt: 1720000003000,
    commenter_id: 'u3',
    commenter_name: '小红',
    commenter_avatar: '/static/avatar3.png',
    like_count: 0,
    is_liked: false,
    replies: [
      {
        id: 'c5',
        pid: 'c4',
        task_id: 't1',
        content: '明天早上8点哦',
        createdAt: 1720000004000,
        commenter_id: 'u2',
        commenter_name: '作者猫',
        commenter_avatar: '/static/avatar2.png',
        target_id: 'u3',
        target_name: '小红',
        target_avatar: '/static/avatar3.png',
        like_count: 0,
        is_liked: false
      }
    ],
    reply_count: 1
  },
  // 重点：一条有很多子评论的主评论
  {
    id: 'c100',
    pid: '0',
    task_id: 't1',
    content: '这个任务有点难度，大家怎么看？',
    createdAt: 1720000010000,
    commenter_id: 'u4',
    commenter_name: '大壮',
    commenter_avatar: '/static/avatar4.png',
    like_count: 5,
    is_liked: false,
    replies: [
      {
        id: 'c101',
        pid: 'c100',
        task_id: 't1',
        content: '确实有点难，不过有挑战才有收获！',
        createdAt: 1720000011000,
        commenter_id: 'u5',
        commenter_name: '小刚',
        commenter_avatar: '/static/avatar5.png',
        target_id: 'u4',
        target_name: '大壮',
        target_avatar: '/static/avatar4.png',
        like_count: 1,
        is_liked: false
      },
      {
        id: 'c102',
        pid: 'c100',
        task_id: 't1',
        content: '我觉得还好，大家一起加油！',
        createdAt: 1720000012000,
        commenter_id: 'u6',
        commenter_name: '小雨',
        commenter_avatar: '/static/avatar6.png',
        target_id: 'u4',
        target_name: '大壮',
        target_avatar: '/static/avatar4.png',
        like_count: 0,
        is_liked: false
      }
      // ...假设后端只返回2条，实际有8条
    ],
    reply_count: 8 // 实际有8条回复
  }
]
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
  justify-content: space-between;
  align-items: center;
	background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 12px;
  z-index: 100;
}
.bar-left {
		display: flex;
		align-items: center;
}
.bar-btn {
  background: none;
  border: none;
  margin-right: 18px;
  display: flex;
  align-items: center;
  font-size: 16px;
}
.bar-btn text {
  margin-left: 4px;
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
  border-radius: 20px;
  padding: 8px 28px;
  font-size: 16px;
  font-weight: 600;
}
</style>
