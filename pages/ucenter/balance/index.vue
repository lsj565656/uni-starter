<template>
    <!-- 使用官方uni-nav-bar组件 -->
    <uni-nav-bar :fixed="true" :border="false" :shadow="true" :statusBar="true" background-color="#fff" color="#333"
    left-icon="left" left-text="" title="我的余额" @clickLeft="goBack">
    </uni-nav-bar>
  <view class="balance-container">
    <!-- 顶部余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-title">我的余额</text>
      </view>
      <view class="balance-amount">
        <text class="amount-symbol">¥</text>
        <text class="amount-value">{{ formatBalance(balance) }}</text>
      </view>
      <view class="balance-actions">
        <button class="action-btn recharge-btn" @click="showRechargeModal">充值</button>
        <button class="action-btn withdraw-btn" @click="showWithdrawModal">提现</button>
      </view>
    </view>

    <!-- 充值金额选择弹窗 -->
    <uni-popup ref="rechargePopup" type="bottom">
      <view class="recharge-modal">
        <view class="modal-header">
          <text class="modal-title">选择充值金额</text>
          <uni-icons 
            type="close" 
            size="24" 
            color="#999" 
            @click="closeRechargeModal"
          />
        </view>
        <view class="amount-options">
          <view 
            v-for="amount in rechargeAmounts" 
            :key="amount"
            class="amount-option"
            :class="{ active: selectedAmount === amount }"
            @click="selectAmount(amount)"
          >
            <text class="option-amount">¥{{ amount }}</text>
          </view>
        </view>
        <view class="custom-amount">
          <text class="custom-label">自定义金额：</text>
          <input 
            class="custom-input" 
            type="digit" 
            v-model="customAmount"
            placeholder="请输入充值金额"
            @input="onCustomAmountInput"
          />
        </view>
        <!-- 移除支付方式选择，在uni-pay页面中统一选择 -->
        <button class="confirm-recharge-btn" @click="confirmRecharge" :disabled="loading">
          {{ loading ? '处理中...' : `确认充值 ¥${getFinalAmount()}` }}
        </button>
      </view>
    </uni-popup>

    <!-- 充值记录 -->
    <view class="recharge-records">
      <view class="records-header">
        <text class="records-title">充值记录</text>
        <view class="records-right">
          <text class="refresh-time" v-if="lastRefreshTime > 0">
            最近刷新: {{ formatRefreshTime(lastRefreshTime) }}
          </text>
          <uni-icons 
            type="reload" 
            size="20" 
            color="#007AFF" 
            @click="refreshRecords"
          />
        </view>
      </view>
      <view class="records-list">
        <view 
          v-for="record in rechargeRecords" 
          :key="record._id"
          class="record-item"
        >
          <view class="record-info">
            <text class="record-amount">+¥{{ formatBalance(record.amount) }}</text>
            <text class="record-time">{{ formatTime(record.create_time) }}</text>
          </view>
          <view class="record-status">
            <text 
              class="status-text"
              :class="{ 
                'status-success': record.status === 'success',
                'status-pending': record.status === 'pending',
                'status-failed': record.status === 'failed'
              }"
            >
              {{ getStatusText(record.status) }}
            </text>
          </view>
        </view>
        <view v-if="rechargeRecords.length === 0" class="empty-records">
          <uni-icons type="wallet" size="48" color="#ccc" />
          <text class="empty-text">暂无充值记录</text>
        </view>
      </view>
    </view>
    
    <!-- 移除uni-pay组件，使用简单支付页面 -->
  </view>
</template>

<script>
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'

const database = uniCloud.database()

