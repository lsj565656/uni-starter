<template>
  <view class="point-detail">
    <!-- 顶部积分显示和标签栏 -->
    <view class="header-section">
      <!-- 积分总额和标签栏行 -->
      <view class="header-row">
        <!-- 左侧积分总额 -->
        <view class="point-total-section">
          <text class="point-total">{{ userScore }}</text>
        </view>
        
        <!-- 右侧标签栏 -->
        <view class="tab-bar">
          <text 
            v-for="(tabItem, index) in tabOptions" 
            :key="index"
            :class="{ active: tabIndex === index }" 
            @click="onTabClick(index)"
          >
            {{ tabItem }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 页面内容区域 -->
    <view class="page-content">
      <!-- 积分明细列表 -->
      <view class="detail-list">
        <!-- 加载中状态 -->
        <view v-if="loading && filteredList.length === 0" class="loading-state">
          <uni-icons type="spinner-cycle" size="48" color="#1976d2" />
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态显示 -->
        <view v-else-if="!loading && filteredList.length === 0" class="empty-state">
          <uni-icons v-if="error" type="error" size="48" color="#f44336" />
          <uni-icons v-else type="info" size="48" color="#ccc" />
          <text class="empty-text">{{ error || '暂无积分明细' }}</text>
          <text class="empty-desc">{{ error ? '请检查网络连接后重试' : '您还没有积分变动记录' }}</text>
          <button v-if="error" class="retry-btn" @click="refresh">重试</button>
        </view>
        
        <!-- 积分明细项 -->
        <view 
          class="detail-item" 
          v-for="item in filteredList" 
          :key="item._id"
        >
          <view class="item-left">
            <text class="desc">{{ getDisplayComment(item) }}</text>
            <text class="type-desc">{{ item.typeDesc }}</text>
          </view>
          <view class="item-right">
            <text :class="['score', item.score > 0 ? 'plus' : 'minus']">
              {{ item.score > 0 ? '+' : '' }}{{ item.score }}
            </text>
            <text class="time">{{ formatTime(item.create_date) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <uni-load-state 
        class="load-state" 
        :state="{ data: filteredList, pagination, hasMore, loading, error }"
        @loadMore="loadMore" 
        @networkResume="refresh" 
        noMoreText="没有更多了" 
      />
    </view>
  </view>
</template>

<script>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'

export default {
  components: {
    uniIcons
  },
  data() {
    return {
      userScore: 0,
      tabOptions: ['全部', '已获取', '已消耗'],
      tabIndex: 0,
      detailList: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      pagination: {},
      error: '',
      // 缓存相关
      detailPageCache: {},
      cacheExpire: 60_000, // 1分钟缓存过期
      // 当前筛选条件
      currentFilter: 'all'
    }
  },
  
  computed: {
    filteredList() {
      // 移除前端筛选逻辑，直接显示云函数返回的数据
      // 云函数已经根据type参数进行了正确的筛选
      return this.detailList
    }
  },
  
  onLoad() {
    this.initPage()
  },
  
  onPullDownRefresh() {
    this.refresh()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  onShow() {
    // 页面显示时检查缓存
    this.checkCache()
  },
  
  methods: {
    // 初始化页面
    async initPage() {
      await this.getUserScore()
      await this.fetchScoreHistory({ reset: true })
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
    
    // 获取缓存键
    getCacheKey() {
      // 根据标签索引确定筛选类型
      let type = 'all'
      if (this.tabIndex === 1) type = 'get'
      if (this.tabIndex === 2) type = 'cost'
      
      // 缓存键包含标签索引和筛选类型，确保不同标签数据不相互干扰
      return `${this.tabIndex}_${type}`
    },
    
    // 获取积分历史
    async fetchScoreHistory({ reset = false } = {}) {
      const cacheKey = this.getCacheKey()
      const now = Date.now()

      if (reset) {
        this.page = 1
        this.detailList = []
        this.hasMore = true
        this.pagination = {}
      }

      // 只在第一页且reset=false时使用缓存
      if (
        !reset &&
        this.page === 1 &&
        this.detailPageCache[cacheKey] &&
        now - this.detailPageCache[cacheKey].ts < this.cacheExpire
      ) {
        const cached = this.detailPageCache[cacheKey].data
        this.detailList = cached.detailList
        this.hasMore = cached.hasMore
        this.pagination = cached.pagination
        return
      }

      if ((!this.hasMore && !reset) || this.loading) return
      this.loading = true

      try {
        // 根据标签索引确定筛选类型
        let type = 'all'
        if (this.tabIndex === 1) type = 'get'
        if (this.tabIndex === 2) type = 'cost'

        const uid = store.userInfo._id || store.userInfo.uid

        const res = await uniCloud.callFunction({
          name: 'point-center',
          data: {
            action: 'getScoreHistory',
            uid: uid,
            data: {
              page: this.page,
              pageSize: this.pageSize,
              type: type
            }
          }
        })
        
        if (res.result.code === 200) {
          const { list, total } = res.result.data
          
          if (this.page === 1) {
            this.detailList = list || []
            // 写入缓存快照
            this.detailPageCache[cacheKey] = {
              ts: now,
              data: {
                detailList: this.detailList,
                hasMore: (list || []).length >= this.pageSize,
                pagination: {
                  total: res.result.data.total,
                  page: res.result.data.page,
                  pageSize: res.result.data.pageSize
                }
              }
            }
          } else {
            this.detailList = [...this.detailList, ...(list || [])]
          }
          
          this.hasMore = (list || []).length >= this.pageSize
          this.pagination = {
            total: res.result.data.total,
            page: res.result.data.page,
            pageSize: res.result.data.pageSize
          }
        } else {
          console.error('获取积分历史失败:', res.result)
          this.error = res.result?.message || '获取数据失败'
        }
      } catch (error) {
        console.error('获取积分历史异常:', error)
        this.error = '网络异常，请重试'
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },
    
    // 标签点击事件
    onTabClick(index) {
      if (this.tabIndex === index) return
      
      this.tabIndex = index
      this.page = 1
      this.detailList = []
      this.hasMore = true
      this.pagination = {}

      // 切换标签时检查缓存有效性
      const cacheKey = this.getCacheKey()
      const now = Date.now()
      if (
        this.detailPageCache[cacheKey] &&
        now - this.detailPageCache[cacheKey].ts < this.cacheExpire
      ) {
        const cached = this.detailPageCache[cacheKey].data
        this.detailList = cached.detailList
        this.hasMore = cached.hasMore
        this.pagination = cached.pagination
      } else {
        // 无缓存或缓存过期，重新获取数据
        this.fetchScoreHistory({ reset: true })
      }
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page += 1
      // 不走缓存，直接拉下一页
      this.fetchScoreHistory({ reset: false })
    },
    
    // 刷新数据
    refresh() {
      this.page = 1
      this.fetchScoreHistory({ reset: true })
    },
    
    // 检查缓存
    checkCache() {
      // 页面显示时检查缓存有效性
      const cacheKey = this.getCacheKey()
      const now = Date.now()
      if (
        this.detailPageCache[cacheKey] &&
        now - this.detailPageCache[cacheKey].ts < this.cacheExpire
      ) {
        const cached = this.detailPageCache[cacheKey].data
        this.detailList = cached.detailList
        this.hasMore = cached.hasMore
        this.pagination = cached.pagination
      }
    },
    
    // 获取显示文本
    getDisplayComment(item) {
      console.log('getDisplayComment 被调用:', {
        type: item.type,
        typeDesc: item.typeDesc,
        comment: item.comment,
        commentLength: item.comment ? item.comment.length : 0
      })
      
      // 如果type为1且comment为空或未设置，显示默认文本"签到积分"
      if (item.type === 1 && (!item.comment || item.comment.trim() === '')) {
        console.log('显示默认文本: 签到积分')
        return '签到积分'
      }
      
      // 否则返回原始comment
      const result = item.comment || '无描述'
      console.log('显示原始文本:', result)
      return result
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
    }
  }
}
</script>

<style scoped>
.point-detail {
  background: #f8f8f8;
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

/* 头部区域 - 粘性布局 */
.header-section {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

/* 头部行布局 */
.header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 24rpx;
  min-height: 80rpx;
}

/* 左侧积分总额区域 */
.point-total-section {
  display: flex;
  align-items: baseline;
  position: absolute;
  left: 32rpx;
}

.point-total {
  font-size: 48rpx;
  color: #ff9800;
  font-weight: bold;
  line-height: 1;
}

/* 右侧标签栏 */
.tab-bar {
  display: flex;
  gap: 48rpx;
}

.tab-bar text {
  font-size: 28rpx;
  color: #888;
  padding: 8rpx 0;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-bar .active {
  color: #1976d2;
  font-weight: 500;
}

.tab-bar .active::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 32rpx;
  height: 4rpx;
  background: #1976d2;
  border-radius: 2rpx;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-list {
  flex: 1;
  padding: 0 24rpx;
}

.detail-item {
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  padding: 20rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.item-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.desc {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.type-desc {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  display: inline-block;
  width: fit-content;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.score {
  font-size: 28rpx;
  font-weight: bold;
}

.plus {
  color: #4caf50;
}

.minus {
  color: #f44336;
}

.time {
  font-size: 22rpx;
  color: #bbb;
}

.load-state {
  margin: 20rpx 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  color: #999;
}

.loading-text {
  font-size: 28rpx;
  margin-top: 20rpx;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  color: #999;
}

.empty-text {
  font-size: 28rpx;
  margin: 20rpx 0 8rpx 0;
  color: #666;
}

.empty-desc {
  font-size: 24rpx;
  color: #bbb;
}

.retry-btn {
  margin-top: 20rpx;
  padding: 10rpx 20rpx;
  background-color: #1976d2;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #1565c0;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .header-row {
    padding: 16rpx 20rpx;
  }
  
  .tab-bar {
    gap: 32rpx;
  }
  
  .point-total {
    font-size: 44rpx;
  }
  
  .point-label {
    font-size: 22rpx;
  }
  
  .tab-bar text {
    font-size: 26rpx;
  }
  
  .detail-item {
    padding: 16rpx 12rpx;
  }
  
  .desc {
    font-size: 26rpx;
  }
  
  .score {
    font-size: 26rpx;
  }
}
</style>
