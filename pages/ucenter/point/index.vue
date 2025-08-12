<template>
  <view class="point-center">
    <!-- 我的积分卡片 -->
    <view class="my-point-card">
      <view>
        <text class="point-label">我的积分</text>
        <text class="point-value">{{ userScore }}</text>
      </view>
      <button class="point-detail-btn" @click="goDetail">明细</button>
    </view>
    
    <!-- 开箱赢好礼区块 -->
    <view class="lottery-card">
      <view class="lottery-header">
        <text>开箱赢好礼</text>
        <text class="cost">100积分/次</text>
        <button class="point-detail-btn" @click="goLottery">GO</button>
      </view>
      <!-- 奖品轮播图 -->
      <swiper class="swiper-box" @change="onSwiperChange" :indicator-dots="true" :circular="true" indicator-color="#ccc" indicator-active-color="#ff9800">
        <swiper-item v-for="(page, pageIndex) in prizePages" :key="pageIndex">
          <uni-grid :column="3" :show-border="false" :square="false" :highlight="false" class="prize-grid">
            <uni-grid-item v-for="(item, index) in page" :key="index" :index="index">
              <view class="prize-item">
                <image :src="item.img" class="prize-img" mode="aspectFit" />
                <text class="prize-name">{{ item.name }}</text>
              </view>
            </uni-grid-item>
          </uni-grid>
        </swiper-item>
      </swiper>
    </view>
    
    <!-- 签到赚积分区块 -->
    <view class="sign-in-section">
      <view class="sign-in-header">
        <text class="sign-in-title">签到赚积分</text>
        <text class="sign-in-desc">连续签到奖励更多</text>
      </view>
      <view class="sign-in-grid">
        <view 
          class="sign-in-day" 
          v-for="(day, index) in 7" 
          :key="index"
          :class="{ 
            'signed': signInData.days.includes(index), 
            'today': index === signInData.n - 1 && !todaySigned 
          }"
        >
          <text class="day-num">{{ index + 1 }}</text>
          <text class="day-reward">+{{ getDayReward(index + 1) }}</text>
        </view>
      </view>
      <view class="sign-in-actions">
        <button 
          class="sign-in-btn" 
          :class="{ 'signed': todaySigned }"
          @click="handleSignIn"
          :disabled="todaySigned"
        >
          {{ todaySigned ? '已签到' : '立即签到' }}
        </button>
      </view>
    </view>
    
    <!-- 精选任务区块 -->
    <view class="task-section">
      <uni-section type="line" class="section-title" title="精选任务" sub-title="每日更新"></uni-section>
      <view class="task-list">
        <view class="task-item" v-for="task in taskList" :key="task.id">
          <view>
            <text class="task-name">{{ task.name }}</text>
            <text class="task-reward">+{{ task.reward }}</text>
          </view>
          <button class="point-detail-btn" @click="doTask(task)">去{{ task.actionText }}</button>
        </view>
      </view>
    </view>
    
    <!-- 集成签到弹窗 -->
    <uni-sign-in ref="signIn" @signInSuccess="onSignInSuccess"></uni-sign-in>
  </view>
</template>
<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import UniSignIn from '@/uni_modules/uni-sign-in/components/uni-sign-in/uni-sign-in.vue'

