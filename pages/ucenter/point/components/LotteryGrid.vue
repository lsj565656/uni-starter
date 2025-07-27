<template>
  <view class="lottery-grid">
    <view class="grid-row" v-for="row in 3" :key="row">
      <view class="grid-cell" v-for="col in 3" :key="col">
        <template v-if="row === 2 && col === 2">
          <button class="start-btn" @click="$emit('start')">
            开始抽奖\n今日剩余{{ timesLeft }}次
          </button>
        </template>
        <template v-else>
          <view class="prize-cell">
            <image :src="prizes[(row - 1) * 3 + col - 1]?.img" class="prize-img" />
            <text class="prize-name">{{ prizes[(row - 1) * 3 + col - 1]?.name }}</text>
          </view>
        </template>
      </view>
    </view>
  </view>
</template>
<script>
export default {
  props: {
    prizes: Array,
    timesLeft: Number
  }
}
</script>
<style scoped>
.lottery-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.grid-row {
  display: flex;
}
.grid-cell {
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4rpx;
}
.prize-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.prize-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
}
.prize-name {
  font-size: 22rpx;
  color: #333;
  margin-top: 4rpx;
}
.start-btn {
  background: #ff9800;
  color: #fff;
  border-radius: 24rpx;
  padding: 16rpx 0;
  font-size: 28rpx;
  width: 160rpx;
  height: 160rpx;
}
</style>
