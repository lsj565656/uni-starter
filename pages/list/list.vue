<template>
  <view class="pages">
    <view v-if="loginNoticeVisible" class="login-notice-bar" @click="handleLoginNoticeClick">
      去登录 &gt;
    </view>

    <!-- 自定义头部导航 -->
    <!-- #ifdef MP-WEIXIN -->
    <uni-nav-bar 
      height="44px" 
      :fixed="true" 
      :shadow="false"
      :border="false"
      background-color="#ffffff"
      color="#333333"
      status-bar
      @clickLeft="goBack"
      @clickRight="toggleFilterDrawer">
      <template #left>
        <uni-icons type="left" size="20" color="#333" />
      </template>
      <template #default>
        <view class="search-container">
          <uni-search-bar 
            v-model="keyword" 
            ref="searchBar" 
            radius="100" 
            cancelButton="auto" 
            clearButton="none" 
            class="searchBar"
            disabled
            :placeholder="inputPlaceholder" 
            @clear.stop="resetKeyword" 
            @cancel.stop="resetKeyword" />
          <view class="search-click-area" @click.stop="goToSearch"></view>
        </view>
      </template>
    </uni-nav-bar>
    <!-- #endif -->
    
    <!-- #ifndef MP-WEIXIN -->
    <view class="custom-navbar">
      <view class="navbar-search-app">
        <view style="position: relative; width: 90%">
          <uni-search-bar v-model="keyword" ref="searchBar" radius="100" cancelButton="auto" clearButton="none" disabled
            :placeholder="inputPlaceholder" @clear="resetKeyword" @cancel="resetKeyword" />
          <view class="search-click-area" @click="goToSearch"
            style="position: absolute; left: 0; top: 0; bottom: 0; right: 10%; z-index: 2"></view>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 分类栏 -->
    <view class="sticky-bar" :style="stickyBarStyle">
      <!-- 左侧返回全部按钮 -->
      <view v-if="showBackToAllBtn" class="back-to-all-btn" :style="stickyBarStyle" @click.stop="backToAll">
        <uni-icons type="left" size="20" color="#4c82ff" />
      </view>

      <scroll-view class="category-scroll" scroll-x scroll-with-animation :scroll-left="categoryScrollLeft"
        ref="categoryScroll" style="white-space: nowrap">
        <view v-for="(item, index) in categoryNames" :key="index" :id="'cat-' + index" class="seg-item"
          :class="{ active: currentCategory === index }" :style="categoryItemStyle"
          @click="onCategoryChange({ currentIndex: index })">
          {{ item }}
          <view v-if="currentCategory === index" class="seg-underline"></view>
        </view>
        <!-- 虚拟留白 - 确保最后一个分类项能完整显示 -->
        <view :style="{
          display: 'inline-block',
          width: '16px',
          height: '1px'
        }"></view>
      </scroll-view>
      <!-- 筛选按钮 -->
      <view class="filter-icon-btn" :style="stickyBarStyle" @click.stop="toggleFilterDrawer">
        <uni-badge :text="activeFilterCount" :absolute="'true'" :offset="[0, 0]" :is-dot="false"
          v-if="activeFilterCount > 0">
          <uni-icons type="tune" size="26" color="#4c82ff" />
        </uni-badge>
        <uni-icons v-else type="tune" size="26" color="#4c82ff" />
      </view>
    </view>

    <!-- 筛选抽屉 -->
    <uni-drawer ref="filterDrawer" mode="right" :mask="true" :mask-click="false" :width="300" style="z-index: 9999 !important;"
      @close="onFilterDrawerClose" @open="onFilterDrawerOpen">
      <view class="filter-drawer-content" :style="stickyBarStyle" @click.stop>
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
        </view>

        <!-- 当前筛选条件展示 -->
        <view v-if="activeFilterCount > 0" class="current-filters">
          <text class="current-filters-label">当前筛选：</text>
          <text class="current-filters-text">{{ currentFilterText }}</text>
        </view>

        <!-- 仅看类型按钮并排，无文本 -->
        <view class="filter-section mode-switch-row">
          <button :class="['mode-switch-btn', mode === 'score' ? 'active' : '']" :disabled="isFiltering"
            @click="onModeSwitch('score')">
            仅看积分
          </button>
          <button :class="['mode-switch-btn', mode === 'price' ? 'active' : '']" :disabled="isFiltering"
            @click="onModeSwitch('price')">
            仅看价格
          </button>
        </view>

        <view class="filter-section" v-if="mode === 'score' || mode === 'price'">
          <text class="filter-label">{{ mode === 'score' ? '积分排序' : '价格排序' }}</text>
          <uni-data-select v-model="selectedScoreOrPriceSort" :localdata="scoreOrPriceSortOptions" placeholder="不排序"
            :clear="true" :disabled="isFiltering" class="filter-select" />
        </view>

        <view class="filter-section">
          <text class="filter-label">点赞排序</text>
          <uni-data-select v-model="selectedLikeSort" :localdata="likeSortOptions" placeholder="不排序" :clear="true"
            :disabled="isFiltering" class="filter-select" />
        </view>

        <view class="filter-section">
          <text class="filter-label">发布时间排序</text>
          <uni-data-select v-model="selectedDateSort" :localdata="dateSortOptions" placeholder="不排序" :clear="true"
            :disabled="isFiltering" class="filter-select" />
        </view>

        <view class="filter-section">
          <text class="filter-label">最大参与人数排序</text>
          <uni-data-select v-model="selectedScaleSort" :localdata="scaleSortOptions" placeholder="不排序" :clear="true"
            :disabled="isFiltering" class="filter-select" />
        </view>

        <!-- 清空筛选和取消按钮并排 -->
        <view class="filter-actions filter-actions-row">
          <button class="filter-btn filter-btn-reset" :class="{ 'filter-btn-disabled': !hasActiveFilters }"
            :disabled="!hasActiveFilters" @click.stop="resetFilter">
            清空筛选
          </button>
          <button class="filter-btn filter-btn-reset" @click.stop="onDrawerContentClick">
            取消
          </button>
        </view>
      </view>
    </uni-drawer>

    <view class="masonry-scroll">
      <view class="masonry-row">
        <view class="masonry-col" v-for="(col, colIdx) in getColumnsFiltered(tasksList)" :key="colIdx">
          <task-card v-for="item in col" :key="item._id" :task="withLikeStatus(item)" :user="item.userInfo"
            @favorite="actionsClick('收藏', $event)" @comment="actionsClick('评论', $event)"
            @join="actionsClick('加入', $event)" @like="actionsClick('点赞', $event)" />
        </view>
      </view>
      <uni-load-state class="load-state" :state="{ data: tasksList, pagination, hasMore, loading, error }"
        @loadMore="loadMore" @networkResume="refresh" noMoreText="没有更多了" />
    </view>
  </view>