export default {
  components: {
    'uni-sign-in': UniSignIn
  },
  data() {
    return {
      userScore: 0,
      currentPrizeIndex: 0,
      todaySigned: false,
      signInData: {
        days: [], // 已签到的天数 [0,1,2,3,4,5,6] 对应第1-7天
        n: 0,    // 本轮签到的第几天
        score: 0 // 当前积分
      },
      prizeList: [
        { name: '积分+200', img: '/static/lotteries/pointadd200.png', content: '积分+200' },
        { name: '便民水卡', img: '/static/lotteries/waterCard.png', content: '便民水卡' },
        { name: '积分+50', img: '/static/lotteries/pointadd50.png', content: '积分+50' },
        { name: '卡通手办', img: '/static/lotteries/cartoonToy.png', content: '卡通手办' },
        { name: '毛绒玩具', img: '/static/lotteries/plushToy.png', content: '毛绒玩具' },
        { name: '加油卡', img: '/static/lotteries/gasCard.png', content: '加油卡' }
      ],
      taskList: [
        { id: 1, name: '观看广告', reward: 2, actionText: '观看' },
        { id: 2, name: '逛逛广场', reward: 8, actionText: '逛逛' },
        { id: 3, name: '分享任务', reward: 5, actionText: '分享' }
      ]
    }
  },
  
  computed: {
    // 将奖品列表分页，每页3个
    prizePages() {
      const pages = []
      for (let i = 0; i < this.prizeList.length; i += 3) {
        pages.push(this.prizeList.slice(i, i + 3))
      }
      return pages
    }
  },
  
  onLoad() {
    this.initUserScore()
    this.initSignInData()
  },
  
  onShow() {
    // 页面显示时刷新签到状态
    this.refreshSignInStatus()
  },
  
  mounted() {
    // 检查组件是否正确加载
    this.$nextTick(() => {
      if (this.$refs.signIn) {
        console.log('签到组件加载成功')
      } else {
        console.error('签到组件加载失败')
      }
    })
  },
  
  methods: {
    // 初始化用户积分
    initUserScore() {
      // 优先使用store中的缓存积分
      if (store.userInfo && (store.userInfo.score !== undefined && store.userInfo.score !== null)) {
        this.userScore = store.userInfo.score
        console.log('使用缓存积分:', this.userScore)
      } else {
        // 缓存中没有积分，去请求云函数
        console.log('缓存中无积分，请求云函数')
        this.getUserScore()
      }
    },
    
    // 获取用户积分
    async getUserScore() {
      try {
        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: { 
            action: 'getUserScore',
            uid: store.userInfo._id || store.userInfo.uid
          }
        })
        
        if (res.result.code === 200) {
          this.userScore = res.result.data.score
          // 更新store中的积分缓存
          if (store.userInfo) {
            store.userInfo.score = this.userScore
          }
          console.log('云函数获取积分成功:', this.userScore)
        }
      } catch (error) {
        console.error('获取积分失败:', error)
      }
    },
    
    // 初始化签到数据 - 使用云函数获取
    async initSignInData() {
      try {
        console.log('初始化签到数据...')
        await this.fetchSignInDataFromCloud()
      } catch (error) {
        console.error('初始化签到数据失败:', error)
        // 如果失败，使用默认值
        this.initDefaultSignInData()
      }
    },
    
    // 初始化默认签到数据
    initDefaultSignInData() {
      this.signInData = {
        days: [],
        n: 0,
        score: this.userScore
      }
      this.todaySigned = false
    },
    
    // 检查今天是否已签到
    isTodaySigned() {
      try {
        // 获取今天的日期字符串（YYYY-MM-DD格式）
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        
        // 检查缓存中是否有今天的签到记录
        const lastSignInDate = uni.getStorageSync('lastSignInDate')
        
        // 如果缓存中的日期是今天，说明今天已签到
        if (lastSignInDate === todayStr) {
          return true
        }
        
        return false
      } catch (error) {
        console.error('检查签到状态失败:', error)
        return false
      }
    },
    
    // 处理签到
    handleSignIn() {
      if (this.todaySigned) return
      
      // 优先使用uni-sign-in组件
      if (this.$refs.signIn && this.$refs.signIn.open) {
        // 直接打开签到弹窗
        this.$refs.signIn.open()
      } else {
        // 如果组件未加载，显示错误提示
        uni.showToast({
          title: '签到组件未加载，请刷新页面重试',
          icon: 'none'
        })
        console.error('签到组件未正确加载:', this.$refs.signIn)
      }
    },
    
    // 签到成功回调 - 完全使用uni-sign-in组件的数据
    onSignInSuccess(signInData) {
      if (signInData && signInData.score !== undefined) {
        console.log('收到签到成功回调数据:', signInData)
        
        // 直接使用组件返回的数据，不做任何修改
        this.signInData = {
          days: signInData.days || [],
          n: signInData.n || 0,
          score: signInData.score
        }
        
        // 更新签到状态
        this.todaySigned = true
        
        // 更新积分显示
        this.userScore = this.signInData.score
        
        // 更新store中的积分缓存
        if (store.userInfo) {
          store.userInfo.score = this.userScore
        }
        
        // 保存最后签到日期到本地缓存
        this.saveLastSignInDate()
        
        // 计算本次获得的积分
        const earnedScore = this.signInData.days.length === 7 ? 60 : 10
        
        uni.showToast({
          title: `签到成功，获得${earnedScore}积分！`,
          icon: 'success'
        })
        
        console.log('签到成功，更新后的数据:', {
          signInData: this.signInData,
          todaySigned: this.todaySigned,
          userScore: this.userScore
        })
      }
    },
    
    // 保存最后签到日期
    saveLastSignInDate() {
      try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        uni.setStorageSync('lastSignInDate', todayStr)
        console.log('保存最后签到日期:', todayStr)
      } catch (error) {
        console.error('保存签到日期失败:', error)
      }
    },
    
    // 刷新签到状态
    refreshSignInStatus() {
      // 检查今天是否已签到
      this.todaySigned = this.isTodaySigned()
      
      // 如果今天已签到但数据不完整，重新获取云端数据
      if (this.todaySigned && this.signInData.days.length === 0) {
        this.fetchSignInDataFromCloud()
      }
    },
    
    // 从云端获取签到数据
    async fetchSignInDataFromCloud() {
      try {
        console.log('开始从云端获取签到数据...')
        
        // 调用云函数获取签到信息
        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: { 
            action: 'getSignInData',
            uid: store.userInfo._id || store.userInfo.uid
          }
        })
        
        if (res.result && res.result.code === 200) {
          const cloudData = res.result.data
          console.log('云端签到数据:', cloudData)
          
          // 更新本地数据
          this.signInData = {
            days: cloudData.days || [],
            n: cloudData.n || 0,
            score: cloudData.score || this.userScore
          }
          
          // 更新积分显示
          this.userScore = this.signInData.score
          
          // 更新store中的积分缓存
          if (store.userInfo) {
            store.userInfo.score = this.userScore
          }
          
          // 检查今天是否已签到
          this.todaySigned = this.isTodaySigned()
          
          console.log('云端数据获取成功，当前状态:', this.signInData)
        } else {
          throw new Error(res.result?.message || '获取云端数据失败')
        }
        
      } catch (error) {
        console.error('获取云端签到数据失败:', error)
        throw error
      }
    },
    
    // 获取每日签到奖励积分
    getDayReward(day) {
      // 根据连续签到天数计算奖励
      if (day === 7) {
        return 60 // 连续签到奖励60积分
      } else {
        return 10 // 普通签到奖励10积分
      }
    },
    
    // 轮播图切换
    onSwiperChange(e) {
      this.currentPrizeIndex = e.detail.current
    },
    
    goDetail() {
      uni.navigateTo({ url: '/pages/ucenter/point/detail' })
    },
    
    goLottery() {
      uni.navigateTo({ url: '/pages/ucenter/point/lottery' })
    },
    
    doTask(task) {
      // 任务逻辑
      uni.showToast({
        title: `完成任务：${task.name}`,
        icon: 'success'
      })
    }
  }
}
</script>

