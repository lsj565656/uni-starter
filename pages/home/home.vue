<template>
  <view v-if="loginNoticeVisible" class="login-notice-bar" @click="handleLoginNoticeClick">
    去登录 &gt;
  </view>
  <view class="home-container">
    <!-- #ifdef APP -->
    <statusBar></statusBar>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <!-- 微信 自定义导航栏 -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <view class="nav-title">首页</view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 状态栏占位和背景 -->
    <!-- #ifndef MP-WEIXIN -->
    <view class="status-bar-placeholder" :style="{ height: statusBarHeight + 'px', background: statusBarBg }"></view>
    <!-- #endif -->

    <!-- banner -->
    <unicloud-db ref="bannerdb" v-slot:default="{data, loading, error, options}" collection="opendb-banner"
			field="_id,bannerfile,open_url,title,sort,status" 
			where="status == true" 
			orderby="sort asc, create_date desc" 
			@load="onqueryload" >
			
			<!-- 正常数据状态 -->
			<uni-swiper-dot v-if="data && data.length > 0" 
				:info="data" 
				:current="current" 
				mode="round" 
				:dotsStyles="bannerDotsStyles"
				class="banner-swiper-dot">
				<swiper class="swiper-box" @change="changeSwiper" :current="current" :indicator-dots="false" :circular="true">
					<swiper-item v-for="(item, index) in data" :key="item._id">
						<image class="banner-image" :src="item.bannerfile.url" mode="aspectFill" @click="clickBannerItem(item)" :draggable="false" />
						<!-- 可选：显示标题 -->
						<view v-if="item.title" class="banner-title">{{ item.title }}</view>
					</swiper-item>
				</swiper>
			</uni-swiper-dot>
			<!-- 空数据状态 -->
			<image v-else-if="!loading && (!data || data.length === 0)" class="banner-image" src="/static/uni-center/headers.png" mode="aspectFill" :draggable="false" />
		</unicloud-db>
    <!-- <swiper class="swiper-box" @change="changeSwiper" :current="current" indicator-dots>
      <swiper-item v-for="(item) in imageDatas" :key="item.id">
        <image class="banner-image" :src="item.image" mode="aspectFill" @click="clickBannerItem(item)"
          :draggable="false" />
      </swiper-item>
    </swiper> -->

    <!-- 通告消息栏 -->
    <view class="notice-section">
      <NoticeBar :notices="noticeList" background-color="#f8f9fa" @click="handleNoticeClick" />
    </view>

    <!-- 宫格功能区 -->
    <view class="section grid-section">
      <uni-swiper-dot :info="gridPages" :current="gridSwiperCurrent" mode="round" :dotsStyles="{
        backgroundColor: '#e0e6ed',
        selectedBackgroundColor: '#1976d2',
        width: 8,
        height: 8,
        selectedWidth: 24,
        border: 'none',
        selectedBorder: 'none',
        bottom: 0
      }" style="margin-top: -1px">
        <swiper class="grid-swiper" :style="{ height: gridSwiperHeight }" :indicator-dots="false"
          :current="gridSwiperCurrent" @change="handleGridChange" circular :autoplay="false" :duration="300">
          <swiper-item v-for="(page, pageIdx) in gridPages" :key="pageIdx">
            <view class="grid-page">
              <view class="grid-row" v-for="row in currentGridRows" :key="row">
                <view class="grid-col" v-for="col in gridColumn" :key="col">
                  <template v-if="page[(row - 1) * gridColumn + (col - 1)]">
                    <view class="grid-item" @click="handleGridItemClick(page[(row - 1) * gridColumn + (col - 1)])">
                      <image class="grid-item-icon"
                        :src="page[(row - 1) * gridColumn + (col - 1)].icon || '/static/logo.png'" mode="aspectFit" />
                      <text class="grid-item-text">{{
                        page[(row - 1) * gridColumn + (col - 1)].text
                        }}</text>
                    </view>
                  </template>
                </view>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </uni-swiper-dot>
    </view>

    <!-- 热门任务瀑布流区块 -->
    <view class="section hot-tasks-section">
      <view class="section-header">
        <uni-icons type="fire" size="20" color="#007aff" />
        <text class="section-title">热门任务</text>
      </view>
      <view class="masonry-scroll">
        <view class="masonry-row">
          <template v-if="!hotTasksLoading && hotTasksList && hotTasksList.length > 0">
            <view class="masonry-col" v-for="(col, colIdx) in homeHotColumnsWithMoreCard(hotTasksList)" :key="colIdx">
              <template v-for="item in col">
                <task-card v-if="!item._isMoreCard" :key="item._id" :task="withLikeStatus(item)" :user="item.user"
                  :showActions="false" @like="handleLikeTask" />
                <uni-card v-else class="masonry-card more-card" :style="{
                  minHeight: '80px',
                  maxHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }" @click="goToHotTasksPage">
                  <view class="more-card-content">
                    <text class="more-card-text">查看更多</text>
                    <uni-icons type="arrowright" color="#1976d2" style="margin-bottom: 8px" />
                  </view>
                </uni-card>
              </template>
            </view>
          </template>
          <template v-else>
            <view class="masonry-col" v-for="(col, colIdx) in homeHotColumns(hotTasksList)" :key="colIdx">
              <task-card v-for="item in col" :key="item._id" :task="withLikeStatus(item)" :user="item.user"
                :showActions="false" @like="handleLikeTask" />
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
  <!-- 优质案例 -->
  <view class="section" id="evaluateds-section">
    <view class="section-header">
      <view class="section-title">
        <uni-icons type="shop" size="20" color="#007aff" />
        <text>优质案例</text>
      </view>
      <view class="section-actions">
        <text class="update-time">{{ evaluatedsUpdateTime }}</text>
        <uni-icons type="refresh" size="16" color="#666" @click="refreshevaluateds"></uni-icons>
      </view>
    </view>
    <scroll-view class="evaluateds-scroll" :class="{ 'scrolled-left': isevaluatedsScrolledLeft }" scroll-x
      show-scrollbar="false" @scroll="handleevaluatedsScroll">
      <view class="evaluateds-container">
        <evaluated-card v-for="evaluated in evaluateds" :key="evaluated.id" :evaluated="evaluated"
          @click="showevaluatedDetail(evaluated)" />
      </view>
    </scroll-view>
  </view>

  <!-- 优质案例弹窗 -->
  <uni-popup ref="evaluatedPopup" type="center" :animation="true" :is-mask-click="true"
    @change="onevaluatedPopupChange">
    <view class="evaluated-popup">
      <view class="evaluated-popup-header">
        <text class="evaluated-popup-title">{{ currentevaluated?.title }}</text>
      </view>
      <view class="evaluated-popup-publisher" v-if="currentevaluated?.publisher">
        <image class="publisher-avatar" :src="currentevaluated.publisher.avatar" />
        <text class="publisher-name">{{ currentevaluated.publisher.name }}</text>
      </view>
      <view class="evaluated-popup-content">
        <!-- 图片轮播 -->
        <view class="evaluated-images">
          <swiper class="evaluated-swiper" :indicator-dots="evaluatedImages.length > 1" :autoplay="false"
            indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#fff" @change="onImageSwiperChange">
            <swiper-item v-for="(image, index) in evaluatedImages" :key="index">
              <image class="evaluated-image-fixed" :src="image" mode="aspectFill" @click="previewImage(index)" />
            </swiper-item>
          </swiper>
          <!-- 图片计数器 -->
          <view class="image-counter" v-if="evaluatedImages.length > 0">
            <text>{{ currentImageIndex + 1 }} / {{ evaluatedImages.length }}</text>
          </view>
        </view>
        <!-- 任务描述 -->
        <view class="evaluated-description">
          <text>{{ currentevaluated?.description }}</text>
        </view>
        <!-- 评论区 -->
        <view class="evaluated-comment" v-if="currentComment">
          <view class="comment-user">
            <image class="comment-avatar" :src="currentComment.user.avatar" />
            <text class="comment-username">{{ currentComment.user.name }}</text>
          </view>
          <view class="comment-content">{{ currentComment.content }}</view>
          <view class="comment-tags">
            <uni-badge v-for="tag in currentComment.tags" :key="tag" :text="tag" type="primary" size="small"
              :inverted="true" />
          </view>
        </view>
      </view>
    </view>
  </uni-popup>
  <!-- 玩法技巧 -->
  <view class="section" id="flour-process-section">
    <view class="section-header">
      <uni-icons type="gear" size="20" color="#007aff" />
      <text class="section-title">玩法技巧</text>
      <view class="timeline-mode-switch">
        <uni-icons custom-prefix="iconfont" type="icon-align-text-center"
          :color="flourTimelineMode === 'tree' ? '#007aff' : '#bbb'" size="22" @click="flourTimelineMode = 'tree'"
          class="mode-icon" />
        <uni-icons custom-prefix="iconfont" type="icon-wenzijuzuo"
          :color="flourTimelineMode === 'vertical' ? '#007aff' : '#bbb'" size="22"
          @click="flourTimelineMode = 'vertical'" class="mode-icon" />
      </view>
      <view class="section-actions">
        <text class="update-time">{{ processUpdateTime }}</text>
        <uni-icons type="refresh" size="16" color="#666" @click="refreshProcess" />
      </view>
    </view>
    <timeline :process-data="flourProcess" :mode="flourTimelineMode" @image-click="handleFlourTimelineImageClick" />
  </view>
  <!-- 悬浮发布按钮和返回顶部按钮（均用uni-fab） -->
  <uni-fab :pattern="fabPattern" :content="fabContent" :horizontal="'right'" :vertical="'bottom'" :popMenu="true"
    :direction="'horizontal'" @trigger="onFabMenuClick" />