</template>

<script>
import taskCard from '@/components/task-card/task-card.vue'
import { useTaskLikeStore } from '@/store/taskLike.js'
import statusBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar'
import { categories } from '@/utils/categories'
import { toggleTaskLike } from '@/utils/taskLike.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { getStatusBarHeight, getWindowWidth } from '@/utils/tools.js'

export default {
  components: {
    statusBar,
    taskCard
  },
  data() {
    return {
      keyword: '',
      currentCategory: 0,
      mode: '',
      selectedScoreOrPriceSort: '',
      selectedLikeSort: '',
      selectedDateSort: '',
      selectedScaleSort: '',
      page: 1,
      pageSize: 20,
      tasksList: [],
      hasMore: true,
      loading: false,
      error: '',
      isFiltering: false,
      showFilterDrawer: false,
      isFilterModalOpen: false, // 新增：筛选弹窗状态管理
      statusBarHeight: 0,
      CUSTOM_NAVBAR_HEIGHT: 48,
      FILTER_BAR_HEIGHT: 48,
      filterBarOffset: 0,
      lastScrollTop: 0,
      colListKey: 0,
      showBackToAllBtn: false,
      categoryScrollLeft: 0,
      categoryCache: {},
      displayData: [],
      lastRequestedCategoryId: 0,
      lastCacheWriteScene: '',
      pagination: {},
      sortKey: 'time',
      sortOptions: [
        { label: '时间优先', value: 'time' },
        { label: '价值优先', value: 'value' }
      ],
      priceRangeOptions: [
        { value: '', text: '全部价格' },
        { value: '0-50', text: '0-50元' },
        { value: '50-100', text: '50-100元' },
        { value: '100-200', text: '100-200元' },
        { value: '200-500', text: '200-500元' },
        { value: '500+', text: '500元以上' }
      ],
      scoreRangeOptions: [
        { value: '', text: '全部积分' },
        { value: '0-200', text: '0~200积分' },
        { value: '200-500', text: '200~500积分' },
        { value: '500+', text: '500积分以上' }
      ],
      likeSortOptions: [
        { value: 'asc', text: '点赞数升序' },
        { value: 'desc', text: '点赞数降序' }
      ],
      dateSortOptions: [
        { value: 'asc', text: '发布时间升序' },
        { value: 'desc', text: '发布时间降序' }
      ],
      scaleSortOptions: [
        { value: 'asc', text: '规模升序' },
        { value: 'desc', text: '规模降序' }
      ],
      taskCache: {},
      cacheExpire: 120_000, // 1分钟
      loginNoticeVisible: false,
      loginNoticeTimer: null,
      isWeixin: false,
      navBarHeight: 0
    }
  },
  computed: {
    listCategories() {
      return categories.filter(c => c.use_list)
    },
    categoryNames() {
      return this.listCategories.map(c => c.text)
    },
    scoreOrPriceSortOptions() {
      return this.mode === 'score'
        ? [
          { value: 'asc', text: '积分升序' },
          { value: 'desc', text: '积分降序' }
        ]
        : [
          { value: 'asc', text: '价格升序' },
          { value: 'desc', text: '价格降序' }
        ]
    },
    activeFilterCount() {
      let count = 0
      if (this.mode === 'price' || this.mode === 'score') count++
      if (this.selectedScoreOrPriceSort) count++
      if (this.selectedLikeSort) count++
      if (this.selectedDateSort) count++
      if (this.selectedScaleSort) count++
      return count
    },
    currentFilterText() {
      const filters = []
      if (this.mode === 'price') {
        filters.push('仅看价格')
        if (this.selectedScoreOrPriceSort) {
          const opt = this.scoreOrPriceSortOptions.find(
            option => option.value === this.selectedScoreOrPriceSort
          )
          if (opt) filters.push(opt.text)
        }
      } else if (this.mode === 'score') {
        filters.push('仅看积分')
        if (this.selectedScoreOrPriceSort) {
          const opt = this.scoreOrPriceSortOptions.find(
            option => option.value === this.selectedScoreOrPriceSort
          )
          if (opt) filters.push(opt.text)
        }
      }
      if (this.selectedLikeSort) {
        const opt = this.likeSortOptions.find(option => option.value === this.selectedLikeSort)
        if (opt) filters.push('点赞' + (opt.value === 'asc' ? '升序' : '降序'))
      }
      if (this.selectedDateSort) {
        const opt = this.dateSortOptions.find(option => option.value === this.selectedDateSort)
        if (opt) filters.push(opt.text)
      }
      if (this.selectedScaleSort) {
        const opt = this.scaleSortOptions.find(option => option.value === this.selectedScaleSort)
        if (opt) filters.push('最大参与人数' + (opt.value === 'asc' ? '升序' : '降序'))
      }
      return filters.join(', ')
    },
    hasActiveFilters() {
      return this.activeFilterCount > 0
    },
    categoryItemStyle() {
      const screenWidth = getWindowWidth()
      const VISIBLE_COUNT = 4.5
      const marginPx = 8
      const itemWidth = Math.floor(
        (screenWidth - 32 - (VISIBLE_COUNT - 1) * marginPx * 2) / VISIBLE_COUNT
      )
      return {
        width: itemWidth + 'px',
        margin: `0 ${marginPx}px`,
        minWidth: itemWidth + 'px',
        maxWidth: itemWidth + 'px',
        flexShrink: '0'
      }
    },
    inputPlaceholder() {
      return uni.getStorageSync('CURRENT_LANG') == 'en'
        ? 'Please enter the search content'
        : '请输入'
    },
    stickyBarStyle() {
      if (this.isWeixin) {
        return {
          top: `${this.navBarHeight}px`
        }
      }
      return {
        top: '60px'
      }
    }
  },
  watch: {
    keyword() {
      this.fetchTasks({ reset: true })
    },
    selectedScoreOrPriceSort() {
      this.fetchTasks({ reset: true })
    },
    selectedLikeSort() {
      this.fetchTasks({ reset: true })
    },
    selectedDateSort() {
      this.fetchTasks({ reset: true })
    },
    selectedScaleSort() {
      this.fetchTasks({ reset: true })
    },
    mode() {
      this.fetchTasks({ reset: true })
    },
    currentCategory() {
      this.fetchTasks({ reset: true })
    }
  },
  methods: {
    getOrderByArray() {
      // 固定优先级顺序拼接排序数组
      const array = []
      // 1. 积分/价格排序（互斥，优先级最高）
      if (this.mode === 'score' && this.selectedScoreOrPriceSort) {
        array.push({ field: 'score', order: this.selectedScoreOrPriceSort })
      } else if (this.mode === 'price' && this.selectedScoreOrPriceSort) {
        array.push({ field: 'price', order: this.selectedScoreOrPriceSort })
      }
      // 2. 点赞排序
      if (this.selectedLikeSort) {
        array.push({ field: 'like_count', order: this.selectedLikeSort })
      }
      // 3. 发布时间排序
      if (this.selectedDateSort) {
        array.push({ field: 'create_date', order: this.selectedDateSort })
      }
      // 4. 最大参与人数排序
      if (this.selectedScaleSort) {
        array.push({ field: 'max_participants', order: this.selectedScaleSort })
      }
      // 默认排序
      if (array.length === 0) {
        array.push({ field: 'create_date', order: 'desc' })
      }
      return array
    },
    async fetchTasks({ reset = false, force = false } = {}) {
      const cacheKey = JSON.stringify({
        keyword: this.keyword,
        category: this.currentCategory,
        mode: this.mode,
        selectedScoreOrPriceSort: this.selectedScoreOrPriceSort,
        selectedLikeSort: this.selectedLikeSort,
        selectedDateSort: this.selectedDateSort,
        selectedScaleSort: this.selectedScaleSort,
        page: this.page,
        pageSize: this.pageSize,
        orderBy: this.getOrderByArray()
      })
      const now = Date.now()
      // 只缓存第一页
      if (
        reset &&
        !force &&
        this.taskCache[cacheKey] &&
        now - this.taskCache[cacheKey].ts < this.cacheExpire
      ) {
        const cached = this.taskCache[cacheKey].data
        this.tasksList = cached.tasksList
        this.hasMore = cached.hasMore
        this.pagination = cached.pagination
        return
      }
      this.loading = true
      this.error = ''
      if (reset) {
        this.page = 1
        this.tasksList = []
        this.hasMore = true
      }
      try {
        const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid
        const category =
          this.currentCategory === 0 ? '' : this.listCategories[this.currentCategory]?.catId
        const orderByArray = this.getOrderByArray()
        const res = await uniCloud.callFunction({
          name: 'getAllTasks',
          data: {
            userId,
            keyword: this.keyword,
            orderBy: orderByArray,
            page: this.page,
            pageSize: this.pageSize,
            category,
            mode: this.mode
            // 其他筛选参数可加
          }
        })
        if (res.result && res.result.code === 0) {
          const rawList = res.result.data || []
          this.tasksList = reset ? rawList : [...this.tasksList, ...rawList]
          this.hasMore = res.result.hasMore
          this.pagination = {
            total: res.result.total,
            page: res.result.page,
            pageSize: res.result.pageSize
          }
          // 缓存第一页快照
          if (reset) {
            this.taskCache[cacheKey] = {
              ts: now,
              data: {
                tasksList: this.tasksList,
                hasMore: this.hasMore,
                pagination: this.pagination
              }
            }
          }
          // 同步已点赞任务到 useTaskLikeStore
          const taskLikeStore = useTaskLikeStore()
          for (const item of rawList) {
            if (item.is_liked) {
              taskLikeStore.setLike(item._id, true, item.like_count)
            }
          }
        } else {
          this.error = res.result?.message || '加载失败'
        }
      } catch (error) {
        this.error = error.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page += 1
        this.fetchTasks()
      }
    },
    refresh() {
      this.fetchTasks({ reset: true, force: true })
      uni.stopPullDownRefresh()
    },
    getColumnsFiltered(data) {
      const cols = [[], []]
      for (const [index, item] of (data || []).entries()) {
        cols[index % 2].push(item)
      }
      return cols
    },
    withLikeStatus(item) {
      const taskLikeStore = useTaskLikeStore()
      const likeInfo = taskLikeStore.getLike(item._id)
      return {
        ...item,
        is_liked: likeInfo ? likeInfo.isLiked : item.is_liked,
        like_count: likeInfo ? likeInfo.likeCount : item.like_count
      }
    },
    actionsClick(type, item) {
      if (type === '点赞') {
        // 登录校验
        const userInfo = store.userInfo
        if (!userInfo || !userInfo._id) {
          this.showLoginNotice()
          return
        }
        if (!item._id) return
        const taskLikeStore = useTaskLikeStore()
        const taskId = item._id
        const likeInfo = taskLikeStore.getLike(taskId)
        const oldLiked = likeInfo ? likeInfo.isLiked : false
        const oldCount = likeInfo ? likeInfo.likeCount : item.like_count
        // 乐观UI
        const newLiked = !oldLiked
        const newCount = oldLiked ? oldCount - 1 : oldCount + 1
        taskLikeStore.setLike(taskId, newLiked, newCount)
        toggleTaskLike(taskId, oldLiked)
          .then(({ isLiked, likeCount }) => {
            taskLikeStore.setLike(taskId, isLiked, likeCount)
          })
          .catch(error => {
            taskLikeStore.setLike(taskId, oldLiked, oldCount)
            uni.showToast({ title: error.message || '操作失败', icon: 'none' })
          })
      } else {
        uni.showToast({ title: `${type}功能开发中`, icon: 'none' })
      }
    },
    goToSearch() {
      uni.hideKeyboard()
      uni.navigateTo({
        url: '/pages/list/search/search?keyword=' + encodeURIComponent(this.keyword),
        animationType: 'fade-in'
      })
    },
    resetKeyword() {
      this.keyword = ''
      getApp().globalData.searchText = ''
      this.fetchTasks({ reset: true })
    },
    onCategoryChange(e) {
      const newCategoryIndex = e.currentIndex
      this.currentCategory = newCategoryIndex
      this.scrollCategoryToCenter(newCategoryIndex)
      this.fetchTasks({ reset: true })
    },
    onModeSwitch(mode) {
      if (this.mode === mode) return
      this.mode = mode
      this.selectedScoreOrPriceSort = ''
      this.fetchTasks({ reset: true })
    },
    toggleFilterDrawer() {
      this.showFilterDrawer = !this.showFilterDrawer
      if (this.showFilterDrawer && this.$refs.filterDrawer) {
        this.$refs.filterDrawer.open()
        this.isFilterModalOpen = true
      } else if (!this.showFilterDrawer && this.$refs.filterDrawer) {
        this.$refs.filterDrawer.close()
        this.isFilterModalOpen = false
      }
    },
    openFilterDrawer() {
      if (this.$refs.filterDrawer) this.$refs.filterDrawer.open()
    },
    closeFilterDrawer() {
      if (this.$refs.filterDrawer) {
        this.$refs.filterDrawer.close()
        this.showFilterDrawer = false
        this.isFilterModalOpen = false
      }
    },
    onFilterDrawerOpen() {
      this.showFilterDrawer = true
      this.isFilterModalOpen = true
    },
    onFilterDrawerClose() {
      this.showFilterDrawer = false
      this.isFilterModalOpen = false
    },
    onDrawerContentClick() {
      if (this.$refs.filterDrawer) {
        this.$refs.filterDrawer.close()
        this.showFilterDrawer = false
      }
    },
    resetFilter() {
      this.mode = ''
      this.selectedScoreOrPriceSort = ''
      this.selectedLikeSort = ''
      this.selectedDateSort = ''
      this.selectedScaleSort = ''
      this.fetchTasks({ reset: true })
      this.showFilterDrawer = false
      this.closeFilterDrawer()
    },
    scrollCategoryToCenter(index) {
      if (index === 0) {
        this.categoryScrollLeft = 0
        return
      }
      const screenWidth = getWindowWidth()
      const itemStyle = this.categoryItemStyle
      const itemWidth = Number.parseInt(itemStyle.width)
      const itemMargin = Number.parseInt(itemStyle.margin.split(' ')[1])
      const itemTotalWidth = itemWidth + itemMargin * 2
      const targetItemAbsoluteLeft = index * itemTotalWidth
      const scrollViewVisibleWidth = screenWidth - 32
      const targetPosition = scrollViewVisibleWidth * 0.5 - itemTotalWidth * 0.5
      let targetScrollLeft = targetItemAbsoluteLeft - targetPosition
      const totalWidth = this.categoryNames.length * (itemWidth + itemMargin * 2) + 16
      const maxScrollLeft = Math.max(0, totalWidth - scrollViewVisibleWidth)
      if (targetScrollLeft < 0) targetScrollLeft = 0
      else if (targetScrollLeft > maxScrollLeft) targetScrollLeft = maxScrollLeft
      this.categoryScrollLeft = targetScrollLeft
      this.updateBackToAllBtnVisibility()
    },
    updateBackToAllBtnVisibility() {
      const itemStyle = this.categoryItemStyle
      const itemWidth = Number.parseInt(itemStyle.width)
      const itemMargin = Number.parseInt(itemStyle.margin.split(' ')[1])
      const itemTotalWidth = itemWidth + itemMargin * 2
      this.showBackToAllBtn = this.categoryScrollLeft > itemTotalWidth
    },
    backToAll() {
      this.onCategoryChange({ currentIndex: 0 })
      this.categoryScrollLeft = 0
      this.showBackToAllBtn = false
    },
    showLoginNotice() {
      this.loginNoticeVisible = true
      if (this.loginNoticeTimer) clearTimeout(this.loginNoticeTimer)
      this.loginNoticeTimer = setTimeout(() => {
        this.loginNoticeVisible = false
      }, 2000)
    },
    handleLoginNoticeClick() {
      this.loginNoticeVisible = false
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
      })
    },
    goBack() {
      uni.navigateBack({
        delta: 1
      })
    }
  },
  onLoad() {
    // #ifdef MP-WEIXIN
    this.isWeixin = true
    // 获取导航栏高度
    try {
      const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
      this.navBarHeight = menuButtonInfo.bottom + 8
    } catch (error) {
      console.warn('获取导航栏高度失败:', error)
      this.navBarHeight = 88 // 默认高度
    }
    // #endif
    
    this.statusBarHeight = getStatusBarHeight()
    // 同步全局搜索内容
    const searchText = getApp().globalData.searchText
    if (searchText && searchText !== this.keyword) {
      this.keyword = searchText
    }
    this.fetchTasks({ reset: true })
  },
  onShow() {
    // 每次页面显示时同步全局搜索内容
    const searchText = getApp().globalData.searchText
    if (searchText !== undefined && searchText !== this.keyword) {
      this.keyword = searchText
      this.fetchTasks({ reset: true })
    }
    // 同步 latestTask 到缓存和 tasksList
    const latestTask = getApp().globalData.latestTask
    if (latestTask && latestTask._id) {
      // 遍历所有缓存快照，更新 tasksList
      for (const cacheKey of Object.keys(this.taskCache)) {
        const cache = this.taskCache[cacheKey]
        if (cache && cache.data && Array.isArray(cache.data.tasksList)) {
          const index_ = cache.data.tasksList.findIndex(t => t._id === latestTask._id)
          if (index_ !== -1) {
            this.taskCache[cacheKey].data.tasksList[index_] = {
              ...this.taskCache[cacheKey].data.tasksList[index_],
              ...latestTask
            }
          }
        }
      }
      // 更新当前 tasksList
      const index = this.tasksList.findIndex(t => t._id === latestTask._id)
      if (index !== -1) {
        this.tasksList[index] = { ...this.tasksList[index], ...latestTask }
      }
      getApp().globalData.latestTask = null
    }
  },
  onPullDownRefresh() {
    this.refresh()
  },
  onReachBottom() {
    this.loadMore()
  },
  
  // 页面卸载时清理定时器
  onUnload() {
    if (this.loginNoticeTimer) {
      clearTimeout(this.loginNoticeTimer)
      this.loginNoticeTimer = null
    }
  },
  
  // 页面返回拦截
  onBackPress() {
    // 检查筛选抽屉是否打开
    if (this.isFilterModalOpen || this.showFilterDrawer) {
      this.closeFilterDrawer()
      return true // 阻止页面返回
    }
    return false // 允许页面正常返回
  }
}
</script>

