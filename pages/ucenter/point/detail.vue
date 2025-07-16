<template>
  <view class="point-detail">
    <view class="point-header">
      <text class="point-total">{{ userInfo.score || 0 }}</text>
      <text class="point-label">积分</text>
    </view>
    <view class="tab-bar">
      <text :class="{active: tab==='all'}" @click="tab='all'">全部</text>
      <text :class="{active: tab==='get'}" @click="tab='get'">已获取</text>
      <text :class="{active: tab==='cost'}" @click="tab='cost'">已消耗</text>
    </view>
    <scroll-view class="detail-list" scroll-y>
      <view class="detail-item" v-for="item in filteredList" :key="item.id">
        <text class="desc">{{ item.desc }}</text>
        <text :class="['score', item.score>0?'plus':'minus']">{{ item.score>0?'+':'' }}{{ item.score }}</text>
        <text class="time">{{ item.time }}</text>
      </view>
    </scroll-view>
  </view>
</template>
<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
export default {
  data() {
    return {
      userInfo: store.userInfo,
      tab: 'all',
      detailList: [
        { id: 1, desc: '每日签到奖励', score: 6, time: '2025-04-02 21:24' },
        { id: 2, desc: '逛逛广场奖励', score: 8, time: '2025-04-01 14:19' },
        { id: 3, desc: '积分抽奖消耗100积分', score: -100, time: '2025-04-01 14:02' },
      ]
    }
  },
  computed: {
    filteredList() {
      if(this.tab==='all') return this.detailList
      if(this.tab==='get') return this.detailList.filter(i=>i.score>0)
      if(this.tab==='cost') return this.detailList.filter(i=>i.score<0)
    }
  }
}
</script>
<style scoped>
.point-detail { background: #f8f8f8; min-height: 100vh; }
.point-header { display: flex; align-items: baseline; justify-content: center; margin: 32rpx 0 24rpx 0; }
.point-total { font-size: 56rpx; color: #ff9800; font-weight: bold; }
.point-label { font-size: 28rpx; color: #888; margin-left: 8rpx; }
.tab-bar { display: flex; justify-content: center; gap: 48rpx; margin-bottom: 24rpx; }
.tab-bar text { font-size: 28rpx; color: #888; padding: 8rpx 0; }
.tab-bar .active { color: #1976d2; border-bottom: 4rpx solid #1976d2; }
.detail-list { padding: 0 24rpx; }
.detail-item { background: #fff; border-radius: 12rpx; margin-bottom: 16rpx; padding: 20rpx 16rpx; display: flex; align-items: center; justify-content: space-between; }
.desc { font-size: 28rpx; color: #333; }
.score { font-size: 28rpx; font-weight: bold; }
.plus { color: #4caf50; }
.minus { color: #f44336; }
.time { font-size: 22rpx; color: #bbb; margin-left: 16rpx; }
</style> 