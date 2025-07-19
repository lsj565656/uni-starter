<template>
  <view class="category-tasks-container" :style="containerStyle">
    <!-- 顶部状态栏、导航栏 ... -->
    <view v-if="loginNoticeVisible" class="login-notice-bar" @click="handleLoginNoticeClick">
      去登录 &gt;
    </view>
    <!-- 自定义导航栏，最高层 -->
    <view class="custom-navbar-fixed" :style="`top:0;left:0;right:0;z-index:1001;padding-top:${statusBarHeight}px;`">
      <view class="custom-navbar">
        <uni-icons type="back" size="22" color="#333" @click="goBack" style="margin-right: 8px;" />
        <text class="navbar-title">{{ catName }}任务</text>
      </view>
    </view>
    <!-- 吸顶的搜索+排序栏 -->
    <view
      class="filter-header-group-fixed"
      :style="`top:${statusBarHeight + CUSTOM_NAVBAR_HEIGHT}px;left:0;right:0;z-index:1000;height:48px;transform: translateY(-${filterBarOffset}px);`"
    >
      <view class="search-filter-row">
        <view class="search-bar-row">
          <uni-search-bar
            v-model="keyword"
            radius="100"
            cancelButton="auto"
            clearButton="auto"
            :placeholder="'请输入搜索内容'"
            @clear="resetKeyword"
            @cancel="resetKeyword"
            @confirm="onSearch"
            :height="36"
          />
        </view>
        <view class="filter-bar">
          <view class="filter-sort-btn" @click="openSortPopup">
            <text>{{ sortLabel }}</text>
            <uni-icons type="arrow-down" size="16" color="#1976d2" style="margin-left:2px;" />
          </view>
        </view>
      </view>
    </view>
    <!-- 列表内容 -->
    <view class="task-list-masonry" :style="listMasonryStyle">
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="error" class="error">{{ error }}</view>
      <view v-else>
        <view v-if="columns(tasksList)[0].length || columns(tasksList)[1].length" class="masonry-row">
          <view class="masonry-col" v-for="(col, colIdx) in columns(tasksList)" :key="colIdx">
            <template v-for="item in col" :key="item._id">
              <task-card :task="withLikeStatus(item)" @like="onLike(item)" />
            </template>
          </view>
        </view>
        <view v-else class="empty">暂无任务</view>
        <uni-load-state
          class="load-state"
          :state="{data:tasksList,pagination,hasMore,loading,error}"
          @loadMore="loadMore"
          @networkResume="refresh"
          noMoreText="没有更多了"
        />
      </view>
      <uni-popup ref="sortPopupRef" type="bottom" :is-mask-click="true">
        <view class="sort-popup-content">
          <view class="sort-popup-option" v-for="option in sortOptions" :key="option.value" :class="{active: sortKey===option.value}" @click="selectSortOrder(option.value)">
            <text>{{ option.label }}</text>
            <uni-icons v-if="sortKey===option.value" type="checkbox-filled" color="#1976d2" size="18" style="margin-left:8px;" />
          </view>
        </view>
      </uni-popup>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app'
import taskCard from '@/components/task-card/task-card.vue'
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import uniLoadState from '@/components/uni-load-state/uni-load-state.vue'
import uniSearchBar from '@/uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.vue'
import { toggleTaskLike } from '@/utils/taskLike.js'
import { useTaskLikeStore } from '@/store/taskLike.js'

const catId = ref(0)
const catName = ref('')
const sortKey = ref('time') // 默认时间优先
const keyword = ref('')
const statusBarHeight = ref(0)
const FILTER_BAR_HEIGHT = 88 // 搜索栏+排序栏总高，按实际调整
const pageSize = 20
const sortPopupRef = ref(null)
const taskMode = ref('') // 用于判断当前分类的任务类型
const tasksList = ref([])
const loading = ref(false)
const error = ref('')
const hasMore = ref(true)
const pagination = ref({})
const page = ref(1)
const loginNoticeVisible = ref(false)
let loginNoticeTimer = null
function showLoginNotice() {
  loginNoticeVisible.value = true
  if (loginNoticeTimer) clearTimeout(loginNoticeTimer)
  loginNoticeTimer = setTimeout(() => {
    loginNoticeVisible.value = false
  }, 3000)
}
function handleLoginNoticeClick() {
  loginNoticeVisible.value = false
  uni.navigateTo({
    url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
  })
}

const CUSTOM_NAVBAR_HEIGHT = 48
const filterBarOffset = ref(0)
let lastScrollTop = 0
onPageScroll((e) => {
  const st = e.scrollTop
  let delta = st - lastScrollTop
  filterBarOffset.value += delta
  if (filterBarOffset.value < 0) filterBarOffset.value = 0
  if (filterBarOffset.value > FILTER_BAR_HEIGHT) filterBarOffset.value = FILTER_BAR_HEIGHT
  lastScrollTop = st
})

const sortOptions = [
  { label: '时间优先', value: 'time' },
  { label: '价值优先', value: 'value' }
]
const sortLabel = computed(() => {
  if (sortKey.value === 'time') return '时间优先'
  if (sortKey.value === 'value') return '价值优先'
  return '排序'
})
const containerStyle = computed(() => {
  return 'background:#f8f9fa;min-height:100vh;'
})
const listMasonryStyle = computed(() => {
  // #ifdef APP
  return `margin-top: ${statusBarHeight.value + CUSTOM_NAVBAR_HEIGHT + 48}px; top: ${statusBarHeight.value + CUSTOM_NAVBAR_HEIGHT}px;`
  // #endif
  // #ifndef APP
  return `margin-top: ${CUSTOM_NAVBAR_HEIGHT + 48}px; top: ${CUSTOM_NAVBAR_HEIGHT}px;`
  // #endif
})

