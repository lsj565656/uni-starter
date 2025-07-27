<template>
  <view class="sign-in-progress-card">
    <view class="sign-in-header">
      <text class="title">签到赚积分</text>
      <text class="current-score">当前积分：{{ signInRes.score || 0 }}</text>
    </view>
    <view class="sign-in-days">
      <view
        v-for="i in 7"
        :key="i"
        class="day-item"
        :class="{ active: signInRes.days && signInRes.days.includes(i - 1) }"
      >
        <text>第{{ i }}天</text>
      </view>
    </view>
    <view class="sign-in-desc">
      <text>签到一次得10积分，连续签到7天可多得</text>
      <text class="highlight">50</text>
      <text>积分</text>
    </view>
    <button class="sign-in-btn" @click="$emit('signIn')">立即签到</button>
  </view>
</template>
<script>
export default {
  props: {
    signInRes: Object
  }
}
</script>
<style scoped>
.sign-in-progress-card {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  border-radius: 16px;
  margin: 24rpx;
  padding: 32rpx 24rpx;
  color: #fff;
  box-shadow: 0 2rpx 8rpx #f0f0f0;
}
.sign-in-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 32rpx;
  font-weight: bold;
}
.current-score {
  font-size: 28rpx;
}
.sign-in-days {
  display: flex;
  justify-content: space-between;
  margin: 24rpx 0;
}
.day-item {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.day-item.active {
  background: #fff;
  color: #ff9800;
  font-weight: bold;
}
.sign-in-desc {
  font-size: 24rpx;
  margin-bottom: 16rpx;
}
.highlight {
  color: #fff176;
  font-weight: bold;
  margin: 0 4rpx;
}
.sign-in-btn {
  background: #fff;
  color: #ff9800;
  border-radius: 24rpx;
  padding: 12rpx 0;
  font-size: 28rpx;
  margin-top: 8rpx;
}
</style>
