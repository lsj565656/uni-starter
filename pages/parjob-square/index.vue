<template>
  <view class="parjob-square-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="nav-title">
        <uni-icons type="star" size="24" color="#007aff" />
        <text class="title-text">趴活广场</text>
      </view>
      <view class="nav-actions">
        <uni-icons type="search" size="20" color="#666" @click="showSearch = true" />
        <uni-icons type="filter" size="20" color="#666" @click="showFilter = true" />
      </view>
    </view>

    <!-- 筛选栏 -->
    <view v-if="showFilter" class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-tags">
          <view 
            v-for="city in availableCities" 
            :key="city"
            class="filter-tag"
            :class="{ active: selectedCity === city }"
            @click="toggleCityFilter(city)"
          >
            {{ city }}
          </view>
        </view>
      </scroll-view>
      <view class="filter-close" @click="showFilter = false">
        <uni-icons type="close" size="16" color="#666" />
      </view>
    </view>

    <!-- 星球分布区域 -->
    <view class="planet-container">
      <!-- 中央的"我" -->
      <view class="my-planet" @click="goToMyProfile">
        <view class="planet-avatar">
          <image :src="myAvatar" mode="aspectFill" />
          <view class="planet-status">我</view>
        </view>
      </view>

      <!-- 其他用户的星球 -->
      <view
        v-for="(card, index) in displayCards"
        :key="card._id"
        class="user-planet"
        :class="{ 'planet-active': selectedPlanet === card._id }"
        :style="getPlanetStyle(card, index)"
        @click="selectPlanet(card)"
      >
        <view class="planet-avatar">
          <image :src="card.avatar" mode="aspectFill" />
          <view class="planet-glow"></view>
        </view>
        <view class="planet-info">
          <text class="planet-name">{{ card.nickname }}</text>
          <view class="planet-tags">
            <text 
              v-for="tag in card.tags.slice(0, 2)" 
              :key="tag" 
              class="planet-tag"
            >
              {{ tag }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 用户详情弹窗 -->
    <uni-popup 
      ref="userPopup" 
      type="center" 
      :animation="true" 
      :is-mask-click="true"
      @change="onPopupChange"
    >
      <view class="user-detail-popup">
        <view class="popup-header">
          <image :src="selectedCard?.avatar" class="popup-avatar" mode="aspectFill" />
          <view class="popup-user-info">
            <text class="popup-name">{{ selectedCard?.nickname }}</text>
            <view class="popup-basic">
              <text v-if="selectedCard?.show_fields?.gender">{{ selectedCard?.gender === 'male' ? '男' : '女' }}</text>
              <text v-if="selectedCard?.show_fields?.age">{{ selectedCard?.age }}岁</text>
              <text v-if="selectedCard?.show_fields?.city">{{ selectedCard?.city }}</text>
            </view>
          </view>
          <view class="popup-close" @click="closeUserPopup">
            <uni-icons type="close" size="20" color="#666" />
          </view>
        </view>

        <scroll-view class="popup-content" scroll-y>
          <!-- 技能标签 -->
          <view v-if="selectedCard?.show_fields?.skills && selectedCard?.skills?.length" class="popup-section">
            <view class="section-title">技能标签</view>
            <view class="skill-tags">
              <text 
                v-for="skill in selectedCard.skills" 
                :key="skill" 
                class="skill-tag"
              >
                {{ skill }}
              </text>
            </view>
          </view>

          <!-- 个人长处 -->
          <view v-if="selectedCard?.show_fields?.strengths && selectedCard?.strengths" class="popup-section">
            <view class="section-title">个人长处</view>
            <text class="strengths-text">{{ selectedCard.strengths }}</text>
          </view>

          <!-- 擅长领域 -->
          <view v-if="selectedCard?.show_fields?.tags && selectedCard?.tags?.length" class="popup-section">
            <view class="section-title">擅长领域</view>
            <view class="tag-list">
              <text 
                v-for="tag in selectedCard.tags" 
                :key="tag" 
                class="tag-item"
              >
                {{ tag }}
              </text>
            </view>
          </view>

          <!-- 个人照片 -->
          <view v-if="selectedCard?.show_fields?.photos && selectedCard?.photos?.length" class="popup-section">
            <view class="section-title">个人照片</view>
            <scroll-view class="photo-scroll" scroll-x>
              <view class="photo-list">
                <image 
                  v-for="(photo, index) in selectedCard.photos" 
                  :key="index"
                  :src="photo" 
                  mode="aspectFill" 
                  class="photo-item"
                  @click="previewPhoto(selectedCard.photos, index)"
                />
              </view>
            </scroll-view>
          </view>
        </scroll-view>

        <view class="popup-actions">
          <button class="action-btn primary" @click="contactUser">联系Ta</button>
          <button class="action-btn secondary" @click="viewUserProfile">查看主页</button>
        </view>
      </view>
    </uni-popup>

    <!-- 搜索弹窗 -->
    <uni-popup ref="searchPopup" type="center" :animation="true">
      <view class="search-popup">
        <view class="search-header">
          <text class="search-title">搜索用户</text>
          <view class="search-close" @click="closeSearch">
            <uni-icons type="close" size="20" color="#666" />
          </view>
        </view>
        <view class="search-input-wrapper">
          <uni-search-bar 
            v-model="searchKeyword"
            placeholder="搜索昵称、技能、城市..."
            @confirm="performSearch"
            @cancel="closeSearch"
          />
        </view>
      </view>
    </uni-popup>

    <!-- 悬浮按钮 -->
    <view class="fab-container">
      <view class="fab-btn edit-btn" @click="goToEditProfile">
        <uni-icons type="compose" size="20" color="#fff" />
        <text class="fab-text">编辑我的趴活</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import {
    addRandomPositions,
    getActiveParjobCards,
    getAvailableCities,
    getFilteredParjobCards
} from '@/utils/parjob-cards.js'
import { computed, nextTick, onMounted, ref } from 'vue'

// 响应式数据
const showFilter = ref(false)
const showSearch = ref(false)
const searchKeyword = ref('')
const selectedCity = ref('')
const selectedPlanet = ref('')
const selectedCard = ref(null)
const userPopup = ref(null)
const searchPopup = ref(null)

// 获取当前用户信息
const myAvatar = computed(() => {
  const userInfo = store.userInfo
  return userInfo?.avatar || '/static/default-avatar.png'
})

// 获取可用的城市列表
const availableCities = computed(() => getAvailableCities())

// 获取筛选后的卡片数据
const filteredCards = computed(() => {
  const filters = {}
  if (selectedCity.value) {
    filters.city = selectedCity.value
  }
  if (searchKeyword.value) {
    // 简单搜索实现
    return getActiveParjobCards().filter(card => 
      card.nickname.includes(searchKeyword.value) ||
      card.skills.some(skill => skill.includes(searchKeyword.value)) ||
      card.city.includes(searchKeyword.value)
    )
  }
  return getFilteredParjobCards(filters)
})

// 添加随机位置的显示卡片
const displayCards = computed(() => {
  return addRandomPositions(filteredCards.value)
})

// 获取星球样式
function getPlanetStyle(card) {
  const position = card.position || { x: 50, y: 50, z: 0 }
  return {
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: `translate(-50%, -50%) scale(${1 + position.z * 0.1})`,
    zIndex: Math.floor(position.z)
  }
}

// 筛选相关方法
function toggleCityFilter(city) {
  if (selectedCity.value === city) {
    selectedCity.value = ''
  } else {
    selectedCity.value = city
  }
}

// 星球选择
function selectPlanet(card) {
  selectedCard.value = card
  selectedPlanet.value = card._id
  nextTick(() => {
    userPopup.value?.open()
  })
}

// 弹窗相关
function closeUserPopup() {
  userPopup.value?.close()
  selectedPlanet.value = ''
}

function onPopupChange(e) {
  if (e.type === 'hide') {
    selectedPlanet.value = ''
  }
}

// 搜索相关
function performSearch() {
  // 搜索逻辑已在 computed 中实现
  closeSearch()
}

function closeSearch() {
  searchPopup.value?.close()
  showSearch.value = false
}

// 照片预览
function previewPhoto(photos, index) {
  uni.previewImage({
    current: index,
    urls: photos
  })
}

// 联系用户
function contactUser() {
  uni.showToast({
    title: '联系功能开发中',
    icon: 'none'
  })
}

// 查看用户主页
function viewUserProfile() {
  if (selectedCard.value?.allow_homepage_view) {
    uni.navigateTo({
      url: `/pages/user/profile?id=${selectedCard.value.user_id}`
    })
  } else {
    uni.showToast({
      title: '该用户未开放主页查看',
      icon: 'none'
    })
  }
  closeUserPopup()
}

// 编辑我的趴活信息
function goToEditProfile() {
  uni.navigateTo({
    url: '/pages/parjob-square/edit'
  })
}

// 查看我的主页
function goToMyProfile() {
  uni.navigateTo({
    url: '/pages/user/profile'
  })
}

// 生命周期
onMounted(() => {
  // 初始化数据
  console.log('趴活广场页面加载完成')
})
</script>

<style scoped>
.parjob-square-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 导航栏 */
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.nav-actions {
  display: flex;
  gap: 20rpx;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.filter-scroll {
  flex: 1;
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  gap: 20rpx;
}

.filter-tag {
  padding: 10rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  color: #fff;
  font-size: 28rpx;
  transition: all 0.3s;
}

.filter-tag.active {
  background: #007aff;
  color: #fff;
}

.filter-close {
  margin-left: 20rpx;
  padding: 10rpx;
}

/* 星球容器 */
.planet-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 200rpx);
  overflow: hidden;
}

