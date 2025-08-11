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
        <uni-icons 
          type="reload" 
          size="24" 
          color="#007AFF" 
          @click="refreshBalance"
        />
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
        <uni-icons 
          type="reload" 
          size="20" 
          color="#007AFF" 
          @click="refreshRecords"
        />
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
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

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
      loading: false
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
    this.loadUserBalance()
    this.loadRechargeRecords()
    this.checkH5Environment()
  },
  onShow() {
    this.loadUserBalance()
  },
  methods: {
    // 格式化余额显示
    formatBalance(balance) {
      return Number(balance || 0).toFixed(2)
    },
    
    // 格式化时间显示
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
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
    
    // 加载用户余额
    async loadUserBalance() {
      if (!this.hasLogin) return
      try {
        const res = await database
          .collection('uni-id-users')
          .where('_id == $env.uid')
          .field('balance')
          .get()
        
        this.balance = res.result.data[0]?.balance || 0
      } catch (error) {
        console.error('加载余额失败:', error)
      }
    },
    
    // 刷新余额
    async refreshBalance() {
      await this.loadUserBalance()
      uni.showToast({ title: '余额已刷新', icon: 'success' })
    },
    
    // 加载充值记录
    async loadRechargeRecords() {
      if (!this.hasLogin) return
      try {
        const res = await database
          .collection('recharge-records')
          .where('user_id == $env.uid')
          .orderBy('create_time', 'desc')
          .limit(20)
          .get()
        
        this.rechargeRecords = res.result.data
      } catch (error) {
        console.error('加载充值记录失败:', error)
      }
    },
    
    // 刷新充值记录
    async refreshRecords() {
      await this.loadRechargeRecords()
      uni.showToast({ title: '记录已刷新', icon: 'success' })
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
        
        console.log('支付参数:', options)
        console.log('金额:', amount, 'total_fee:', options.total_fee)
        
        // 关闭充值弹窗
        this.closeRechargeModal()
        
        // 跳转到uni-pay模块的支付页面
        const optionsStr = JSON.stringify(options)
        const url = `/uni_modules/uni-pay/pages/pay-desk/pay-desk?options=${encodeURIComponent(optionsStr)}`
        console.log('跳转URL:', url)
        
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

    // 检查是否为H5环境
    checkH5Environment() {
      // #ifdef H5
      this.isH5Environment = true
      // #endif
      
      // #ifndef H5
      this.isH5Environment = false
      // #endif
      
      // 添加环境调试信息
      console.log('=== 环境检测 ===')
      console.log('isH5Environment:', this.isH5Environment)
      console.log('当前平台:', uni.getSystemInfoSync().platform)
      console.log('当前环境:', process.env.NODE_ENV)
      
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