<style scoped>
/* #ifndef APP-NVUE */
view {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
}

/* #endif */
.pages {
  background-color: #ffffff;
}

.avatar {
  width: 200rpx;
  height: 200rpx;
  margin-right: 10rpx;
}

.main {
  justify-content: space-between;
  flex: 1;
}

.title {
  font-size: 16px;
}

.info {
  flex-direction: row;
  justify-content: space-between;
}

.author,
.last_modify_date {
  font-size: 14px;
  color: #999999;
}

.custom-navbar {
  width: 100%;
  background: #fff;
  padding-top: var(--status-bar-height, 0px);
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 60px;
  position: fixed;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #f0f0f0;
}

.navbar-search-mp {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.navbar-search-app {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.navbar-search-app .uni-searchbar {
  width: 100%;
}

.search-click-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  cursor: pointer;
}

.sticky-bar {
  position: sticky;
  top: 60px;
  left: 0;
  height: 45px;
  background: #fff;
  z-index: 1001;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-to-all-btn {
  position: fixed;
  left: 0px;
  background: #fff;
  height: 45px !important;
  width: 8%;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.filter-icon-btn {
  position: fixed;
  right: 0px;
  background: #fff;
  height: 45px !important;
  width: 8%;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.uni-badge--x {
  right: 4px;
}

.search-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-direction: row;
}

.segmented-control {
  height: 40px;
}

.category-scroll {
  flex: 1;
  height: 100%;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: -2px 16px;
  /* 左右各16px内边距，配合4.5个分类项显示 */
  box-sizing: border-box;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.seg-item {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  height: 45px;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  color: #666;
  border-radius: 20px;
  transition:
    background 0.2s,
    color 0.2s;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.seg-item.active {
  background: #fff !important;
  color: #1976d2 !important;
  font-weight: 600;
}

.seg-underline {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #1976d2;
  border-radius: 2px;
}

.masonry-scroll {
  width: 100%;
  background: #f8f8f8;
}

.masonry-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
  padding: 10px 0;
  box-sizing: border-box;
}

.masonry-col {
  width: 49%;
  margin: 0 auto;
  margin-top: 0;
  box-sizing: border-box;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.load-state {
  margin: 0 auto 16px auto;
  width: 90%;
}

/* 筛选抽屉样式 */
.filter-drawer-content {
  padding: 0 10px 20px 10px;
  background: #fff;
  min-height: 400px;
  position: relative;
  z-index: 1004;
  top: 110px !important;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.filter-desc {
  font-size: 14px;
  color: #999;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-select {
  width: 100%;
}

.current-filters {
  margin-bottom: 6px;
  padding: 2px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.current-filters-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.current-filters-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.filter-actions {
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.filter-btn {
  width: 60%;
  height: 45px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn-reset {
  background-color: #f5f5f5;
  color: #666;
}

.filter-btn-reset:active {
  background-color: #e0e0e0;
}

.filter-btn-confirm {
  background-color: #1976d2;
  color: #fff;
}

.filter-btn-confirm:active {
  background-color: #1565c0;
}

.filter-btn-disabled {
  background-color: #f0f0f0 !important;
  color: #ccc !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.filter-btn-disabled:active {
  background-color: #f0f0f0 !important;
}

.filter-actions-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.mode-switch-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.mode-switch-btn {
  flex: 1;
  height: 45px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-switch-btn.active {
  background-color: #1976d2;
  color: #fff;
}

/* #ifdef MP-WEIXIN */
/* 小程序导航栏样式 */
.search-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  position: relative;
}

.searchBar {
  width: 40vw !important;
}

.search-container .uni-searchbar {
  width: 100%;
  max-width: 280px;
  padding: 0 10px !important;
}

.search-click-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  cursor: pointer;
}

.filter-btn-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 16px;
}

/* 调整分类栏位置 */
.sticky-bar {
  position: sticky;
  left: 0;
  height: 45px;
  background: #fff;
  z-index: 1001;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-to-all-btn {
  position: fixed;
  left: 0px;
  background: #fff;
  height: 45px !important;
  width: 8%;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.filter-icon-btn {
  position: fixed;
  right: 0px;
  background: #fff;
  height: 45px !important;
  width: 8%;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* #endif */
</style>