<style scoped>
.point-center {
  background: #f8f8f8;
  min-height: 100vh;
  padding: 0 24rpx !important;
}

.my-point-card {
  background: #fbeee6;
  border-radius: 16rpx;
  margin: 12rpx 0 !important;
  padding: 10rpx 12rpx !important;
  display: flex;
  align-items: center;
  justify-content: space-between !important;
}

.point-label {
  font-size: 32rpx;
  color: #888;
}

.point-value {
  font-size: 48rpx;
  color: #ff9800;
  font-weight: bold;
  margin: 0 16rpx;
}

.point-detail-btn {
  width: 100rpx !important;
  font-size: 24rpx;
  color: #fff;
  background: #1976d2 !important;
  border: none;
  padding: 4rpx 8rpx !important;
  margin: 12rpx 0 !important;
}

.lottery-card {
  background: #fff;
  border-radius: 16rpx;
  margin: 12rpx 0 !important;
  padding: 10rpx 12rpx !important;
}

.lottery-header {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.cost {
  color: #ff9800;
  font-size: 24rpx;
}

.swiper-box {
  height: 280rpx;
}

.prize-grid {
  padding: 20rpx 0;
}

.prize-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.prize-img {
  width: 28vw !important;
  height: 21vw !important;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.prize-name {
  font-size: 22rpx;
  color: #333;
  text-align: center;
  line-height: 1.2;
}

.sign-in-section {
  background: #fff;
  border-radius: 16rpx;
  margin: 12rpx 0 !important;
  padding: 10rpx 12rpx !important;
  box-shadow: 0 2rpx 8rpx #f0f0f0;
}

.sign-in-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.sign-in-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  display: block;
}

.sign-in-desc {
  font-size: 24rpx;
  color: #888;
  margin-top: 8rpx;
  display: block;
}

.sign-in-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.sign-in-day {
  width: 80rpx;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.sign-in-day.signed {
  background: #4caf50;
  border-color: #4caf50;
  color: #fff;
}

.sign-in-day.today {
  background: #ff9800;
  border-color: #ff9800;
  color: #fff;
}

.day-num {
  font-size: 24rpx;
  font-weight: bold;
}

.day-reward {
  font-size: 20rpx;
  margin-top: 4rpx;
}

.sign-in-btn {
  flex: 2;
  background: #1976d2;
  color: #fff;
  border-radius: 16rpx;
  padding: 16rpx 0;
  font-size: 28rpx;
  border: none;
}

.sign-in-btn.signed {
  background: #ccc;
}

.sign-in-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.clear-cache-btn {
  background: #f44336;
  color: #fff;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
  flex: 1;
}

.task-section {
  margin: 2rpx;
}

.section-title {
  font-size: 32rpx !important;
}

.task-list {
  display: flex;
  flex-direction: column;
}

.task-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #e0e0e0;
}

.task-name {
  font-size: 28rpx;
  color: #333;
}

.task-reward {
  color: #ff9800;
  font-size: 28rpx;
  margin-left: 8rpx;
}
</style>