</template>

<script setup>
// #ifdef APP
import statusBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar'
// #endif
import evaluatedCard from '@/components/evaluated-card/evaluated-card.vue'
import NoticeBar from '@/components/notice-bar/notice-bar.vue'
import taskCard from '@/components/task-card/task-card.vue'
import timeline from '@/components/timeline/timeline.vue'
import { useTaskLikeStore } from '@/store/taskLike.js'
import uniCard from '@/uni_modules/uni-card/components/uni-card/uni-card.vue'
import uniFab from '@/uni_modules/uni-fab/components/uni-fab/uni-fab.vue'
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { categories } from '@/utils/categories'
import { evaluateds } from '@/utils/evaluateds'
import { flourProcess as flourProcessData } from '@/utils/flourProcess'
import { images } from '@/utils/images'
import { generateRandomNotice, notices } from '@/utils/notices'
import { toggleTaskLike } from '@/utils/taskLike.js'
import { onPageScroll } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// 状态栏高度
const statusBarHeight = ref(0)

const statusBarAlpha = ref(0.4) // 初始状态栏半透明色
function updateStatusBarAlpha(scrollTop) {
  // 0~100px 线性从 0.4 到 1
  let alpha = 0.4 + (Math.min(scrollTop, 100) / 100) * 0.7
  if (alpha > 1) alpha = 1
  statusBarAlpha.value = alpha
}
const statusBarBg = computed(() => `rgba(255,255,255,${statusBarAlpha.value})`) // 白色渐变

