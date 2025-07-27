<template>
  <view class="detail-container">
    <view v-if="loginNoticeVisible" class="login-notice-bar" @click="handleLoginNoticeClick">
      去登录 &gt;
    </view>
    <!-- 顶部图片/视频轮播 -->
    <swiper class="detail-swiper" :indicator-dots="true" :autoplay="false" :circular="true">
      <swiper-item v-for="(item, idx) in task.media_detail" :key="item.url">
        <image
          v-if="item.type === 'image'"
          :src="item.url"
          class="detail-image"
          mode="aspectFill"
          @click="previewImage(idx)"
        />
        <view v-else class="detail-video-wrap" @click="openVideo(item.url, item.cover)">
          <image
            :src="item.cover || defaultVideoCover"
            class="detail-image video-cover"
            mode="aspectFill"
          />
        </view>
      </swiper-item>
    </swiper>
    <!-- 全屏video弹窗 -->
    <view v-if="showVideo" class="fullscreen-video">
      <video
        ref="detailVideoRef"
        :key="videoKey"
        :src="currentVideoUrl"
        class="fullscreen-video-player"
        :initial-time="initialTime"
        :controls="true"
        :autoplay="true"
        :loop="false"
        :muted="true"
        :page-gesture="true"
        :vslide-gesture="true"
        :show-center-play-btn="true"
        :enable-play-gesture="true"
        :show-loading="false"
        :show-mute-btn="true"
        :show-fullscreen-btn="false"
        :object-fit="'contain'"
        style="width: 100vw; height: 100vh; background: #000"
        @ended="onVideoEnded"
        @play="onVideoPlay"
      />
    </view>

    <!-- 积分/价格、已加入人数 -->
    <view class="detail-header-row">
      <view class="score">
        <uni-icons
          :type="task.mode === 'score' ? 'icon-jifen' : 'icon-renminbi'"
          custom-prefix="iconfont"
          color="#ff6600"
          size="22"
        />
        <text class="score-text">{{
          task.mode === 'score' ? task.score + ' 积分' : task.price + '元'
        }}</text>
      </view>
      <view class="joined">
        已加入 <text class="joined-num">{{ task.joined_count }}</text
        >/<text class="joined-max">{{ task.max_participants }}</text> 人
      </view>
    </view>

    <!-- 标签 -->
    <view class="category-tag">{{ task.category_name }}</view>

    <!-- 标题 -->
    <view class="task-title">{{ task.name }}</view>

    <!-- 地点、时间 -->
    <view class="task-meta">
      <uni-icons type="location" size="18" color="#ff6666" />
      <text class="meta-text">{{ (task.location_text || []).join('-') }}</text>
    </view>
    <view class="task-meta">
      <uni-icons type="calendar" size="18" color="#ff6666" />
      <text class="meta-text"
        >{{ formatTime(task.start_time) }} —— {{ formatTime(task.end_time) }}</text
      >
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
      :author-id="this.userInfo._id"
      :task-owner-id="this.task.user?._id"
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
          <uni-icons
            :type="task.is_liked ? 'heart-filled' : 'heart'"
            size="22"
            :color="task.is_liked ? 'red' : '#888'"
          />
          <text>{{ task.like_count }}</text>
        </view>
        <button class="join-btn" @click="onJoin">加入</button>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/tools.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { onBackPress } from '@dcloudio/uni-app'
