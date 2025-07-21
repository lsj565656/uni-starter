<template>
  <view class="confirm-container">
    <!-- 头部返回与标题 -->
    <!-- <uni-nav-bar left-icon="left" title="加入任务确认" fixed @clickLeft="goBack" /> -->
    <view class="task-card">
      <view class="task-title">{{ task.name }}</view>
      <view class="task-meta-row">
        <uni-icons type="calendar" size="18" color="#ff9800" />
        <text class="meta-text">{{ formatTime(task.start_time) }} ~ {{ formatTime(task.end_time) }}</text>
      </view>
      <view class="task-meta-row">
        <uni-icons type="location" size="18" color="#ff9800" />
        <text class="meta-text">{{ (task.location_text || []).join('-') || '未填写' }}</text>
      </view>
      <view class="task-meta-row">
        <uni-icons :type="task.mode === 'score' ? 'icon-jifen' : 'icon-renminbi'" custom-prefix="iconfont" color="#ff6600" size="18" />
        <text class="meta-text">{{ task.mode === 'score' ? task.score + ' 积分' : task.price + '元' }}</text>
      </view>
      <view class="task-desc">{{ task.description || '暂无任务描述' }}</view>
      <view class="publisher-join-info">
        <uni-icons type="person" size="16" color="#1976d2" />
        <text class="publisher-text">发布者{{ isPublisherJoined ? '已加入任务' : '未加入任务' }}</text>
      </view>
    </view>
    <view class="member-avatars">
      <view v-for="(user, idx) in displayMembers" :key="user._id || idx" class="avatar-wrap" :style="{ left: idx * 24 + 'px', zIndex: 100 - idx }">
        <image :src="user.avatar && user.avatar !== '' ? user.avatar : defaultAvatar" class="avatar-img" @error="onAvatarError($event, idx)" />
        <view v-if="idx === 0" class="avatar-label">发布者</view>
      </view>
      <view v-if="moreMemberCount > 0" class="avatar-more" :style="{ left: displayMembers.length * 24 + 'px' }">+{{ moreMemberCount }}</view>
    </view>
    <view class="member-count">共 {{ task.joined_count }}/{{ task.max_participants }} 人已加入</view>
    <view class="reward-section">
      <uni-icons type="gift" size="20" color="#ff9800" />
      <text class="reward-text">完成任务可获得 <text class="reward-value">{{ task.mode === 'score' ? task.score + ' 积分' : task.price + '元' }}</text></text>
    </view>
    <view class="rules-section">
      <view class="rules-title">任务细则</view>
      <view class="rules-list">
        <slot name="rules">
          <view class="rule-item">1. 加入后，任务开始前30分钟内退出，将扣除 <text class="rule-highlight">{{ penaltyText }}</text>，由平台暂扣，任务正常结束后退还。</view>
          <view class="rule-item">2. 任务开始后不可退出，未完成任务将无法获得奖励。</view>
          <view class="rule-item">3. 请准时参与任务，遵守平台规则。</view>
          <view class="rule-item">4. <text class="rule-highlight">发布者加入任务不暂扣担保积分</text>，普通成员加入需暂扣担保积分，任务结束后返还。</view>
        </slot>
      </view>
      <view class="rules-tip">如有疑问请联系客服或查阅平台帮助中心。</view>
    </view>
    <view class="bottom-bar">
      <button class="confirm-btn" type="primary"
        @click="onConfirmJoin"
        :loading="joining"
        :disabled="joinDisabled"
      >
        {{ joinBtnText }}
      </button>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/tools.js';