const imageDatas = ref([
  {
    id: 1,
    name: 'banner1',
    image: images.evaluateds.wuhuarou
  },
  {
    id: 2,
    name: 'banner2',
    image: images.evaluateds.shucai
  },
  {
    id: 3,
    name: 'banner3',
    image: images.evaluateds.mianfen
  }
])
const evaluatedsUpdateTime = ref('12-01 14:30')
const flourProcess = ref(flourProcessData)

// 通告消息相关
const noticeList = ref([...notices])
const current = ref(0)

// Banner指示点样式配置
const bannerDotsStyles = {
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  selectedBackgroundColor: '#fff',
  width: 8,
  height: 6,
  selectedWidth: 24,
  border: 'none',
  selectedBorder: 'none',
  bottom: 1
}

// 食材弹窗相关变量
const evaluatedPopup = ref(null)
const currentevaluated = ref(null)
const evaluatedImages = ref([])
const currentImageIndex = ref(0)
const currentComment = ref(null)
const savedScrollTop = ref(0)

// 时间线模式切换
const flourTimelineMode = ref('tree')

// 宫格分页逻辑
const gridColumn = categories[0]?.grid_column || 3
const gridRow = categories[0]?.grid_row || 3
const gridPageSize = gridColumn * gridRow
const homeGridItems = computed(() => categories.filter(c => c.use_home_grid))
const gridPages = computed(() => {
  const pages = []
  for (let index = 0; index < homeGridItems.value.length; index += gridPageSize) {
    pages.push(homeGridItems.value.slice(index, index + gridPageSize))
  }
  return pages
})
const gridSwiperCurrent = ref(0)

function handleGridChange(e) {
  gridSwiperCurrent.value = e.detail.current
}

