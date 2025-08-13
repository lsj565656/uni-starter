<template>
  <view class="lottery-page">
    <!-- 粘性头部区域 -->
    <view class="sticky-header">
      <!-- 用户积分显示 -->
      <view class="user-score">
        <text class="score-label">我的积分</text>
        <text class="score-value">{{ userScore }}</text>
        <text class="cost-text">抽奖消耗：10积分/次</text>
      </view>
                
      <!-- 重置抽奖次数按钮（仅用于测试） -->
      <view class="reset-button" @click="resetDrawCount">
        <text class="reset-text">重置次数</text>
      </view>
      
      <!-- 抽奖中奖公告栏 -->
      <view class="notice-section">
        <view class="notice-bar">
          <view class="notice-content">
            <uni-icons
              type="🎉"
              size="16"
              color="#ff9800"
              class="notice-icon"
            />
            <view class="notice-text-container">
              <text
                class="notice-text"
                :class="{ 'fade-out': isNoticeTransitioning }"
              >
                {{ currentNotice?.text || '' }}
              </text>
            </view>
            <text class="notice-time" :class="{ 'fade-out': isNoticeTransitioning }">
              {{ formatNoticeTime(currentNotice?.timestamp) }}
            </text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 跑马灯抽奖区 -->
    <view class="lottery-area">
      <view class="marquee-container">
        <view class="prize-grid">
          <!-- 第一行奖品 -->
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 0, 'highlight': isHighlighted(0) }"
            :data-index="0"
          >
            <image :src="prizes[marqueeToPrizeMap[0]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[0]].name }}</text>
          </view>
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 1, 'highlight': isHighlighted(1) }"
            :data-index="1"
          >
            <image :src="prizes[marqueeToPrizeMap[1]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[1]].name }}</text>
          </view>
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 2, 'highlight': isHighlighted(2) }"
            :data-index="2"
          >
            <image :src="prizes[marqueeToPrizeMap[2]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[2]].name }}</text>
          </view>

          <!-- 中间行 -->
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 7, 'highlight': isHighlighted(7) }"
            :data-index="7"
          >
            <image :src="prizes[marqueeToPrizeMap[7]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[7]].name }}</text>
          </view>
          <view 
            class="prize-item center-button" 
            :class="{ 'rolling': isLotterying, 'disabled': userScore < 10 || timesLeft <= 0 }"
            @click="startLottery"
          >
            <text class="start-text">{{ isLotterying ? '抽奖中...' : '开始抽奖' }}</text>
            <text class="draw-count">
              今日剩余{{ timesLeft }}/{{ maxDraws }}次
            </text>
          </view>
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 3, 'highlight': isHighlighted(3) }"
            :data-index="3"
          >
            <image :src="prizes[marqueeToPrizeMap[3]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[3]].name }}</text>
          </view>

          <!-- 最后一行 -->
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 6, 'highlight': isHighlighted(6) }"
            :data-index="6"
          >
            <image :src="prizes[marqueeToPrizeMap[6]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[6]].name }}</text>
          </view>
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 5, 'highlight': isHighlighted(5) }"
            :data-index="5"
          >
            <image :src="prizes[marqueeToPrizeMap[5]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[5]].name }}</text>
          </view>
          <view 
            class="prize-item" 
            :class="{ 'active': currentIndex === 4, 'highlight': isHighlighted(4) }"
            :data-index="4"
          >
            <image :src="prizes[marqueeToPrizeMap[4]].img" mode="aspectFit" class="prize-image"/>
            <text class="prize-name">{{ prizes[marqueeToPrizeMap[4]].name }}</text>
          </view>
        </view>
      </view>
      
      <!-- 抽奖规则和我的奖品 -->
      <view class="lottery-info-section">
        <uni-segmented-control 
          :current="currentTab" 
          :values="['抽奖规则', '我的奖品']" 
          @clickItem="onTabChange"
          style-type="text"
          active-color="#ff9800"
        />
        
        <!-- 抽奖规则内容 -->
        <view v-if="currentTab === 0" class="rule-content">
          <uni-list>
            <uni-list-item title="抽奖费用" :rightText="'10积分/次'" />
            <uni-list-item title="奖品类型" :rightText="'积分、实物奖品'" />
            <uni-list-item title="实物奖品" :rightText="'需联系客服兑换'" />
            <uni-list-item title="每日限制" :rightText="'3次'" />
          </uni-list>
        </view>
        
        <!-- 我的奖品内容 -->
        <view v-if="currentTab === 1" class="prize-content">
          <uni-list>
            <uni-list-item 
              v-for="record in lotteryRecords" 
              :key="record._id"
              :title="record.prize_name"
              :note="formatTime(record.lottery_time)"
              :rightText="record.is_winner ? '已中奖' : '未中奖'"
              :showArrow="record.is_winner && !record.is_exchanged"
              @click="record.is_winner && !record.is_exchanged ? exchangePrize(record._id) : null"
            >
              <template v-slot:footer>
                <view class="prize-status">
                  <text :class="['status-text', record.is_winner ? 'winner' : 'loser']">
                    {{ record.is_winner ? (record.is_exchanged ? '已兑换' : '待兑换') : '谢谢参与' }}
                  </text>
                  <text class="cost-text">-{{ record.cost_score }}积分</text>
                </view>
              </template>
            </uni-list-item>
          </uni-list>
          
          <view v-if="lotteryRecords.length === 0" class="empty-tip">
            <text>暂无抽奖记录</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 中奖结果弹窗 -->
    <uni-popup ref="resultPopup" type="center">
      <view class="result-content">
        <text class="result-title">{{ resultTitle }}</text>
        <text class="result-desc">{{ resultDesc }}</text>
        <button @click="closeResult" class="result-btn">知道了</button>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

