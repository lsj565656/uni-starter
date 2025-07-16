<template>
  <view class="point-center">
    <!-- 我的积分卡片 -->
    <view class="my-point-card">
      <view class="point-info">
        <text class="point-label">我的积分</text>
        <text class="point-value">{{ userInfo.score || 0 }}</text>
        <button class="point-detail-btn" @click="goDetail">明细</button>
      </view>
    </view>
    <!-- 开箱赢好礼区块 -->
    <view class="lottery-card">
      <view class="lottery-header">
        <text>开箱赢好礼</text>
        <text class="cost">100积分/次</text>
        <button class="go-btn" @click="goLottery">GO</button>
      </view>
      <PrizeCarousel :prizes="prizeList"/>
    </view>
    <!-- 签到赚积分区块（内嵌签到进度卡片） -->
    <SignInProgress ref="signInProgress" :signInRes="signInRes" @signIn="handleSignIn" />
    <!-- 精选任务区块 -->
    <view class="task-section">
      <view class="task-title">精选任务</view>
      <view class="task-list">
        <view class="task-item" v-for="task in taskList" :key="task.id">
          <text class="task-name">{{ task.name }}</text>
          <text class="task-reward">+{{ task.reward }}</text>
          <button class="task-btn" @click="doTask(task)">去{{ task.actionText }}</button>
        </view>
      </view>
    </view>
  </view>
</template>
<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import PrizeCarousel from './components/PrizeCarousel.vue'
import SignInProgress from './components/SignInProgress.vue'
export default {
  components: { PrizeCarousel, SignInProgress },
  data() {
    return {
      userInfo: store.userInfo,
      signInRes: {},
      prizeList: [
        { name: '加油卡', img: '/static/prize1.png' },
        { name: '毛绒玩具', img: '/static/prize2.png' },
        { name: '卡通手办', img: '/static/prize3.png' }
      ],
      taskList: [
        { id: 1, name: '观看广告', reward: 2, actionText: '观看' },
        { id: 2, name: '逛逛广场', reward: 8, actionText: '逛逛' },
        { id: 3, name: '分享任务', reward: 5, actionText: '分享' }
      ]
    }
  },
  methods: {
    goDetail() {
      uni.navigateTo({ url: '/pages/ucenter/point/detail' })
    },
    goLottery() {
      uni.navigateTo({ url: '/pages/ucenter/point/lottery' })
    },
    handleSignIn() {
      this.$refs.signInProgress.doSignIn && this.$refs.signInProgress.doSignIn()
    },
    doTask(task) {
      // 任务逻辑
    }
  }
}
</script>
<style scoped>
.point-center { background: #f8f8f8; min-height: 100vh; }
.my-point-card {
  background: #fbeee6;
  border-radius: 16px;
  margin: 24rpx 24rpx 0 24rpx;
  padding: 32rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.point-info { display: flex; align-items: center; }
.point-label { font-size: 32rpx; color: #888; }
.point-value { font-size: 48rpx; color: #ff9800; font-weight: bold; margin: 0 16rpx; }
.point-detail-btn { font-size: 24rpx; color: #1976d2; background: none; border: none; }
.lottery-card {
  background: #fff;
  border-radius: 16px;
  margin: 24rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx #f0f0f0;
}
.lottery-header { display: flex; align-items: center; justify-content: space-between; }
.cost { color: #ff9800; font-size: 24rpx; }
.go-btn { background: #ff9800; color: #fff; border-radius: 24rpx; padding: 8rpx 32rpx; }
.task-section { margin: 24rpx; }
.task-title { font-size: 32rpx; color: #333; margin-bottom: 16rpx; }
.task-list { display: flex; flex-direction: column; gap: 16rpx; }
.task-item { background: #fff; border-radius: 12rpx; padding: 16rpx; display: flex; align-items: center; justify-content: space-between; }
.task-name { font-size: 28rpx; color: #333; }
.task-reward { color: #ff9800; font-size: 28rpx; margin-left: 8rpx; }
.task-btn { background: #1976d2; color: #fff; border-radius: 16rpx; padding: 8rpx 24rpx; }
</style> 