function handleGridItemClick(item) {
  if (item.route) {
    uni.navigateTo({
      url: item.route
    })
  } else {
    uni.showToast({
      title: item.text,
      icon: 'none'
    })
  }
}
// 动态计算当前页实际行数
const currentGridRows = computed(() => {
  const page = gridPages.value[gridSwiperCurrent.value] || []
  return Math.ceil(page.length / gridColumn)
})
const gridSwiperHeight = computed(() => `${currentGridRows.value * 180}rpx`)

const onevaluatedPopupChange = e => {
  if (e.type === 'hide') {
    // 恢复页面滚动状态
    // #ifdef H5
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
    // #endif

    // 使用更可靠的方式恢复滚动位置
    nextTick(() => {
      if (savedScrollTop.value > 0) {
        // 使用 requestAnimationFrame 确保在下一帧执行
        requestAnimationFrame(() => {
          uni.pageScrollTo({
            scrollTop: savedScrollTop.value,
            duration: 0
          })
        })
      }
    })
  } else if (e.type === 'show') {
    // 弹窗显示时的逻辑已经在 showevaluatedDetail 中处理
  }
}

// 刷新优质案例信息方法
function refreshevaluateds() {
  uni.showLoading({
    title: '刷新中...'
  })
  setTimeout(() => {
    uni.hideLoading()
    const hasUpdate = Math.random() > 0.5
    if (hasUpdate) {
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      evaluatedsUpdateTime.value = `${month}-${day} ${hour}:${minute}`
      uni.showToast({
        title: '已更新',
        icon: 'success'
      })
    } else {
      uni.showToast({
        title: '已是最新',
        icon: 'none'
      })
    }
  }, 1000)
}


function showevaluatedDetail(evaluated) {
  currentevaluated.value = evaluated
  // 图片和评论一一对应，取每条 afterComments 的第一张图片，没有则用默认图
  const imgs = (evaluated.afterComments || []).map(c =>
    c.images && c.images.length > 0 ? c.images[0] : '/static/logo.png'
  )
  evaluatedImages.value = imgs.length > 0 ? imgs : ['/static/logo.png']
  currentImageIndex.value = 0
  currentComment.value = (evaluated.afterComments && evaluated.afterComments[0]) || null
  nextTick(() => {
    if (evaluatedPopup.value) evaluatedPopup.value.open()
  })
}

function onImageSwiperChange(e) {
  currentImageIndex.value = e.detail.current
  if (currentevaluated.value && currentevaluated.value.afterComments) {
    currentComment.value = currentevaluated.value.afterComments[currentImageIndex.value] || null
  }
}

function previewImage(index) {
  uni.previewImage({
    current: index,
    urls: evaluatedImages.value
  })
}

function handleFlourTimelineImageClick({ allImages, currentIndex }) {
  console.log('点击了面图片', allImages, currentIndex)
  uni.previewImage({
    current: currentIndex,
    urls: allImages
  })
}

function handleNoticeClick(notice) {
  if (notice) {
    uni.showToast({
      title: `点击了：${notice.text}`,
      icon: 'none',
      duration: 2000
    })
  }
}

// Banner相关方法
function changeSwiper(e) {
  current.value = e.detail.current
}

// Banner数据加载完成回调
function onqueryload(e) {
  console.log('Banner数据加载完成:', e)
}

function clickBannerItem(item) {
  console.log('点击了banner:', item)
  
  // 处理banner点击跳转
  if (item.open_url) {
    // 判断URL类型并跳转
    if (item.open_url.startsWith('http://') || item.open_url.startsWith('https://')) {
      // Web地址，使用内置web-view打开
      uni.navigateTo({
        url: `/uni_modules/uni-id-pages/pages/webview/webview?url=${encodeURIComponent(item.open_url)}`
      })
    } else if (item.open_url.startsWith('/')) {
      // 本地页面，直接跳转
      uni.navigateTo({
        url: item.open_url
      })
    } else if (item.open_url.startsWith('@/')) {
      // 本地页面，去掉@符号
      uni.navigateTo({
        url: item.open_url.slice(1)
      })
    } else {
      // 其他情况，显示提示
      uni.showToast({
        title: '暂不支持此链接类型',
        icon: 'none'
      })
    }
  } else {
    // 没有跳转链接，显示banner信息
    uni.showToast({
      title: item.title || 'Banner',
      icon: 'none'
    })
  }
}

const isevaluatedsScrolledLeft = ref(false)
const processUpdateTime = ref('12-01 14:30')