export default {
  computed: {
    // 动态显示的公告列表
    displayNotices() {
      return this.lotteryNotices.slice(0, this.displayCount)
    },
    
    // 当前显示的公告
    currentNotice() {
      if (this.lotteryNotices.length === 0) return null
      return this.lotteryNotices[this.currentNoticeIndex] || null
    }
  },
  
  data() {
    return {
      userScore: 0,
      currentIndex: 0,
      isLotterying: false,
      lotteryTimer: null,
      resultTitle: '',
      resultDesc: '',
      currentTab: 0,
      lotteryRecords: [],
      timesLeft: 3,
      maxDraws: 3,
      lotteryNotices: [],
      // 简化公告管理
      displayCount: 5, // 显示5条公告
      // 淡入淡出切换逻辑
      currentNoticeIndex: 0,
      isNoticeTransitioning: false,
      noticeSwitchTimer: null,
      prizes: [
        { name: '积分+200', img: '/static/lotteries/pointadd200.png', type: 1, value: 200, weight: 5 },
        { name: '便民水卡', img: '/static/lotteries/waterCard.png', type: 2, value: 1, weight: 8 },
        { name: '积分+50', img: '/static/lotteries/pointadd50.png', type: 1, value: 50, weight: 10 },
        { name: '卡通手办', img: '/static/lotteries/cartoonToy.png', type: 2, value: 2, weight: 8 },
        { name: '谢谢参与', img: '/static/lotteries/pointadd50.png', type: 3, value: 0, weight: 20 },
        { name: '毛绒玩具', img: '/static/lotteries/plushToy.png', type: 2, value: 3, weight: 8 },
        { name: '加油卡', img: '/static/lotteries/gasCard.png', type: 2, value: 4, weight: 8 },
        { name: '谢谢参与', img: '/static/lotteries/pointadd50.png', type: 3, value: 0, weight: 20 }
      ],
      // 新增：奖品索引到跑马灯位置的映射
      // 跑马灯布局：第一行[0,1,2], 中间行[7,中心,3], 最后行[6,5,4]
      // 奖品数组索引: [0,1,2,3,4,5,6,7]
      // 跑马灯位置索引: [0,1,2,3,4,5,6,7]
      // 修复映射关系：确保位置5对应奖品4（谢谢参与）
      prizeToMarqueeMap: [0, 1, 2, 3, 5, 4, 6, 7],
      // 跑马灯位置到奖品索引的映射
      marqueeToPrizeMap: [0, 1, 2, 3, 5, 4, 6, 7],
      // 新增：保存中奖奖品索引
      winningPrizeIndex: 0
    }
  },
  
  onLoad() {
    this.getUserScore()
    this.getLotteryRecords()
    this.initDrawCount()
    this.getLotteryNotices() // 新增：获取抽奖公告
    this.startNoticeMarquee() // 新增：启动公告栏滚动
  },
  
  onShow() {
    // 页面显示时刷新数据
    this.refreshData()
  },
  
  onUnload() {
    // 清理定时器
    if (this.lotteryTimer) {
      clearInterval(this.lotteryTimer)
    }
    if (this.noticeSwitchTimer) {
      clearInterval(this.noticeSwitchTimer)
    }
  },
  
  methods: {
    // 刷新页面数据
    refreshData() {
      // 刷新用户积分
      this.getUserScore()
      // 刷新抽奖记录
      this.getLotteryRecords()
      // 刷新公告数据
      this.getLotteryNotices()
    },
    
    // 初始化抽奖次数
    initDrawCount() {
      const today = this.formatDate(new Date())
      const lastDrawDate = uni.getStorageSync('lastDrawDate')
      const remainingDraws = uni.getStorageSync('remainingDraws')

      if (lastDrawDate === today) {
        // 如果是同一天，使用存储的剩余次数
        this.timesLeft = remainingDraws || 0
      } else {
        // 如果是新的一天，重置次数
        this.timesLeft = this.maxDraws
        uni.setStorageSync('lastDrawDate', today)
        uni.setStorageSync('remainingDraws', this.maxDraws)
      }
    },
    
    // 重置抽奖次数（用于测试或重置）
    resetDrawCount() {
      this.timesLeft = this.maxDraws
      const today = this.formatDate(new Date())
      uni.setStorageSync('lastDrawDate', today)
      uni.setStorageSync('remainingDraws', this.maxDraws)
      
      uni.showToast({
        title: '抽奖次数已重置',
        icon: 'success'
      })
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
        }
      } catch (error) {
        console.error('获取积分失败:', error)
      }
    },
    
    // 获取抽奖记录
    async getLotteryRecords() {
      try {
        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: { 
            action: 'getLotteryRecords',
            uid: store.userInfo._id || store.userInfo.uid
          }
        })
        
        if (res.result.code === 200) {
          this.lotteryRecords = res.result.data
        }
      } catch (error) {
        console.error('获取抽奖记录失败:', error)
      }
    },

    // 获取抽奖公告
    async getLotteryNotices() {
      try {
        // 从本地存储获取抽奖公告
        const notices = uni.getStorageSync('lotteryNotices') || []
        
        // 如果没有公告，生成一些默认的抽奖公告
        if (notices.length === 0) {
          const defaultNotices = this.generateDefaultNotices()
          
          // 保存到本地存储
          uni.setStorageSync('lotteryNotices', defaultNotices)
          this.lotteryNotices = defaultNotices
        } else {
          // 使用现有的公告
          this.lotteryNotices = notices
        }
        
      } catch (error) {
        console.error('获取抽奖公告失败:', error)
        // 如果出错，使用默认公告
        this.lotteryNotices = this.generateDefaultNotices()
      }
    },
    
    // 生成默认抽奖公告
    generateDefaultNotices() {
      const users = ['小明', '小红', '小李', '小王', '小张', '小赵', '小钱', '小孙', '小周', '小吴']
      const prizes = [
        '积分+200', '便民水卡', '积分+50', '卡通手办', '毛绒玩具', '加油卡', '谢谢参与'
      ]
      
      const notices = []
      const now = Date.now()
      
      // 生成5-8条公告，时间分布在最近1小时内
      const count = 5 + Math.floor(Math.random() * 4)
      
      for (let i = 0; i < count; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const prize = prizes[Math.floor(Math.random() * prizes.length)]
        const timestamp = now - Math.floor(Math.random() * 60 * 60 * 1000) // 最近1小时内
        
        notices.push({
          id: `default_${i}_${timestamp}`,
          text: `恭喜 ${user} 抽中了${prize}`,
          type: 'lottery',
          timestamp: timestamp,
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          nickname: user,
          prize: prize
        })
      }
      
      // 按时间倒序排列
      return notices.sort((a, b) => b.timestamp - a.timestamp)
    },
    
    // 启动公告栏滚动
    startNoticeMarquee() {
      if (this.noticeSwitchTimer) {
        clearInterval(this.noticeSwitchTimer)
      }
      
      // 如果没有公告，不启动切换
      if (this.lotteryNotices.length <= 1) return
      
      // 每4秒切换一条消息
      this.noticeSwitchTimer = setInterval(() => {
        this.switchToNextNotice()
      }, 4000)
    },
    
    // 切换到下一条消息
    switchToNextNotice() {
      if (this.isNoticeTransitioning) return

      this.isNoticeTransitioning = true

      // 先淡出当前消息
      setTimeout(() => {
        // 切换到下一条消息
        this.currentNoticeIndex = (this.currentNoticeIndex + 1) % this.lotteryNotices.length

        // 重置过渡状态
        setTimeout(() => {
          this.isNoticeTransitioning = false
        }, 100)
      }, 300) // 等待淡出动画完成
    },
    
    // 开始抽奖
    async startLottery() {
      if (this.isLotterying) return
      
      if (this.userScore < 10) {
        uni.showToast({ title: '积分不足', icon: 'none' })
        return
      }
      
      if (this.timesLeft <= 0) {
        uni.showToast({ title: '今日抽奖次数已用完', icon: 'none' })
        return
      }
      
      this.isLotterying = true
      this.timesLeft--
      
      // 更新本地存储
      uni.setStorageSync('remainingDraws', this.timesLeft)
      
      // 开始跑马灯效果，跑马灯停止后会自动调用抽奖
      this.startMarquee()
    },
    
    // 开始跑马灯效果
    startMarquee() {
      let index = 0
      const totalPrizes = 8
      
      // 随机时长：4-8秒
      const minDuration = 4000 // 4秒
      const maxDuration = 8000 // 8秒
      const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration
      
      // 计算转动次数，确保平滑转动
      const totalTimes = Math.floor(randomDuration / 60) // 每60ms转动一次，更平滑
      let times = 0
      let currentSpeed = 60 // 初始速度
      
      this.lotteryTimer = setInterval(() => {
        times++
        
        // 正常转动阶段
        if (times < totalTimes) {
          // 计算当前位置，确保平滑转动
          index = (index + 1) % totalPrizes
          this.currentIndex = index
          
          // 根据进度动态调整速度，实现自然减速
          if (times > totalTimes * 0.85) {
            // 最后15%时间，快速减速
            currentSpeed = 60 + (times - totalTimes * 0.85) * 40
          } else if (times > totalTimes * 0.7) {
            // 70%-85%时间，中等减速
            currentSpeed = 60 + (times - totalTimes * 0.7) * 20
          } else if (times > totalTimes * 0.5) {
            // 50%-70%时间，轻微减速
            currentSpeed = 60 + (times - totalTimes * 0.5) * 10
          }
          
          // 动态调整定时器间隔，实现真正的减速效果
          if (currentSpeed > 60) {
            clearInterval(this.lotteryTimer)
            this.lotteryTimer = setInterval(() => {
              // 递归调用当前逻辑
              this.continueMarquee(times, totalTimes, index, totalPrizes)
            }, currentSpeed)
          }
        } else {
          // 停止阶段：跑马灯自然停止在当前位置
          const finalIndex = this.currentIndex
          
          // 根据实际停止位置确定中奖奖品
          this.winningPrizeIndex = this.marqueeToPrizeMap[finalIndex]
          
          clearInterval(this.lotteryTimer)
          this.isLotterying = false
          
          // 跑马灯停止后，立即执行抽奖
          this.$nextTick(() => {
            this.executeLottery()
          })
        }
      }, currentSpeed)
    },
    
    // 继续跑马灯转动（递归调用，实现动态减速）
    continueMarquee(times, totalTimes, index, totalPrizes) {
      if (times >= totalTimes) {
        // 停止阶段
        const finalIndex = this.currentIndex
        
        // 根据实际停止位置确定中奖奖品
        this.winningPrizeIndex = this.marqueeToPrizeMap[finalIndex]
        
        clearInterval(this.lotteryTimer)
        this.isLotterying = false
        
        // 跑马灯停止后，立即执行抽奖
        this.$nextTick(() => {
          this.executeLottery()
        })
        return
      }
      
      // 继续转动
      times++
      index = (index + 1) % totalPrizes
      this.currentIndex = index
      
      // 继续递归调用
      this.continueMarquee(times, totalTimes, index, totalPrizes)
    },
    
    // 根据权重随机选择奖品索引
    getRandomPrizeIndex() {
      const totalWeight = this.prizes.reduce((sum, prize) => sum + prize.weight, 0)
      let random = Math.random() * totalWeight
      
      for (let i = 0; i < this.prizes.length; i++) {
        random -= this.prizes[i].weight
        if (random <= 0) {
          return i
        }
      }
      return 0
    },
    
    // 判断是否为高亮状态
    isHighlighted(index) {
      return this.isLotterying && this.currentIndex === index
    },
    
    // 跑马灯停止后执行抽奖
    async executeLottery() {
      try {
        // 使用跑马灯停止位置确定的中奖奖品
        const winningPrize = this.prizes[this.winningPrizeIndex]
        // 调用云函数记录抽奖结果
        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: { 
            action: 'doLottery',
            uid: store.userInfo._id || store.userInfo.uid,
            data: { 
              costScore: 10,
              prizeIndex: this.winningPrizeIndex,
              prizeName: winningPrize.name,
              prizeType: winningPrize.type,
              prizeValue: winningPrize.value
            }
          }
        })
        
        if (res.result.code === 200) {
          // 更新用户积分
          this.userScore -= 10
          
          // 显示中奖结果
          const isWinner = winningPrize.type !== 3 // 不是"谢谢参与"就是中奖
          this.resultTitle = isWinner ? '恭喜中奖！' : '很遗憾'
          this.resultDesc = isWinner ? `恭喜您抽中了${winningPrize.name}` : '谢谢参与，下次再来！'
          this.$refs.resultPopup.open()
          
          // 向全局通告系统发送抽奖中奖信息
          if (isWinner) {
            this.sendLotteryNotice({
              name: winningPrize.name,
              isWinner: true
            })
          }
          
          // 刷新抽奖记录
          this.getLotteryRecords()
        } else {
          uni.showToast({
            title: res.result.message || '抽奖失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('抽奖失败:', error)
        uni.showToast({
          title: '抽奖失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 向全局通告系统发送抽奖中奖信息
    sendLotteryNotice(prize) {
      // 只有真正中奖的奖品才发送通告，谢谢参与不发送
      if (prize.isWinner && prize.type !== 3) {
        // 生成抽奖中奖通告
        const lotteryNotice = this.generateLotteryNotice(prize)
        
        // 保存到本地存储
        try {
          const existingNotices = uni.getStorageSync('lotteryNotices') || []
          existingNotices.unshift(lotteryNotice)
          // 保持最多20条记录
          if (existingNotices.length > 20) {
            existingNotices.splice(20)
          }
          uni.setStorageSync('lotteryNotices', existingNotices)
          
          // 更新本地公告列表
          this.lotteryNotices.unshift(lotteryNotice)
          if (this.lotteryNotices.length > 20) {
            this.lotteryNotices.splice(20)
          }
          
          // 立即显示新公告
          this.currentNoticeIndex = 0
          
          // 重启公告切换
          this.startNoticeMarquee()
          
        } catch (error) {
          console.error('保存抽奖通告失败:', error)
        }
      }
    },
    
    // 生成抽奖中奖公告
    generateLotteryNotice(prize) {
      const user = store.userInfo?.nickname || store.userInfo?.username || '神秘用户'
      const prizeName = prize.name
      
      return {
        id: `lottery_${Date.now()}_${Math.random()}`,
        text: `恭喜 ${user} 抽中了${prizeName}`,
        type: 'lottery',
        timestamp: Date.now(),
        userId: store.userInfo?._id || store.userInfo?.uid || '',
        nickname: user,
        prize: prizeName,
        isReal: true // 标记为真实抽奖结果
      }
    },
    
    // 标签切换
    onTabChange(e) {
      this.currentTab = e.currentIndex
    },
    
    // 兑换奖品
    async exchangePrize(recordId) {
      try {
        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: { 
            action: 'exchangePrize',
            uid: store.userInfo._id || store.userInfo.uid,
            data: { recordId }
          }
        })
        
        if (res.result.code === 200) {
          uni.showToast({
            title: '兑换成功',
            icon: 'success'
          })
          // 刷新抽奖记录
          this.getLotteryRecords()
        } else {
          uni.showToast({
            title: res.result.message || '兑换失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('兑换失败:', error)
        uni.showToast({
          title: '兑换失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 关闭结果弹窗
    closeResult() {
      this.$refs.resultPopup.close()
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // 格式化公告时间
    formatNoticeTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diffMinutes = (now - date) / (1000 * 60)

      if (diffMinutes < 1) {
        return '刚刚'
      } else if (diffMinutes < 60) {
        return `${Math.floor(diffMinutes)}分钟前`
      } else if (diffMinutes < 1440) { // 24小时
        return `${Math.floor(diffMinutes / 60)}小时前`
      } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
    }
  }
}
</script>

<style scoped>
.lottery-page {
  background: #f8f8f8;
  min-height: 100vh;
  width: 100vw;
  padding: 0; /* 移除顶部内边距，因为粘性头部会处理 */
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100; /* 提高z-index，确保在最上层 */
  background: #fff;
  padding-top: env(safe-area-inset-top); /* 适配iPhone X等机型顶部安全区域 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 0; /* 确保与下方内容无缝连接 */
  /* 兼容性处理 */
  position: -webkit-sticky; /* Safari兼容 */
  position: sticky;
}

.user-score {
  text-align: center;
  margin-bottom: 0; /* 移除底部边距 */
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: #fff;
  padding: 24rpx;
  border-radius: 0; /* 移除圆角，因为是粘性头部的一部分 */
  margin: 0; /* 移除所有边距 */
  box-shadow: none; /* 移除阴影，因为sticky-header已经有阴影 */
}

.score-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-right: 16rpx;
}

.score-value {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.cost-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9) !important; /* 改为纯白色，提高对比度 */
  margin-top: 8rpx;
  display: block;
  font-weight: 500; /* 增加字重，提高可读性 */
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3); /* 添加文字阴影，提高对比度 */
}

.notice-section {
  margin: 0; /* 移除左右边距，与积分块对齐 */
  border-radius: 0; /* 移除圆角 */
  overflow: hidden;
  box-shadow: none; /* 移除阴影，因为sticky-header已经有阴影 */
  background: #f8f9fa;
  margin-bottom: 0; /* 移除底部边距 */
  border-top: 1px solid #f0f0f0; /* 添加顶部边框，与积分块分隔 */
}

.notice-bar {
  height: 44px;
  overflow: hidden;
  position: relative;
}

.notice-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 12px 16px;
  box-sizing: border-box;
}

.notice-icon {
  flex-shrink: 0;
}

.notice-text-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 20px; /* 固定高度，只显示一行 */
}

.notice-text {
  font-size: 14px;
  line-height: 20px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: all 0.3s ease-in-out;
  transform: translateY(0);
  opacity: 1;
  color: #333;
}

.notice-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease-in-out;
  transform: translateY(0);
  opacity: 1;
}

.notice-text.fade-out,
.notice-time.fade-out {
  transform: translateY(-10px);
  opacity: 0;
}

/* 新消息从下方淡入的动画 */
.notice-text:not(.fade-out) {
  animation: slideInFromBottom 0.3s ease-in-out;
}

.notice-time:not(.fade-out) {
  animation: slideInFromBottom 0.3s ease-in-out;
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.lottery-area {
  padding: 24rpx; /* 减少内边距，使内容更紧凑 */
  background: #f8f8f8;
  min-height: calc(100vh - 200px); /* 确保内容区域有足够高度 */
}

.marquee-container {
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 600rpx;
  margin-bottom: 32rpx; /* 与下方内容保持适当间距 */
}

/* 抽奖信息区域样式 */
.lottery-info-section {
  margin-top: 0; /* 移除顶部边距，因为marquee-container已经有底部边距 */
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

/* 抽奖规则内容样式 */
.rule-content {
  margin-top: 24rpx;
}

/* 我的奖品内容样式 */
.prize-content {
  margin-top: 24rpx;
}

/* 奖品状态样式 */
.prize-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.status-text {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.status-text.winner {
  background: #e8f5e8;
  color: #52c41a;
}

.status-text.loser {
  background: #fff2e8;
  color: #fa8c16;
}

/* 空状态提示样式 */
.empty-tip {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.prize-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 20rpx;
  width: 100%;
  height: 100%;
}

.prize-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff, #f8f9fa);
  border-radius: 16rpx;
  padding: 20rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  border: 2rpx solid #e0e0e0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.prize-item:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.prize-item.active {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  transform: scale(1.05);
  box-shadow: 0 8rpx 24rpx rgba(255, 152, 0, 0.4);
  border-color: #ff9800;
}

.prize-item.highlight {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  transform: scale(1.1);
  box-shadow: 0 12rpx 32rpx rgba(255, 152, 0, 0.5);
  border-color: #ff9800;
  animation: pulse 0.6s ease-in-out infinite alternate;
}

.prize-item.rolling {
  animation: rotate 1s linear infinite;
}

.prize-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.prize-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  transition: all 0.3s ease;
}

.prize-item.active .prize-image,
.prize-item.highlight .prize-image {
  transform: scale(1.1);
}

.prize-name {
  font-size: 22rpx;
  color: #333;
  text-align: center;
  font-weight: 600;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.prize-item.active .prize-name,
.prize-item.highlight .prize-name {
  color: #fff;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

.center-button {
  grid-column: 2;
  grid-row: 2;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: #fff;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 152, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 160rpx;
}

.center-button:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 32rpx rgba(255, 152, 0, 0.5);
}

.center-button:active {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 20rpx rgba(255, 152, 0, 0.4);
}

.center-button.rolling {
  animation: pulse 0.6s ease-in-out infinite alternate;
}

.center-button.disabled {
  background: linear-gradient(135deg, #ccc, #999);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.start-text {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

.draw-count {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

.reset-button {
  grid-column: 2;
  grid-row: 3;
  background: #f0f0f0;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  color: #333;
  border: 1rpx solid #ccc;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  margin-top: 20rpx; /* 调整位置，使其与抽奖按钮对齐 */
}

.reset-button:hover {
  background: #e0e0e0;
  border-color: #bbb;
}

.reset-button:active {
  background: #d0d0d0;
  border-color: #aaa;
}

.reset-text {
  font-size: 24rpx;
  font-weight: bold;
}

.result-content {
  background: #fff;
  border-radius: 20rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  min-width: 400rpx;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
}

.result-title {
  font-size: 36rpx;
  color: #ff9800;
  font-weight: bold;
  display: block;
  margin-bottom: 24rpx;
}

.result-desc {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 32rpx;
  display: block;
}

.result-btn {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: #fff;
  border-radius: 24rpx;
  padding: 16rpx 32rpx;
  border: none;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.result-btn:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(25, 118, 210, 0.4);
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1.05);
    box-shadow: 0 8rpx 24rpx rgba(255, 152, 0, 0.4);
  }
  100% {
    transform: scale(1.1);
    box-shadow: 0 12rpx 32rpx rgba(255, 152, 0, 0.6);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* 响应式设计 */
@media screen and (max-width: 375px) {
  .sticky-header {
    padding-top: 20px; /* 小屏幕设备使用固定值 */
  }
}

@media screen and (min-width: 414px) {
  .sticky-header {
    padding-top: 25px; /* 大屏幕设备使用更大的值 */
  }
}

/* 确保在iOS设备上正确显示 */
@supports (-webkit-touch-callout: none) {
  .sticky-header {
    padding-top: 44px; /* iOS设备状态栏高度 */
  }
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .lottery-area {
    padding: 24rpx;
    margin: 0 16rpx 24rpx 16rpx;
  }
  
  .marquee-container {
    height: 500rpx;
  }
  
  .prize-grid {
    gap: 16rpx;
  }
  
  .prize-item {
    padding: 16rpx;
  }
  
  .prize-image {
    width: 60rpx;
    height: 60rpx;
  }
  
  .prize-name {
    font-size: 20rpx;
  }
}
</style>
