<template>
  <view class="lottery-page">
    <LotteryGrid :prizes="prizeList" @start="handleStartLottery" :timesLeft="timesLeft"/>
    <view class="lottery-actions">
      <button class="rule-btn" @click="showRule">抽奖规则</button>
      <button class="myprize-btn" @click="showMyPrize">我的奖品</button>
    </view>
    <uni-popup ref="resultPopup" type="center">
      <view class="result-content">
        <text class="result-title">{{ resultTitle }}</text>
        <text class="result-desc">{{ resultDesc }}</text>
        <button @click="closeResult">知道了</button>
      </view>
    </uni-popup>
  </view>
</template>
<script>
import LotteryGrid from './components/LotteryGrid.vue'
export default {
  components: { LotteryGrid },
  data() {
    return {
      prizeList: [
        { name: '积分+200', img: '/static/prize1.png' },
        { name: '便民水卡', img: '/static/prize2.png' },
        { name: '积分+50', img: '/static/prize3.png' },
        { name: '卡通手办', img: '/static/prize4.png' },
        { name: '谢谢参与', img: '/static/prize5.png' },
        { name: '毛绒玩具', img: '/static/prize6.png' },
        { name: '加油卡', img: '/static/prize7.png' },
        { name: '谢谢参与', img: '/static/prize8.png' }
      ],
      timesLeft: 3,
      resultTitle: '',
      resultDesc: ''
    }
  },
  methods: {
    handleStartLottery() {
      this.resultTitle = '恭喜你！';
      this.resultDesc = '获得了积分+50';
      this.$refs.resultPopup.open();
    },
    showRule() {
      uni.showModal({ title: '抽奖规则', content: '每次消耗100积分...' })
    },
    showMyPrize() {
      uni.navigateTo({ url: '/pages/ucenter/point/myprize' })
    },
    closeResult() {
      this.$refs.resultPopup.close();
    }
  }
}
</script>
<style scoped>
.lottery-page { background: #f8f8f8; min-height: 100vh; padding: 32rpx 0; }
.lottery-actions { display: flex; justify-content: center; gap: 48rpx; margin-top: 32rpx; }
.rule-btn, .myprize-btn { background: #fff; color: #1976d2; border-radius: 16rpx; padding: 8rpx 32rpx; }
.result-content { background: #fff; border-radius: 16rpx; padding: 48rpx 32rpx; text-align: center; }
.result-title { font-size: 36rpx; color: #ff9800; font-weight: bold; }
.result-desc { font-size: 28rpx; color: #333; margin: 24rpx 0; }
</style> 