function refreshProcess() {
  uni.showLoading({
    title: '刷新中...'
  })
  setTimeout(() => {
    uni.hideLoading()
    const hasUpdate = Math.random() > 0.5
    if (hasUpdate) {
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      processUpdateTime.value = `${month}-${day} ${hour}:${minute}`
      uni.showToast({
        title: '流程已更新',
        icon: 'success'
      })
    } else {
      uni.showToast({
        title: '已是最新',
        icon: 'none'
      })
    }
  }, 1000)
}

function goToHotTasksPage() {
  uni.navigateTo({
    url: '/pages/hot-tasks/index'
  })
}

// 获取热门任务
async function fetchHotTasks() {
  if (hotTasksLoading.value) return
  hotTasksLoading.value = true

  try {
    const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid
    const res = await uniCloud.callFunction({
      name: 'getHotTasks',
      data: {
        userId,
        limit: loadMaxHotTasksCount,
        orderBy: [{ field: 'create_date', order: 'desc' }]
      }
    })

    if (res.result && res.result.code === 0) {
      hotTasksList.value = res.result.data || []
      // 同步已点赞任务到 useTaskLikeStore
      const taskLikeStore = useTaskLikeStore()
      for (const item of hotTasksList.value) {
        if (item.is_liked) {
          taskLikeStore.setLike(item._id, true, item.like_count)
        }
      }
    } else {
      console.error('获取热门任务失败:', res.result?.message)
    }
  } catch (error) {
    console.error('获取热门任务失败:', error)
  } finally {
    hotTasksLoading.value = false
  }
}

// 处理任务点赞状态
function withLikeStatus(item) {
  const taskLikeStore = useTaskLikeStore()
  const likeInfo = taskLikeStore.getLike(item._id)
  return {
    ...item,
    is_liked: likeInfo ? likeInfo.isLiked : item.is_liked,
    like_count: likeInfo ? likeInfo.likeCount : item.like_count
  }
}

// 处理任务点赞
function handleLikeTask(task) {
  // 登录校验
  const userInfo = store.userInfo
  if (!userInfo || !userInfo._id) {
    showLoginNotice()
    return
  }

  const taskLikeStore = useTaskLikeStore()
  const oldLiked = task.is_liked
  const oldCount = task.like_count
  const newLiked = !oldLiked
  const newCount = oldLiked ? oldCount - 1 : oldCount + 1
  // 乐观UI
  taskLikeStore.setLike(task._id, newLiked, newCount)
  toggleTaskLike(task._id, oldLiked)
    .then(({ isLiked, likeCount }) => {
      taskLikeStore.setLike(task._id, isLiked, likeCount)
    })
    .catch(error => {
      taskLikeStore.setLike(task._id, oldLiked, oldCount)
      uni.showToast({ title: error.message || '操作失败', icon: 'none' })
    })
}

function homeHotColumnsWithMoreCard(data) {
  const columns = [[], []]
  for (const [index, item] of (data || []).entries()) {
    columns[index % 2].push(item)
  }
  // 只有当数据达到最大显示数量时才显示"查看更多"按钮
  if (data && data.length >= loadMaxHotTasksCount) {
    // 找到最短列
    const minIndex = columns[0].length <= columns[1].length ? 0 : 1
    columns[minIndex].push({
      _isMoreCard: true
    })
  }
  return columns
}

function homeHotColumns(data) {
  const columns = [[], []]
  for (const [index, item] of (data || []).entries()) {
    columns[index % 2].push(item)
  }
  return columns
}

// 生命周期钩子
let addNoticeTimer = null

onMounted(() => {
  // 获取状态栏高度
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 获取热门任务
  fetchHotTasks()

  // 每60秒添加一条新的随机通告
  addNoticeTimer = setInterval(() => {
    const newNotice = generateRandomNotice()
    noticeList.value.unshift(newNotice)
    // 保持最多20条消息
    if (noticeList.value.length > 20) {
      noticeList.value = noticeList.value.slice(0, 20)
    }
  }, 60_000)
})

onUnmounted(() => {
  if (addNoticeTimer) {
    clearInterval(addNoticeTimer)
  }
})

const showBackToTop = ref(false)

// 热门任务相关
const hotTasksList = ref([])
const hotTasksLoading = ref(false)
const loadMaxHotTasksCount = 3 // 首页最多显示3个热门任务