export default {
  data() {
    return {
      balance: 0,
      rechargeRecords: [],
      isH5Environment: false,
      // 充值相关属性
      rechargeAmounts: [0.01, 10, 20, 50, 100, 200, 500],
      selectedAmount: 10,
      customAmount: '',
      loading: false,
      // 缓存相关
      dataLoaded: false,
      lastRefreshTime: 0,
      cacheExpireTime: 5 * 60 * 1000, // 5分钟缓存过期
      isLoading: false
    }
  },
  computed: {
    userInfo() {
      return store.userInfo
    },
    hasLogin() {
      return store.hasLogin
    }
  },
  onLoad() {
    // 只在页面首次加载时调用
    this.initData()
    this.checkH5Environment()
    
    // 监听充值成功事件
    uni.$on('rechargeSuccess', this.handleRechargeSuccess)
  },
  onShow() {
    // 页面显示时，优先使用store中的持久化数据
    if (this.hasLogin && store.userInfo.balance !== undefined) {
      this.balance = store.userInfo.balance
    }
    
    // 如果数据已加载且缓存未过期，则使用缓存
    // 如果缓存过期或数据未加载，则重新加载
    if (this.shouldRefreshData()) {
      this.loadData()
    }
    // 检查是否有新的充值数据（无论缓存是否过期都要检查）
    this.checkNewRechargeData()
  },
  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('rechargeSuccess', this.handleRechargeSuccess)
  },
  methods: {
    // 判断是否需要刷新数据
    shouldRefreshData() {
      const now = Date.now()
      
      console.log('检查是否需要刷新数据 - 当前时间:', now, '最后刷新时间:', this.lastRefreshTime, '数据已加载:', this.dataLoaded)
      
      // 优先检查store中的持久化数据
      if (this.hasLogin && store.userInfo.balance !== undefined) {
        console.log('使用store中的持久化余额数据:', store.userInfo.balance)
        this.balance = store.userInfo.balance
        
        // 如果store中有余额数据，尝试使用本地缓存中的充值记录
        try {
          const cachedData = uni.getStorageSync('userBalanceCache')
          if (cachedData && cachedData.rechargeRecords && cachedData.timestamp && (now - cachedData.timestamp < this.cacheExpireTime)) {
            this.rechargeRecords = cachedData.rechargeRecords || []
            this.dataLoaded = true
            this.lastRefreshTime = cachedData.timestamp
            console.log('使用缓存的充值记录，记录数:', this.rechargeRecords.length)
            return false // 不需要刷新
          }
        } catch (error) {
          console.error('读取充值记录缓存失败:', error)
        }
      }
      
      // 检查本地存储中是否有完整缓存数据
      try {
        const cachedData = uni.getStorageSync('userBalanceCache')
        if (cachedData && cachedData.timestamp && (now - cachedData.timestamp < this.cacheExpireTime)) {
          // 如果缓存未过期，使用缓存数据
          console.log('使用本地缓存数据，余额:', cachedData.balance, '记录数:', cachedData.rechargeRecords?.length || 0)
          
          // 确保缓存数据完整
          if (cachedData.balance !== undefined && cachedData.rechargeRecords !== undefined) {
            this.balance = cachedData.balance || 0
            this.rechargeRecords = cachedData.rechargeRecords || []
            this.dataLoaded = true
            this.lastRefreshTime = cachedData.timestamp
            console.log('缓存数据完整，使用缓存')
            return false // 不需要刷新
          } else {
            console.log('缓存数据不完整，需要刷新')
          }
        } else if (cachedData && cachedData.timestamp) {
          console.log('缓存已过期，需要刷新')
        } else {
          console.log('无缓存数据，需要刷新')
        }
      } catch (error) {
        console.error('读取缓存数据失败:', error)
      }
      
      // 如果数据未加载或缓存已过期，则需要刷新
      const needRefresh = !this.dataLoaded || (now - this.lastRefreshTime) > this.cacheExpireTime
      console.log('最终决定:', needRefresh ? '需要刷新' : '不需要刷新')
      return needRefresh
    },
    
    // 初始化数据
    async initData() {
      if (this.isLoading) return
      this.isLoading = true
      
      try {
        // 优先使用store中的持久化余额数据
        if (this.hasLogin && store.userInfo.balance !== undefined) {
          this.balance = store.userInfo.balance
          // 尝试使用本地缓存中的充值记录
          try {
            const cachedData = uni.getStorageSync('userBalanceCache')
            if (cachedData && cachedData.rechargeRecords && cachedData.timestamp) {
              this.rechargeRecords = cachedData.rechargeRecords || []
              this.dataLoaded = true
              this.lastRefreshTime = cachedData.timestamp
              return
            }
          } catch (error) {
            console.error('读取充值记录缓存失败:', error)
          }
        }
        
        // 如果没有缓存数据，则加载数据
        await this.loadData()
      } finally {
        this.isLoading = false
      }
    },
    
    // 统一数据加载方法
    async loadData() {
      if (this.isLoading) return
      this.isLoading = true
      
      console.log('balance loadData!')
      try {
        // 并行加载余额和充值记录
        const [balanceResult, recordsResult] = await Promise.all([
          this.loadUserBalance(),
          this.loadRechargeRecords()
        ])
        
        console.log('数据加载结果 - 余额:', balanceResult, '记录:', recordsResult)
        
        // 更新缓存状态
        this.dataLoaded = true
        this.lastRefreshTime = Date.now()
        
        // 将数据存储到本地存储，供其他页面使用
        try {
          uni.setStorageSync('userBalanceCache', {
            balance: this.balance,
            rechargeRecords: this.rechargeRecords,
            timestamp: this.lastRefreshTime
          })
          
          console.log('缓存已更新 - 余额:', this.balance, '记录数:', this.rechargeRecords.length)
        } catch (error) {
          console.error('存储缓存数据失败:', error)
        }
        
        console.log('数据加载完成，余额:', this.balance, '记录数:', this.rechargeRecords.length)
      } catch (error) {
        console.error('数据加载失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 手动刷新数据（用户点击刷新按钮时）
    async refreshData() {
      // 强制刷新，忽略缓存
      this.dataLoaded = false
      this.lastRefreshTime = 0
      
      // 清除本地缓存数据，确保获取最新数据
      this.balance = 0
      this.rechargeRecords = []
      await this.loadData()
      uni.showToast({ title: '数据已刷新', icon: 'success' })
    },
    
    // 格式化余额显示
    formatBalance(balance) {
      return Number(balance || 0).toFixed(2)
    },
    
    // 格式化时间显示
    formatTime(timestamp) {
      if (!timestamp) return ''
      let date
      if (timestamp instanceof Date) {
        date = timestamp
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp)
      } else {
        return ''
      }
      
      if (Number.isNaN(date.getTime())) return ''
      
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    // 格式化刷新时间显示
    formatRefreshTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      if (Number.isNaN(date.getTime())) return ''
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'success': '成功',
        'pending': '处理中',
        'failed': '失败'
      }
      return statusMap[status] || '未知'
    },
    
    // 加载用户余额 - 从 kl-id-balance 表获取最新余额
    async loadUserBalance() {
      if (!this.hasLogin) return false
      try {
        console.log('开始加载用户余额')
        const res = await database
          .collection('kl-id-balance')
          .where('user_id == $env.uid') // 确保查询条件格式一致
          .orderBy('create_date', 'desc')
          .limit(1)
          .get()
        
        console.log('余额查询结果:', res.result.data)
        
        if (res.result.data && res.result.data.length > 0) {
          // 直接使用最新记录的 balance 字段，注意 balance 存储的是分，需要转换为元
          const rawBalance = res.result.data[0].balance || 0
          this.balance = rawBalance / 100
          console.log('余额设置成功:', this.balance, '原始值:', rawBalance)
          return true
        } else {
          this.balance = 0
          console.log('无余额记录，设置为0')
          return true
        }
      } catch (error) {
        console.error('加载余额失败:', error)
        return false
      }
    },
    
    // 刷新余额
    async refreshBalance() {
      await this.refreshData()
    },
    
    // 加载充值记录 - 从 kl-id-balance 表获取充值记录
    async loadRechargeRecords() {
      if (!this.hasLogin) return false
      try {
        console.log('开始加载充值记录')
        // 再查询充值记录
        const res = await database
          .collection('kl-id-balance')
          .where('user_id == $env.uid && type == 5') // 修复查询条件
          .orderBy('create_date', 'desc')
          .limit(20)
          .get()
        
        console.log('充值记录查询结果:', res.result.data)
        
        if (res.result.data && res.result.data.length > 0) {
          this.rechargeRecords = res.result.data.map(record => ({
            ...record,
            status: 'success', // 能查询到的记录都是成功的
            create_time: record.create_date,
            // 确保金额正确显示（amount 存储的是分，需要转换为元）
            amount: record.amount / 100
          }))
        } else {
          this.rechargeRecords = []
        }
        
        console.log('充值记录加载完成，数量:', this.rechargeRecords.length)
        return true
      } catch (error) {
        console.error('加载充值记录失败:', error)
        return false
      }
    },
    
    // 刷新充值记录
    async refreshRecords() {
      await this.refreshData()
    },
    
    // 显示充值弹窗
    showRechargeModal() {
      if (!this.hasLogin) {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
        })
        return
      }
      this.$refs.rechargePopup.open()
    },
    
    // 关闭充值弹窗
    closeRechargeModal() {
      this.$refs.rechargePopup.close()
      this.selectedAmount = 10
      this.customAmount = ''
    },
    
    // 选择充值金额
    selectAmount(amount) {
      this.selectedAmount = amount
      this.customAmount = ''
    },
    
    // 自定义金额输入
    onCustomAmountInput(e) {
      this.customAmount = e.detail.value
      this.selectedAmount = 0
    },
    
    // 获取最终充值金额
    getFinalAmount() {
      if (this.customAmount && this.customAmount > 0) {
        return Number(this.customAmount).toFixed(2)
      }
      return this.selectedAmount
    },
    
    // 确认充值
    async confirmRecharge() {
      const amount = this.getFinalAmount()
      if (!amount || amount <= 0) {
        uni.showToast({ title: '请输入有效金额', icon: 'none' })
        return
      }
      
      if (this.loading) return
      this.loading = true
      
      try {
        // 生成订单号
        const orderNo = `RECHARGE_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
        
        // 构建支付参数
        const options = {
          total_fee: Math.round(Number(amount) * 100), // 转换为分，确保是数字
          order_no: orderNo,
          description: `Recharge test ${amount} yuan`, // 使用英文避免编码问题
          type: 'recharge',
          custom: {
            user_id: store.userInfo._id,
            amount: Number(amount)
          }
        }
        
        // 关闭充值弹窗
        this.closeRechargeModal()
        
        // 跳转到uni-pay模块的支付页面
        const optionsStr = JSON.stringify(options)
        const url = `/uni_modules/uni-pay/pages/pay-desk/pay-desk?options=${encodeURIComponent(optionsStr)}`
        
        uni.navigateTo({
          url: url
        })
      } catch (error) {
        console.error('充值失败:', error)
        uni.showToast({ title: error.message || '充值失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 充值成功后更新本地缓存（供外部调用）
    updateLocalCache(rechargeData) {
      if (!rechargeData) return
      
      try {
        // 更新余额 - 基于当前余额加上充值金额
        if (rechargeData.amount) {
          // 注意：rechargeData.amount 存储的是分，需要转换为元
          const rechargeAmount = rechargeData.amount / 100
          this.balance += rechargeAmount
        }
        
        // 添加新的充值记录到列表顶部
        if (rechargeData.order_no) {
          const newRecord = {
            _id: rechargeData._id || `temp_${Date.now()}`,
            user_id: rechargeData.user_id,
            type: 5,
            amount: rechargeData.amount / 100, // 转换为元
            balance: this.balance, // 使用更新后的余额
            order_no: rechargeData.order_no,
            transaction_id: rechargeData.transaction_id,
            comment: rechargeData.comment,
            create_date: rechargeData.create_date || new Date(),
            create_time: rechargeData.create_date || new Date(),
            status: 'success'
          }
          
          // 添加到列表顶部
          this.rechargeRecords.unshift(newRecord)
          
          // 限制记录数量，避免列表过长
          if (this.rechargeRecords.length > 50) {
            this.rechargeRecords = this.rechargeRecords.slice(0, 50)
          }
        }
        
        // 更新缓存状态
        this.lastRefreshTime = Date.now()
        
        // 更新本地存储缓存，供其他页面使用
        try {
          uni.setStorageSync('userBalanceCache', {
            balance: this.balance,
            rechargeRecords: this.rechargeRecords,
            timestamp: this.lastRefreshTime
          })
          
          // 同时更新store中的余额，确保数据持久化
          if (this.hasLogin) {
            mutations.setUserInfo({ balance: this.balance })
          }
        } catch (error) {
          console.error('更新缓存失败:', error)
        }
        
        console.log('本地缓存已更新，新余额:', this.balance, '新记录数:', this.rechargeRecords.length)
      } catch (error) {
        console.error('更新本地缓存失败:', error)
      }
    },
    
    // 显示提现弹窗
    showWithdrawModal() {
      uni.showToast({ title: '提现功能开发中', icon: 'none' })
    },

    goBack() {
      uni.navigateBack()
    },
      
    // 支付成功回调（已移除，使用简单支付页面）
    
    // 更新用户余额
    async updateUserBalance(amount) {
      if (!this.hasLogin) return
      
      try {
        const res = await database
          .collection('uni-id-users')
          .where('_id == $env.uid')
          .update({
            balance: database.command.inc(amount)
          })
        
        if (res.updated) {
          // 更新本地余额显示
          this.balance += amount
          // 刷新充值记录
          this.loadRechargeRecords()
        }
      } catch (error) {
        console.error('更新余额失败:', error)
        uni.showToast({ title: '更新余额失败', icon: 'none' })
      }
    },

    // 处理充值成功通知
    handleRechargeSuccess(rechargeData) { 
      // 将充值数据存储到本地存储，供页面显示时使用
      try {
        uni.setStorageSync('lastRechargeData', {
          ...rechargeData,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('存储充值数据失败:', error)
      }
      
      // 立即更新本地缓存
      this.updateLocalCache(rechargeData)
      uni.showToast({ title: '充值成功', icon: 'success' })
    },
    
    // 检查是否有新的充值数据
    checkNewRechargeData() {
      try {
        const lastRechargeData = uni.getStorageSync('lastRechargeData')
        if (lastRechargeData && lastRechargeData.timestamp) {
          const now = Date.now()
          // 如果充值数据是最近5分钟内的，则更新缓存
          if (now - lastRechargeData.timestamp < 5 * 60 * 1000) {
            // 检查是否已经处理过这个订单
            const existingRecord = this.rechargeRecords.find(record => record.order_no === lastRechargeData.order_no)
            if (existingRecord) {
              console.log('该充值记录已存在，跳过重复添加')
            } else {
              this.updateLocalCache(lastRechargeData)
            }
            
            // 清除已使用的数据
            uni.removeStorageSync('lastRechargeData')
          } else {
            uni.removeStorageSync('lastRechargeData')
          }
        }
      } catch (error) {
        console.error('检查充值数据失败:', error)
      }
    },

    // 检查是否为H5环境
    checkH5Environment() {
      // #ifdef H5
      this.isH5Environment = true
      // #endif
      
      // #ifndef H5
      this.isH5Environment = false
      // #endif
      
      // #ifdef APP
      console.log('运行在APP环境')
      // #endif
      
      // #ifdef H5
      console.log('运行在H5环境')
      // #endif
      
      // #ifdef MP
      console.log('运行在小程序环境')
      // #endif
    }
  }
}
</script>

<style lang="scss" scoped>
.balance-container {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 20rpx;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  color: white;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.balance-title {
  font-size: 32rpx;
  font-weight: 500;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 40rpx;
}

.amount-symbol {
  font-size: 40rpx;
  margin-right: 10rpx;
}

.amount-value {
  font-size: 80rpx;
  font-weight: bold;
}

.balance-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recharge-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.withdraw-btn {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.recharge-modal {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  padding: 40rpx;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 500;
}

.amount-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.amount-option {
  width: calc(50% - 10rpx);
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
}

.amount-option.active {
  border-color: #007AFF;
  background: #f0f8ff;
  color: #007AFF;
}

.custom-amount {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.custom-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 20rpx;
}

.custom-input {
  flex: 1;
  height: 60rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.payment-methods {
  margin-bottom: 40rpx;
}

.methods-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.method-options {
  display: flex;
  gap: 20rpx;
}

.method-option {
  flex: 1;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.method-option.active {
  border-color: #007AFF;
  background: #f0f8ff;
}

.method-text {
  font-size: 28rpx;
  color: #333;
}

.confirm-recharge-btn {
  width: 100%;
  height: 80rpx;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.confirm-recharge-btn:disabled {
  background: #ccc;
}

.recharge-records {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.records-title {
  font-size: 32rpx;
  font-weight: 500;
}

.records-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.refresh-time {
  font-size: 24rpx;
  color: #999;
}

.records-list {
  min-height: 200rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.record-amount {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 5rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-status {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.status-success {
  background: #e8f5e8;
  color: #52c41a;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-failed {
  background: #fff2f0;
  color: #ff4d4f;
}

.empty-records {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

.h5-test-section {
  margin-top: 30rpx;
  text-align: center;
  
  .h5-test-btn {
    background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
    color: white;
    border: none;
    border-radius: 40rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 15rpx;
  }
  
  .h5-test-tip {
    display: block;
    font-size: 24rpx;
    color: #666;
    line-height: 1.5;
  }
}

.debug-section {
  margin-top: 30rpx;
  text-align: center;
  
  .debug-btn {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    border: none;
    border-radius: 40rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    font-weight: bold;
  }
}
</style>