/* 我的星球 */
.my-planet {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.my-planet .planet-avatar {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 0 30rpx rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.my-planet .planet-avatar image {
  width: 100%;
  height: 100%;
}

.my-planet .planet-status {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #007aff;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
}

/* 用户星球 */
.user-planet {
  position: absolute;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-planet:hover {
  transform: translate(-50%, -50%) scale(1.1) !important;
}

.user-planet.planet-active {
  transform: translate(-50%, -50%) scale(1.2) !important;
}

.user-planet .planet-avatar {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3);
  overflow: hidden;
  animation: planetFloat 3s ease-in-out infinite;
}

.user-planet .planet-avatar image {
  width: 100%;
  height: 100%;
}

.user-planet .planet-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: planetGlow 2s ease-in-out infinite alternate;
}

.user-planet .planet-info {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10rpx;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.user-planet:hover .planet-info {
  opacity: 1;
}

.planet-name {
  display: block;
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.planet-tags {
  display: flex;
  gap: 8rpx;
  justify-content: center;
  margin-top: 4rpx;
}

.planet-tag {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  white-space: nowrap;
}

/* 动画 */
@keyframes planetFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

@keyframes planetGlow {
  0% { opacity: 0.3; }
  100% { opacity: 0.8; }
}

/* 用户详情弹窗 */
.user-detail-popup {
  background: #fff;
  border-radius: 20rpx;
  width: 90vw;
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  position: relative;
}

.popup-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.popup-user-info {
  flex: 1;
}

.popup-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.popup-basic {
  display: flex;
  gap: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.popup-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 10rpx;
}

.popup-content {
  max-height: 60vh;
  padding: 30rpx;
}

.popup-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.skill-tags, .tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.skill-tag, .tag-item {
  background: #f0f8ff;
  color: #007aff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.strengths-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.photo-scroll {
  white-space: nowrap;
}

.photo-list {
  display: flex;
  gap: 15rpx;
}

.photo-item {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #eee;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn.primary {
  background: #007aff;
  color: #fff;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

/* 搜索弹窗 */
.search-popup {
  background: #fff;
  border-radius: 20rpx;
  width: 80vw;
  max-width: 500rpx;
  padding: 30rpx;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.search-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.search-close {
  padding: 10rpx;
}

/* 悬浮按钮 */
.fab-container {
  position: fixed;
  bottom: 40rpx;
  right: 40rpx;
  z-index: 1000;
}

.fab-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: #007aff;
  color: #fff;
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
  transition: all 0.3s;
}

.fab-btn:active {
  transform: scale(0.95);
}

.fab-text {
  font-size: 26rpx;
  font-weight: bold;
}
</style> 