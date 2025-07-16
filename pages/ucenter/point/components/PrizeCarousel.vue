<template>
  <swiper class="prize-carousel" :indicator-dots="true" :autoplay="true" :interval="3000">
    <swiper-item v-for="(prize, idx) in prizes" :key="idx">
      <view class="prize-item">
        <image :src="prize.img" class="prize-img"/>
        <text class="prize-name">{{ prize.name }}</text>
      </view>
    </swiper-item>
  </swiper>
</template>
<script>
export default {
  props: { prizes: Array }
}
</script>
<style scoped>
.prize-carousel { height: 180rpx; }
.prize-item { display: flex; flex-direction: column; align-items: center; }
.prize-img { width: 120rpx; height: 120rpx; border-radius: 16rpx; }
.prize-name { font-size: 24rpx; color: #333; margin-top: 8rpx; }
</style> 