import { toggleTaskLike } from '@/utils/taskLike.js'
import { useTaskLikeStore } from '@/store/taskLike.js'
export default {
  data() {
    return {
      id: '',
      task: {
        _id: '', // 主要用作往后传递 _id值 本页面使用 id 就行
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
          ownerUserId: '',
          ownerNickname: '',
          ownerAvatarUrl: { url: '' }
        },
        create_date: '',
        is_publisher_joined: false,
        is_liked: false,
        like_count: 0,
        media_detail: [], // 新增媒体详情
        members: [] // 任务 参与成员数组
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
      replyPaginationMap: new Map(),
      showVideo: false,
      currentVideoUrl: '',
      currentVideoCover: '',
      initialTime: 0,
      videoKey: 0,
      videoEnded: false,
      defaultVideoCover: '/static/icons/playCover.png',
      loginNoticeVisible: false,
      loginNoticeTimer: null
    }
  },
  watch: {
    comments: {
      handler(value) {
        this.totalCommentCount = this.calcTotalCommentCount(value)
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
    this.loadComments()
    // 拦截物理返回键，优先关闭视频弹窗
    onBackPress(e => {
      if (this.showVideo) {
        this.closeVideo()
        return true
      }
      return false
    })
  },
  methods: {
    formatTime,

    // 统一的登录校验方法
    showLoginNotice() {
      this.loginNoticeVisible = true
      if (this.loginNoticeTimer) clearTimeout(this.loginNoticeTimer)
      this.loginNoticeTimer = setTimeout(() => {
        this.loginNoticeVisible = false
      }, 3000)
    },
    handleLoginNoticeClick() {
      this.loginNoticeVisible = false
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
      })
    },
    checkLogin(actionName = '操作') {
      if (!this.userInfo || !this.userInfo._id) {
        this.showLoginNotice()
        return false
      }
      return true
    },

    // 加载评论列表
    async loadComments(page = 1) {
      if (this.commentLoading) return

      this.commentLoading = true

      try {
        const res = await uniCloud.callFunction({
          name: 'getTaskComments',
          data: {
            taskId: this.id,
            page,
            pageSize: this.pageSize,
            currentUserId: this.userInfo?._id || '' // 未登录时传空字符串
          }
        })

        if (res.result && res.result.code === 0) {
          const { comments, total, hasMore } = res.result.data

          if (page === 1) {
            // 第一页，替换数据
            this.comments = comments
            this.currentPage = 1
          } else {
            // 加载更多，追加数据
            this.comments = [...this.comments, ...comments]
          }

          this.hasMoreComments = hasMore
          this.totalCommentCount = total
        } else {
          uni.showToast({
            title: res.result?.message || '加载评论失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载评论失败:', error)
        uni.showToast({
          title: '加载评论失败',
          icon: 'none'
        })
      } finally {
        this.commentLoading = false
      }
    },

    // 加载更多评论
    loadMoreComments() {
      if (this.hasMoreComments && !this.commentLoading) {
        this.loadComments(this.currentPage + 1)
      }
    },

    // 加载更多回复
    async loadMoreReplies(commentId, page = 1) {
      const paginationKey = `${commentId}_${page}`
      if (this.replyPaginationMap.has(paginationKey)) {
        return this.replyPaginationMap.get(paginationKey)
      }

      try {
        const res = await uniCloud.callFunction({
          name: 'getMoreReplies',
          data: {
            taskId: this.id,
            parentId: commentId,
            page,
            pageSize: 10,
            currentUserId: this.userInfo?._id || '' // 未登录时传空字符串
          }
        })

        if (res.result && res.result.code === 0) {
          const { replies, total, hasMore } = res.result.data

          // 缓存结果
          this.replyPaginationMap.set(paginationKey, {
            replies,
            total,
            hasMore
          })

          return { replies, total, hasMore }
        } else {
          throw new Error(res.result?.message || '加载回复失败')
        }
      } catch (error) {
        console.error('加载回复失败:', error)
        uni.showToast({
          title: '加载回复失败',
          icon: 'none'
        })
        return { replies: [], total: 0, hasMore: false }
      }
    },

    onLike() {
      if (!this.checkLogin('点赞')) return

      const taskLikeStore = useTaskLikeStore()
      const oldLiked = this.task.is_liked
      const oldCount = this.task.like_count
      // 乐观UI
      this.task.is_liked = !oldLiked
      this.task.like_count = oldLiked ? oldCount - 1 : oldCount + 1
      // 立即同步 pinia store（乐观）
      taskLikeStore.setLike(this.id, this.task.is_liked, this.task.like_count, { ...this.task })
      toggleTaskLike(this.id, oldLiked)
        .then(({ isLiked, likeCount }) => {
          this.task.is_liked = isLiked
          this.task.like_count = likeCount
          // 再次同步 pinia store（以后端为准）
          taskLikeStore.setLike(this.id, isLiked, likeCount, { ...this.task })
        })
        .catch(error => {
          this.task.is_liked = oldLiked
          this.task.like_count = oldCount
          // 回滚 pinia store
          taskLikeStore.setLike(this.id, oldLiked, oldCount, { ...this.task })
          uni.showToast({ title: error.message || '操作失败', icon: 'none' })
        })
    },

    onJoin() {
      if (!this.checkLogin('加入任务')) return

      // 跳转到加入确认页，传递任务详情
      const taskParameter = encodeURIComponent(
        JSON.stringify({
          ...this.task
        })
      )
      uni.navigateTo({
        url: `/pages/task-confirm/task-confirm?task=${taskParameter}`
      })
    },

    fetchTaskDetail(id) {
      uniCloud
        .callFunction({
          name: 'getTaskDetail',
          data: { id }
        })
        .then(res => {
          if (res.result && res.result.data) {
            this.task = { ...this.task, ...res.result.data }
          }
        })
    },

    // 展开回复
    async handleExpandReplies(commentId) {
      const comment = this.findCommentById(commentId)
      if (!comment) return

      // 标记为已展开
      this.$set(comment, 'expanded', true)

      // 如果已经有完整回复，直接展开
      if (comment.replies && comment.replies.length >= comment.reply_count) {
        return
      }

      // 加载更多回复
      const { replies, hasMore } = await this.loadMoreReplies(commentId, 1)

      if (replies.length > 0) {
        // 合并回复
        const existingReplies = comment.replies || []
        comment.replies = [...existingReplies, ...replies]
        comment.hasMoreReplies = hasMore
      }
    },

    // 收起回复
    handleCollapseReplies(commentId) {
      const comment = this.findCommentById(commentId)
      if (!comment) return

      // 标记为未展开
      this.$set(comment, 'expanded', false)

      // 只保留前2条回复
      if (comment.replies && comment.replies.length > 2) {
        comment.replies = comment.replies.slice(0, 2)
        comment.hasMoreReplies = true
      }
    },

    // 查找评论
    findCommentById(commentId) {
      const findInList = commentList => {
        for (const comment of commentList) {
          if (comment.id === commentId) {
            return comment
          }
          if (comment.replies && comment.replies.length > 0) {
            const found = findInList(comment.replies)
            if (found) return found
          }
        }
        return null
      }

      return findInList(this.comments)
    },

    calcTotalCommentCount(comments) {
      let count = 0
      for (const c of comments) {
        count += 1
        if (c.replies && c.replies.length > 0) {
          count += this.calcTotalCommentCount(c.replies)
        }
      }
      return count
    },

    handleCommentLike(commentId) {
      if (!this.checkLogin('点赞')) return

      // 递归查找评论并处理点赞
      const findAndLikeComment = commentList => {
        for (const comment of commentList) {
          if (comment.id === commentId) {
            comment.is_liked = !comment.is_liked
            comment.like_count = (comment.like_count || 0) + (comment.is_liked ? 1 : -1)
            return true
          }

          // 递归查找子评论
          if (
            comment.replies &&
            comment.replies.length > 0 &&
            findAndLikeComment(comment.replies)
          ) {
            return true
          }
        }
        return false
      }

      findAndLikeComment(this.comments)
    },

    showCommentInputBar() {
      if (!this.checkLogin('评论')) return

      // 只需弹出输入框，v-model 会自动同步内容
      if (this.$refs.commentSection && this.$refs.commentSection.onReply) {
        this.$refs.commentSection.onReply({ id: '', commenter_name: '' })
      } else if (this.$refs.commentSection) {
        this.$refs.commentSection.showInputBar = true
      }
    },

    onCommentInputBlur(value) {
      this.barInputValue = value && value.trim() ? value : ''
    },

    async onCommentSubmit({ content, replyTo }) {
      if (!this.checkLogin('评论')) return

      if (!content.trim()) {
        uni.showToast({
          title: '请输入评论内容',
          icon: 'none'
        })
        return
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
            currentUserName: this.userInfo.nickname || '匿名用户', // 添加默认值
            currentUserAvatar: this.userInfo.avatar_file?.url || '/static/logo.png', // 添加安全访问和默认值
            taskOwnerId: this.task.user?._id // 修正为正确的用户ID字段
          }
        })

        if (res.result && res.result.code === 0) {
          const newComment = res.result.data

          if (!replyTo || !replyTo.commentId) {
            // 一级评论，添加到列表顶部
            this.comments.unshift(newComment)
          } else {
            // 回复评论，添加到对应父评论的回复中
            const parentComment = this.findCommentById(replyTo.commentId)
            if (parentComment) {
              if (!parentComment.replies) {
                this.$set(parentComment, 'replies', [])
              }
              parentComment.replies.unshift(newComment)
              parentComment.reply_count = (parentComment.reply_count || 0) + 1
            }
          }

          this.barInputValue = ''

          uni.showToast({
            title: '评论成功',
            icon: 'success'
          })
        } else {
          throw new Error(res.result?.message || '评论失败')
        }
      } catch (error) {
        console.error('评论失败:', error)
        uni.showToast({
          title: error.message || '评论失败',
          icon: 'none'
        })
      }
    },

    // 加载更多回复
    async handleLoadMoreReplies(commentId) {
      const comment = this.findCommentById(commentId)
      if (!comment) return

      // 设置加载状态
      this.$set(comment, 'loadingReplies', true)

      try {
        // 计算当前页码
        const currentPage = Math.floor((comment.replies?.length || 0) / 10) + 1
        const { replies, hasMore } = await this.loadMoreReplies(commentId, currentPage)

        if (replies.length > 0) {
          // 合并回复
          const existingReplies = comment.replies || []
          comment.replies = [...existingReplies, ...replies]
          comment.hasMoreReplies = hasMore
        }
      } catch (error) {
        console.error('加载更多回复失败:', error)
        uni.showToast({
          title: '加载更多回复失败',
          icon: 'none'
        })
      } finally {
        this.$set(comment, 'loadingReplies', false)
      }
    },

    previewImage(index) {
      // 只预览图片
      const imgs = (this.task.media_detail || []).filter(m => m.type === 'image').map(m => m.url)
      // idx 需转换为图片在图片数组中的下标
      const imgIndex =
        (this.task.media_detail || []).filter((m, index_) => m.type === 'image' && index_ <= index)
          .length - 1
      uni.previewImage({
        urls: imgs,
        current: imgs[imgIndex] || imgs[0]
      })
    },

    onVideoEnded() {
      // 记录视频已结束
      this.videoEnded = true
    },
    onVideoPlay() {
      // 如果上次是ended后又play，说明是重播按钮
      if (this.videoEnded) {
        this.initialTime = 0
        this.videoKey++
        this.videoEnded = false
      }
    },
    openVideo(url, cover) {
      this.currentVideoUrl = url
      this.currentVideoCover = cover || ''
      this.showVideo = true
      this.$nextTick(() => {
        // 自动播放并重置到0
        const video = this.$refs.detailVideoRef
        if (video && video[0]) {
          video[0].pause && video[0].pause()
          video[0].currentTime = 0
          video[0].load && video[0].load()
          setTimeout(() => {
            video[0].play && video[0].play()
          }, 100)
        }
      })
    },
    closeVideo() {
      this.showVideo = false
      // 重置播放进度
      const video = this.$refs.detailVideoRef
      if (video && video[0]) {
        video[0].pause && video[0].pause()
        video[0].currentTime = 0
        video[0].load && video[0].load()
      }
    }
  },
  onLoad(options) {
    if (options.id) this.id = options.id
    // 处理 is_publisher_joined 类型，确保为布尔值
    let isPublisherJoined = options.is_publisher_joined
    isPublisherJoined =
      typeof isPublisherJoined === 'string' ? isPublisherJoined === 'true' : !!isPublisherJoined
    this.task = {
      ...this.task,
      _id: options.id || '',
      name: options.name ? decodeURIComponent(options.name) : '',
      image: options.image ? decodeURIComponent(options.image) : '',
      description: options.description ? decodeURIComponent(options.description) : '',
      like_count: options.like_count ? Number(options.like_count) : 0,
      is_liked: options.is_liked == 1,
      joined_count: options.joined_count ? Number(options.joined_count) : 0,
      max_participants: options.max_participants ? Number(options.max_participants) : 1,
      user: options.user && options.user !== 'undefined' ? JSON.parse(decodeURIComponent(options.user)) : {},
      score: options.score ? Number(options.score) : 0,
      price: options.price ? Number(options.price) : 0,
      mode: options.mode ? options.mode : 'score',
      location: options.location ? decodeURIComponent(options.location) : '',
      start_time: options.start_time ? Number(options.start_time) : '',
      end_time: options.end_time ? Number(options.end_time) : '',
      create_date: options.create_date ? Number(options.create_date) : '',
      category_name: options.category_name ? decodeURIComponent(options.category_name) : '',
      media_detail: options.media_detail
        ? JSON.parse(decodeURIComponent(options.media_detail))
        : [], // 解析媒体详情
      is_publisher_joined: isPublisherJoined,
      // 新增：解析location_text
      location_text: options.location_text
        ? JSON.parse(decodeURIComponent(options.location_text))
        : [],
      members: options.members ? JSON.parse(decodeURIComponent(options.members)) : []
      // 可继续加其它字段
    }

    console.log('this.task onLoad detail.vue', this.task)
  },
  onPullDownRefresh() {
    if (!this.id) return
    Promise.all([
      // 刷新任务详情
      uniCloud.callFunction({
        name: 'getTaskDetail',
        data: { id: this.id }
      }),
      // 刷新评论列表
      this.loadComments(1)
    ])
      .then(([taskRes]) => {
        if (taskRes.result && taskRes.result.data) {
          // 保留本地 is_liked/like_count
          const { is_liked, like_count } = this.task
          this.task = { ...this.task, ...taskRes.result.data, is_liked, like_count }
        }
        uni.stopPullDownRefresh()
      })
      .catch(() => {
        uni.stopPullDownRefresh()
      })
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #fff;
  padding-top: var(--status-bar-height, 0px);
  padding-bottom: 70px;
}
.detail-swiper {
  width: 100vw;
  height: 320px;
}
.detail-image {
  width: 100vw;
  height: 320px;
  object-fit: cover;
}
.video-cover {
  width: 100vw;
  height: 320px;
  background-color: #eee;
}
.detail-video-wrap {
  width: 100vw;
  height: 320px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.fullscreen-video {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fullscreen-video-player {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  background: #000;
}

.close-video-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.close-x {
  width: 18px;
  height: 18px;
  position: relative;
}
.close-x::before,
.close-x::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  width: 2px;
  height: 18px;
  background: #fff;
  border-radius: 1px;
}
.close-x::before {
  transform: rotate(45deg);
}
.close-x::after {
  transform: rotate(-45deg);
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
  left: 0;
  right: 0;
  bottom: 0;
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
.login-notice-bar {
  margin-top: 50px !important;
  top: var(--status-bar-height, 0px) !important;
}
</style>