const loginNoticeVisible = ref(false)
let loginNoticeTimer = null
function showLoginNotice() {
  loginNoticeVisible.value = true
  if (loginNoticeTimer) clearTimeout(loginNoticeTimer)
  loginNoticeTimer = setTimeout(() => {
    loginNoticeVisible.value = false
  }, 2000)
}
function handleLoginNoticeClick() {
  loginNoticeVisible.value = false
  uni.navigateTo({
    url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
  })
}

function goToPublish() {
  const userInfo = store.userInfo
  if (!userInfo || !userInfo._id) {
    showLoginNotice()
    return
  }
  uni.navigateTo({
    url: '/pages/publish/publish'
  })
}

// 直接注册页面滚动钩子
onPageScroll(e => {
  // 实时更新状态栏透明度
  updateStatusBarAlpha(e.scrollTop || 0)
  showBackToTop.value = (e.scrollTop || 0) > 300
})

const showFab = ref(true)
const isAtTop = ref(true)

// 主按钮透明，菜单项不透明
const fabPattern = {
  backgroundColor: 'rgba(255,255,255,0.6)', // 近乎全透明
  color: '#1296db',
  icon: 'plusempty',
  buttonColor: 'rgba(255,255,255,0.6)',
  iconColor: '#1976d2',
  boxShadow: 'none'
}

const fabContent = [
  {
    iconPath: '/static/icons/backTop.png',
    text: '置顶',
    active: false,
    disabled: isAtTop.value // 动态禁用
  },
  {
    iconPath: '/static/icons/publish.png',
    text: '发布',
    active: false,
    disabled: false
  }
]

function onFabMenuClick({ item }) {
  if (item.text === '发布') {
    goToPublish()
  } else if (item.text === '置顶' && !isAtTop.value) {
    uni.pageScrollTo({ scrollTop: 0, duration: 300 })
  }
}

onPageScroll(e => {
  showFab.value = true
  isAtTop.value = (e.scrollTop || 0) <= 0
  // 动态更新置顶按钮禁用状态
  fabContent[0].disabled = isAtTop.value
})
</script>

<style scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  height: 88rpx;
}

.nav-content .logo {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
}

.nav-content .nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  flex: 1;
  text-align: center;
  margin: 0 20rpx;
}

.section-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx;
}

.decoration {
  width: 4px;
  height: 12px;
  border-radius: 10px;
  background-color: #2979ff;
}

.section-text {
  color: #333;
  margin-left: 15rpx;
}

/* #ifdef APP-NVUE */
.warp {
  background-color: #fff;
}

/* #endif */

.example-body {
  flex-direction: column;
  padding: 15px;
  background-color: #ffffff;
}

.image {
  width: 50rpx;
  height: 50rpx;
}

.big-number {
  font-size: 50rpx;
  font-weight: 700;
  font-stretch: condensed;
  font-style: oblique;
}

.text {
  text-align: center;
  font-size: 26rpx;
  margin-top: 10rpx;
}

.example-body {
  /* #ifndef APP-NVUE */
  display: block;
  /* #endif */
}

.swiper-box {
  height: 400rpx;
}

.search-icons {
  padding: 16rpx;
}

.search-container-bar {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: #fff;
}

/* #ifndef APP-NVUE || VUE3*/
::v-deep

/* #endif */
.uni-searchbar__box {
  border-width: 0;
}

/* #ifndef APP-NVUE || VUE3 */
::v-deep

/* #endif */
.uni-input-placeholder {
  font-size: 28rpx;
}

.home-container {
  background: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 10rpx;
  padding-top: 10rpx;
}

