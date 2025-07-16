<template>
  <view class="category-tasks-container" :style="containerStyle">
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
      <unicloud-db
        ref="udbRef"
        :collection="'kl-tasks'"
        :where="where"
        :orderby="orderBy"
        v-slot:default="{data, loading, error, pagination, hasMore}"
        :page-size="pageSize"
        :getcount="true"
        @data-change="onDbDataChange"
      >
        <view v-if="loading" class="loading">加载中...</view>
        <view v-else-if="error" class="error">加载失败</view>
        <view v-else>
          <view v-if="data && data.length" class="masonry-row">
            <view class="masonry-col" v-for="(col, colIdx) in columns(data)" :key="colIdx">
              <task-card v-for="item in col" :key="item._id" :task="withLikeStatus(item)" @like="onLike(item)" />
            </view>
          </view>
          <view v-else class="empty">暂无任务</view>
          <uni-load-state
            class="load-state"
            :state="{data,pagination,hasMore,loading,error}"
            @loadMore="loadMore"
            @networkResume="refresh"
            noMoreText="没有更多了"
          />
        </view>
      </unicloud-db>
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

const catId = ref(0)
const catName = ref('')
const sortKey = ref('time') // 默认时间优先
const keyword = ref('')
const statusBarHeight = ref(0)
const FILTER_BAR_HEIGHT = 88 // 搜索栏+排序栏总高，按实际调整
const pageSize = 20
const udbRef = ref(null)
const sortPopupRef = ref(null)
const taskMode = ref('') // 用于判断当前分类的任务类型
const likesTaskIds = ref([])

// 获取当前用户已点赞的任务ID列表
async function fetchLikesTaskIds() {
  const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid;
  if (!userId) {
    likesTaskIds.value = [];
    return;
  }
  const res = await uniCloud.database()
    .collection('kl-tasks-likes')
    .where(`user_id == "${userId}"`)
    .field('task_id')
    .get();
  likesTaskIds.value = (res.result.data || []).map(item => (item.task_id && item.task_id.$oid) ? item.task_id.$oid : item.task_id);
}

// 渲染 task-card 时根据 likesTaskIds 判断 is_liked
function withLikeStatus(item) {
  const idStr = (item._id && item._id.$oid) ? item._id.$oid : item._id;
  return {
    ...item,
    is_liked: likesTaskIds.value.includes(idStr)
  };
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
const listMarginTop = computed(() => {
  // #ifdef APP
  return `margin-top: ${statusBarHeight.value + CUSTOM_NAVBAR_HEIGHT + 48}px;`
  // #endif
  // #ifndef APP
  return `margin-top: ${CUSTOM_NAVBAR_HEIGHT + 48}px;`
  // #endif
})
const listMasonryStyle = computed(() => {
  // #ifdef APP
  return `margin-top: ${statusBarHeight.value + CUSTOM_NAVBAR_HEIGHT + 48}px; top: ${statusBarHeight.value + CUSTOM_NAVBAR_HEIGHT}px;`
  // #endif
  // #ifndef APP
  return `margin-top: ${CUSTOM_NAVBAR_HEIGHT + 48}px; top: ${CUSTOM_NAVBAR_HEIGHT}px;`
  // #endif
})
const where = computed(() => {
  let w = `isActive == true && category == ${catId.value}`
  if (keyword.value) w += ` && /${keyword.value}/.test(name)`
  return w
})
const orderBy = computed(() => {
  if (sortKey.value === 'time') return 'create_date desc'
  if (sortKey.value === 'value') {
    // 这里假设所有任务同一分类类型一致，实际可根据后端数据调整
    return taskMode.value === 'score' ? 'score desc' : 'price desc'
  }
  return 'create_date desc'
})
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
function columns(data) {
  const cols = [[], []]
  ;(data || []).forEach((item, idx) => {
    cols[idx % 2].push(item)
    // 只要有一条数据，自动推断类型
    if (!taskMode.value && item.mode) taskMode.value = item.mode
  })
  return cols
}
function onDbDataChange({ data }) {
  // 这里可做缓存或其他处理
}
function refresh() {
  if (udbRef.value) {
    udbRef.value.loadData({ clear: true }, () => {
      uni.stopPullDownRefresh()
    })
    setTimeout(() => { uni.stopPullDownRefresh() }, 3000)
  } else {
    uni.stopPullDownRefresh()
  }
}
function loadMore() {
  if (udbRef.value) udbRef.value.loadMore()
}
function onLike(item) {
  const oldLiked = item.is_liked
  const oldCount = item.like_count
  // 乐观UI
  item.is_liked = !oldLiked
  item.like_count = oldLiked ? oldCount - 1 : oldCount + 1
  toggleTaskLike(item._id, oldLiked)
    .then(({ isLiked, likeCount }) => {
      item.is_liked = isLiked
      item.like_count = likeCount
    })
    .catch(e => {
      item.is_liked = oldLiked
      item.like_count = oldCount
      uni.showToast({ title: e.message || '操作失败', icon: 'none' })
    })
}
onLoad((options) => {
  catId.value = Number(options.catId) || 0
  catName.value = options.catName || ''
  // #ifdef APP
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
  // #endif
})
onPullDownRefresh(() => {
  refresh()
})
onReachBottom(() => {
  loadMore()
})
onMounted(() => {
  fetchLikesTaskIds();
});
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