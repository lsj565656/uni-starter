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
      <text class="meta-text">{{ formatTime(task.start_time) }} — {{ formatTime(task.end_time) }}</text>
    </view>

    <!-- 描述 -->
    <view class="task-desc">{{ task.description }}</view>

    <!-- 发布者 -->
    <view class="task-publisher">
      <image class="publisher-avatar" :src="task.user?.avatar_file?.url || '/static/logo.png'" />
      <text class="publisher-nickname">{{ task.user?.nickname }}</text>
      <text class="publisher-date">发布于{{ formatTime(task.create_date) }}</text>
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
      }
    }
  },
  methods: {
    formatTime,
    fetchTaskDetail(id) {
      uniCloud.callFunction({
        name: 'getTaskDetail',
        data: { id }
      }).then(res => {
        if (res.result && res.result.data) {
          this.task = { ...this.task, ...res.result.data };
        }
      });
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
  padding-bottom: 16px;
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
</style>