.banner-image {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.swiper-box {
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
}

/* 通告消息栏样式 */
.notice-section {
  margin: 10px 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section {
  margin: 10px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.update-time {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.evaluateds-scroll {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.evaluateds-container {
  display: flex;
  gap: 12px;
}

.big-number {
  font-size: 32px;
  font-weight: 700;
  color: #007aff;
}

.text {
  text-align: center;
  font-size: 16px;
  margin-top: 6px;
}

.timeline-mode-switch {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.timeline-mode-switch .mode-icon {
  margin-left: 8px;
  cursor: pointer;
  transition: color 0.2s;
}

/* 食材详情弹窗样式 */
.evaluated-popup {
  background-color: #fff;
  border-radius: 20rpx;
  width: 92vw;
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

.evaluated-popup-header {
  display: flex;
  align-items: flex-end;
  padding: 30rpx 40rpx 0 40rpx;
  border-bottom: none;
}

.evaluated-popup-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.evaluated-popup-publisher {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 40rpx 0 40rpx;
  margin-bottom: 8rpx;
}

.publisher-avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  object-fit: cover;
}

.publisher-name {
  font-size: 24rpx;
  color: #666;
}

.evaluated-popup-content {
  padding: 0 40rpx 40rpx 40rpx;
}

.evaluated-image-fixed {
  width: 100%;
  height: 400rpx;
  object-fit: cover;
  border-radius: 12rpx;
  background: #f5f5f5;
}

.evaluated-description {
  text-align: left;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  padding: 20rpx 0 0 0;
  margin-bottom: 10rpx;
}

.evaluated-comment {
  background: #f8f9fa;
  border-radius: 14rpx;
  margin: 18rpx 0 0 0;
  padding: 18rpx 18rpx 12rpx 18rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 4rpx;
}

.comment-avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
}

.comment-username {
  font-size: 26rpx;
  color: #1976d2;
  font-weight: 600;
}

.comment-content {
  font-size: 24rpx;
  color: #333;
  margin-bottom: 4rpx;
  line-height: 1.5;
  word-break: break-all;
}

.comment-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

/* 弹窗打开时锁定页面滚动 */
.popup-open {
  overflow: hidden !important;
  touch-action: none !important;
  overscroll-behavior: none !important;
}

.popup-open .content-wrapper {
  overflow: hidden !important;
  touch-action: none !important;
  overscroll-behavior: none !important;
}

.hot-tasks-section {
  margin-bottom: 16px;
}

.hot-tasks-scroll {
  width: 100%;
  white-space: nowrap;
  padding-bottom: 8px;
}

.hot-tasks-container {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.hot-task-item {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 10px;
  min-width: 180px;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hot-task-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 6px;
}

.hot-task-info {
  width: 100%;
}

.hot-task-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.hot-task-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-task-meta {
  font-size: 12px;
  color: #f56c6c;
  margin-bottom: 4px;
}

.hot-task-actions {
  display: flex;
  gap: 8px;
}

.hot-task-btn {
  background: #f5f5f5;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 13px;
  cursor: pointer;
}

/* Masonry 布局样式 */
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
  padding: 2px 0;
  box-sizing: border-box;
}

.masonry-col {
  width: 49%;
  margin: 0 auto;
  box-sizing: border-box;
}

.more-card {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 80px !important;
  max-height: 160px !important;
  max-width: 200px;
  background: #f5f7fa;
  cursor: pointer;
}

.more-card-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.more-card-content .uni-icons {
  margin-bottom: 0 !important;
}

.more-card-text {
  font-size: 16px;
  color: #1976d2;
  font-weight: 600;
}

/* 宫格功能区样式补充 */
.grid-item-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin: 4px;
}

.big-number {
  font-size: 32px;
  font-weight: 700;
  color: #007aff;
}

.text {
  text-align: center;
  font-size: 16px;
  margin-top: 6px;
}

.grid-section {
  padding: 0;
  background: transparent;
  box-shadow: none;
  margin: 10px 0 0 0;
}

.grid-swiper {
  width: 100%;
  /* height 由style绑定动态控制 */
  background: transparent;
}

.grid-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: transparent;
}

.grid-row {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-around;
  margin-bottom: 0;
}

.grid-col {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 4px;
  background: none;
  border-radius: 12px;
  box-shadow: none;
  transition: background 0.2s;
  cursor: pointer;
}

.grid-item:active {
  background: #f5f5f5;
}

.grid-item-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: #f8f8f8;
}

.grid-item-text {
  font-size: 14px;
  color: #333;
  margin-top: 2px;
  text-align: center;
}

/* 优化uni-swiper-dot横杠切换动画 */
:deep(.uni-swiper__dots-long) {
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.3s;
}

/* 不再需要 .back-to-top-btn 样式，uni-fab自带圆角和阴影 */
/* 可选：让主fab按钮点击区域也透明 */
::v-deep .uni-fab__circle {
  background: rgba(255, 255, 255, 0.6) !important;
  box-shadow: none !important;
}

/* 状态栏占位样式 */
.status-bar-placeholder {
  transition: background 0.2s;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.login-notice-bar {
  position: fixed;
  margin-top: 10px !important;
  right: 0;
}

.banner-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
  color: #fff;
  padding: 20rpx 16rpx 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
  border-radius: 0 0 12px 12px;
}

</style>