import { store } from '@/uni_modules/uni-id-pages/common/store.js';
import { fetchUserScore } from '@/utils/user.js'
export default {
  data() {
    return {
      task: {
        _id: '',
        name: '',
        start_time: '',
        end_time: '',
        location_text: [],
        mode: 'score',
        score: 0,
        price: 0,
        joined_count: 0,
        max_participants: 1,
        description: '',
        user: {
          ownerAvatarUrl: '',
          ownerNickname: '',
          ownerUserId: ''
        },
        // members: [{_id, avatar, nickname}]
        members: [],
        // 当前任务发布者是否已加入
        is_publisher_joined: false
      },
      defaultAvatar: '/static/logo.png',
      joining: false,
      userInfo: {},
      userScore: 0 // 当前用户积分
    }
  },
  computed: {
    displayMembers() {
      // 发布者+前4个加入者
      const arr = [];
      if (this.task.user) arr.push({
        _id: this.task.user._id,
        avatar: this.task.user.avatar_file?.url || this.defaultAvatar,
        nickname: this.task.user.nickname || '发布者'
      });
      (this.task.members || []).slice(0, 4).forEach(m => arr.push({ ...m, avatar: m.avatar || this.defaultAvatar }));
      return arr;
    },
    moreMemberCount() {
      return Math.max(0, (this.task.members?.length || 0) - 4);
    },
    penaltyText() {
      if (this.task.mode === 'score') {
        // 积分四舍五入向上取整
        return Math.ceil(this.task.score * 0.5) + ' 积分';
      } else {
        // 金额不做四舍五入
        return (this.task.price * 0.5).toFixed(2) + '元';
      }
    },
    isPublisher() {
      // 当前用户是否为发布者
      return this.userInfo._id && (this.userInfo._id === this.task.user?._id);
    },
    isPublisherJoined() {
      // 发布者是否已加入
      return !!this.task.is_publisher_joined;
    },
    hasJoined() {
      // 当前用户是否已加入
      return (this.task.members || []).some(m => m._id === this.userInfo._id);
    },
    joinDisabled() {
      if (this.isPublisher && this.isPublisherJoined) return true;
      if (this.hasJoined) return true;
      if (!this.isPublisher && this.task.mode === 'score' && this.userScore < Math.ceil(this.task.score * 0.5)) return true;
      return this.joining;
    },
    joinBtnText() {
      if (this.isPublisher && this.isPublisherJoined) return '你已加入自己的任务';
      if (this.hasJoined) return '你已加入该任务';
      if (!this.isPublisher && this.task.mode === 'score' && this.userScore < Math.ceil(this.task.score * 0.5)) return '积分不足，无法加入';
      return this.joining ? '正在加入...' : '确认加入';
    }
  },
  methods: {
    formatTime,
    goBack() {
      uni.navigateBack();
    },
    async onConfirmJoin() {
      if (this.joinDisabled) return;
      console.log('onConfirmJoin this.task._id', this.task._id)
      this.joining = true;
      try {
        // 只在非发布者时才调用云函数扣积分
        if (!this.isPublisher) {
          const res = await uniCloud.callFunction({
            name: 'joinTask',
            data: { taskId: this.task._id }
          });
          if (res.result && res.result.code === 0) {
            uni.showToast({ title: '加入成功', icon: 'success' });
            // 加入成功后，刷新本地积分
            this.userScore = await fetchUserScore();
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/list/detail?id=' + this.task._id });
            }, 800);
          } else {
            throw new Error(res.result?.message || '加入失败');
          }
        } else {
          // 发布者加入：需要更新任务表的加入人数和 is_publisher_joined 字段
          const res = await uniCloud.callFunction({
            name: 'joinTask',
            data: { taskId: this.task._id, isPublisher: true }
          });
          if (res.result && res.result.code === 0) {
            uni.showToast({ title: '加入成功', icon: 'success' });
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/list/detail?id=' + this.task._id });
            }, 800);
          } else {
            throw new Error(res.result?.message || '加入失败');
          }
        }
      } catch (e) {
        uni.showToast({ title: e.message || '加入失败', icon: 'none' });
      } finally {
        this.joining = false;
      }
    },
    onAvatarError(e, idx) {
      if (this.displayMembers[idx]) {
        this.displayMembers[idx].avatar = this.defaultAvatar;
      }
    },
    fetchUserInfo() {
      // 只用本地缓存的积分
      this.userInfo = store.userInfo || {};
      this.userScore = this.userInfo.score || 0;
    }
  },
  onLoad(options) {
    if (options.task) {
      try {
        this.task = JSON.parse(decodeURIComponent(options.task));
      } catch (e) {}
    }
    // 只用本地缓存
    this.userInfo = store.userInfo || {};
    this.userScore = this.userInfo.score || 0;
    console.log('task-confirm onLoad this.userInfo.score:',this.userInfo.score)
  }
}
</script>

<style scoped>
.confirm-container {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 80px;
}
.task-card {
  background: #fff;
  margin: 16px 16px 0 16px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 18px 16px 12px 16px;
}
.task-title {
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin-bottom: 10px;
}
.task-meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: #888;
  font-size: 15px;
}
.meta-text {
  margin-left: 6px;
}
.task-desc {
  margin: 12px 0 0 0;
  font-size: 15px;
  color: #444;
  line-height: 1.7;
}
.publisher-join-info {
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #1976d2;
}
.publisher-text {
  margin-left: 4px;
}
.member-avatars {
  position: relative;
  height: 48px;
  margin: 18px 16px 0 16px;
  display: flex;
  align-items: center;
}
.avatar-wrap {
  position: absolute;
  top: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: visible;
  background: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #fff;
  object-fit: cover;
  background: #eee;
}
.avatar-label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #1976d2;
  background: #e3f2fd;
  border-radius: 8px;
  padding: 1px 6px;
  white-space: nowrap;
}
.avatar-more {
  position: absolute;
  top: 0;
  width: 44px;
  height: 44px;
  left: 0;
  background: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #888;
  border: 2px solid #fff;
  z-index: 1;
}
.member-count {
  margin: 0 16px 0 16px;
  color: #888;
  font-size: 14px;
  margin-top: 48px;
}
.reward-section {
  display: flex;
  align-items: center;
  margin: 18px 16px 0 16px;
  font-size: 16px;
  color: #ff9800;
}
.reward-text {
  margin-left: 6px;
}
.reward-value {
  font-weight: bold;
  color: #ff6600;
}
.rules-section {
  background: #fff;
  margin: 18px 16px 0 16px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 16px 16px 12px 16px;
  position: relative;
}
.rules-title {
  font-size: 16px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 8px;
}
.rules-list {
  font-size: 14px;
  color: #444;
}
.rule-item {
  margin-bottom: 8px;
  line-height: 1.7;
}
.rule-highlight {
  color: #ff6600;
  font-weight: bold;
}
.rules-tip {
  font-size: 12px;
  color: #aaa;
  margin-top: 8px;
  text-align: right;
}
.bottom-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 12px 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-btn {
  width: 90%;
  height: 44px;
  border-radius: 22px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #ff9800, #ffc107);
  color: #fff;
  border: none;
  box-shadow: 0 4px 16px rgba(255,152,0,0.12);
  transition: background 0.2s;
}
.confirm-btn:active {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}
</style> 