function getOrderByArray() {
  const arr = [];
  // 1. 积分/价格排序（互斥，优先级最高）
  if (taskMode.value === 'score' && sortKey.value === 'value') {
    arr.push({ field: 'score', order: 'desc' });
  } else if (taskMode.value === 'price' && sortKey.value === 'value') {
    arr.push({ field: 'price', order: 'desc' });
  }
  // 2. 时间排序
  if (sortKey.value === 'time') {
    arr.push({ field: 'create_date', order: 'desc' });
  }
  // 可扩展更多排序
  if (arr.length === 0) {
    arr.push({ field: 'create_date', order: 'desc' });
  }
  return arr;
}

async function fetchTasks({ reset = false } = {}) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  if (reset) {
    page.value = 1
    tasksList.value = []
    hasMore.value = true
  }
  try {
    const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid;
    const orderByArr = getOrderByArray();
    const res = await uniCloud.callFunction({
      name: 'category-tasks',
      data: {
        userId,
        catId: catId.value,
        keyword: keyword.value,
        orderBy: orderByArr,
        page: page.value,
        pageSize
      }
    })
    if (res.result && res.result.code === 0) {
      const rawList = res.result.data || []
      if (reset) {
        tasksList.value = rawList
      } else {
        tasksList.value = [...tasksList.value, ...rawList]
      }
      hasMore.value = res.result.hasMore
      pagination.value = { total: res.result.total, page: res.result.page, pageSize: res.result.pageSize }
      // 同步已点赞任务到 useTaskLikeStore
      const taskLikeStore = useTaskLikeStore();
      rawList.forEach(item => {
        if (item.is_liked) {
          taskLikeStore.setLike(item._id, true, item.like_count);
        }
      });
    } else {
      error.value = res.result?.message || '加载失败'
    }
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function columns(data) {
  const cols = [[], []]
  ;(data || []).forEach((item, idx) => {
    cols[idx % 2].push(item)
    if (!taskMode.value && item.mode) taskMode.value = item.mode
  })
  return cols
}

function openSortPopup() {
  sortPopupRef.value && sortPopupRef.value.open('bottom')
}
function selectSortOrder(val) {
  sortKey.value = val
  sortPopupRef.value && sortPopupRef.value.close()
  refresh()
}
function goBack() {
  uni.navigateBack()
}
function onSearch() {
  refresh()
}
function resetKeyword() {
  keyword.value = ''
  refresh()
}
function refresh() {
  fetchTasks({ reset: true })
  uni.stopPullDownRefresh()
}
function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value += 1
    fetchTasks()
  }
}
function withLikeStatus(item) {
  const taskLikeStore = useTaskLikeStore();
  const likeInfo = taskLikeStore.getLike(item._id);
  return {
    ...item,
    is_liked: likeInfo ? likeInfo.isLiked : item.is_liked,
    like_count: likeInfo ? likeInfo.likeCount : item.like_count
  }
}
function onLike(item) {
  // 登录校验
  const userInfo = getApp().globalData.userInfo || (uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo()) || {};
  if (!userInfo._id) {
    showLoginNotice();
    return;
  }
  const taskLikeStore = useTaskLikeStore();
  const oldLiked = item.is_liked;
  const oldCount = item.like_count;
  const newLiked = !oldLiked;
  const newCount = oldLiked ? oldCount - 1 : oldCount + 1;
  // 乐观UI
  taskLikeStore.setLike(item._id, newLiked, newCount);
  toggleTaskLike(item._id, oldLiked)
    .then(({ isLiked, likeCount }) => {
      taskLikeStore.setLike(item._id, isLiked, likeCount);
    })
    .catch(e => {
      taskLikeStore.setLike(item._id, oldLiked, oldCount);
      uni.showToast({ title: e.message || '操作失败', icon: 'none' });
    });
}
onLoad((options) => {
  catId.value = Number(options.catId) || 0
  catName.value = options.catName || ''
  // #ifdef APP
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
  // #endif
  fetchTasks({ reset: true })
})
onPullDownRefresh(() => {
  refresh()
})
onReachBottom(() => {
  loadMore()
})
onMounted(() => {
  fetchTasks({ reset: true })
})
</script>

<style scoped>
.category-tasks-container {
  background: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 1px;
}
.custom-navbar-fixed {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 1001;
  background: #fff;
}
.custom-navbar {
  display: flex;
  align-items: center;
  height: 48px;
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}
.navbar-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.filter-header-group-fixed {
  position: fixed;
  left: 0;
  right: 0;
  /* top 由 :style 绑定 */
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  will-change: transform;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
  height: 48px;
  overflow: hidden;
  pointer-events: auto;
}
.search-filter-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 48px;
  background: #fff;
  padding: 0 8px;
  box-sizing: border-box;
}
.search-bar-row {
  flex: 1 1 0%;
  min-width: 0;
  margin-right: 8px;
  background: transparent;
  height: 36px;
  display: flex;
  align-items: center;
}
.filter-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 36px;
  background: transparent;
  padding: 0;
  border: none;
}
.filter-sort-btn {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #1976d2;
  background: #f8f9fa;
  border-radius: 14px;
  padding: 2px 12px;
  border: 1px solid #e0e6ed;
  font-weight: 600;
  margin-right: 0;
  cursor: pointer;
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
.loading, .error, .empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 15px;
}
.sort-popup-content {
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px 0;
}
.sort-popup-option {
  padding: 16px 24px;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}
.sort-popup-option.active {
  color: #1976d2;
  background: #f0f6ff;
}
.task-list-masonry {
  /* 不要设置 overflow/scroll，让页面自然流式布局 */
  position: sticky;
}
</style> 