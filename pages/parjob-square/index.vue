<template>
  <view class="parjob-square-container">
    <!-- 使用官方uni-nav-bar组件 -->
    <uni-nav-bar :fixed="true" :shadow="true" :statusBar="true" background-color="#fff" color="#333" left-icon="left"
      left-text="返回" title="趴活广场" @clickLeft="goBack" rightWidth="280rpx" leftWidth="280rpx">
      <template #right>
        <view class="nav-right-buttons">
          <view class="nav-btn" @click="showFilterModal">
            <uni-icons type="list" size="20" color="#333" />
          </view>
          <view class="nav-btn" @click="goToEdit">
            <uni-icons type="gear" size="20" color="#333" />
          </view>
        </view>
      </template>
    </uni-nav-bar>

    <!-- 3D球体组件 -->
    <planet-sphere :items="activeUsers" :config="sphereConfig" :screen-info="screenInfo" :show-gender="true"
      :is-paused="isUserDetailOpen" @item-click="handleUserDotClick" @item-info-click="handleUserInfoClick"
      @sphere-pause="onSpherePause" @sphere-resume="onSphereResume" />

    <!-- 底部统计 -->
    <view class="bottom-stats">
      <view class="stat-item">
        <text class="stat-number">{{ activeUsers.length }}</text>
        <text class="stat-label">活跃用户</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ totalSkills }}</text>
        <text class="stat-label">技能标签</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ totalCities }}</text>
        <text class="stat-label">覆盖城市</text>
      </view>
    </view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="filterPopup" type="bottom" class="filter-popup">
      <view class="filter-modal">
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <view class="filter-close" @click="hideFilterModal">
            <uni-icons type="close" size="20" color="#333" />
          </view>
        </view>

        <view class="filter-content">
          <!-- 性别筛选 -->
          <view class="filter-section">
            <text class="filter-label">性别</text>
            <view class="filter-options">
              <view v-for="option in genderOptions" :key="option.value" class="filter-option"
                :class="{ active: filterGender === option.value }" @click="filterGender = option.value">
                {{ option.label }}
              </view>
            </view>
          </view>

          <!-- 年龄筛选 -->
          <view class="filter-section">
            <text class="filter-label">年龄范围</text>
            <view class="age-range">
              <picker :value="filterAgeMin" :range="ageOptions" range-key="label" @change="onAgeMinChange">
                <view class="age-picker">
                  <text>{{ getAgeLabel(filterAgeMin) }}</text>
                  <uni-icons type="arrowdown" size="14" color="#666" />
                </view>
              </picker>
              <text class="age-separator">-</text>
              <picker :value="filterAgeMax" :range="ageOptions" range-key="label" @change="onAgeMaxChange">
                <view class="age-picker">
                  <text>{{ getAgeLabel(filterAgeMax) }}</text>
                  <uni-icons type="arrowdown" size="14" color="#666" />
                </view>
              </picker>
            </view>
          </view>

          <!-- 技能筛选 -->
          <view class="filter-section">
            <text class="filter-label">技能标签</text>
            <view class="skill-filter">
              <view v-for="skill in displaySkills" :key="skill" class="skill-filter-item"
                :class="{ active: filterSkills.includes(skill) }" @click="toggleSkillFilter(skill)">
                {{ skill }}
              </view>
            </view>
          </view>

          <!-- 城市筛选 -->
          <view class="filter-section">
            <text class="filter-label">城市</text>
            <view class="city-filter">
              <view v-for="city in allCities" :key="city" class="city-filter-item"
                :class="{ active: filterCities.includes(city) }" @click="toggleCityFilter(city)">
                {{ city }}
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="filter-actions">
          <button class="filter-reset" @click="resetFilter">重置</button>
          <button class="filter-apply" @click="applyFilter">应用筛选</button>
        </view>
      </view>
    </uni-popup>

    <!-- 用户详情弹窗 -->
    <uni-popup ref="userDetailPopup" type="center" class="user-detail-popup">
      <view class="user-detail-modal" v-if="selectedUser">
        <view class="detail-header">
          <image :src="selectedUser.avatar" class="detail-avatar" mode="aspectFill" />
          <view class="detail-info">
            <text class="detail-name">{{ selectedUser.nickname }}</text>
            <view class="detail-basic">
              <text v-if="selectedUser.show_fields?.age">{{ selectedUser.age }}岁</text>
              <text v-if="selectedUser.show_fields?.gender">{{ getGenderText(selectedUser.gender) }}</text>
              <text v-if="selectedUser.show_fields?.education">{{ selectedUser.education }}</text>
            </view>
            <text v-if="selectedUser.show_fields?.city" class="detail-city">{{ selectedUser.city }}</text>
          </view>
        </view>

        <view class="detail-content">
          <view v-if="selectedUser.show_fields?.skills && selectedUser.skills.length > 0" class="detail-section">
            <text class="detail-section-title">技能标签</text>
            <view class="detail-skills">
              <view v-for="skill in selectedUser.skills" :key="skill" class="detail-skill-tag">
                {{ skill }}
              </view>
            </view>
          </view>

          <view v-if="selectedUser.show_fields?.tags && selectedUser.tags.length > 0" class="detail-section">
            <text class="detail-section-title">擅长领域</text>
            <view class="detail-tags">
              <view v-for="tag in selectedUser.tags" :key="tag" class="detail-tag">
                {{ tag }}
              </view>
            </view>
          </view>

          <view v-if="selectedUser.show_fields?.strengths && selectedUser.strengths" class="detail-section">
            <text class="detail-section-title">个人长处</text>
            <text class="detail-strengths">{{ selectedUser.strengths }}</text>
          </view>

          <view v-if="selectedUser.show_fields?.photos && selectedUser.photos.length > 0" class="detail-section">
            <text class="detail-section-title">个人照片</text>
            <view class="detail-photos">
              <image v-for="photo in selectedUser.photos" :key="photo" :src="photo" class="detail-photo"
                mode="aspectFill" />
            </view>
          </view>
        </view>

        <view class="detail-actions">
          <button class="detail-action-btn" @click="contactUser">联系Ta</button>
          <button class="detail-action-btn secondary" @click="hideUserDetail">关闭</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import PlanetSphere from '@/components/3d-planet-sphere/3d-planet-sphere.vue'
import { getActiveParjobCards, getAvailableCities, getAvailableSkills, getFilteredParjobCards } from '@/utils/parjob-cards.js'
import { computed, onMounted, ref } from 'vue'

// 响应式数据
const activeUsers = ref([])
const selectedUser = ref(null)
const isUserDetailOpen = ref(false)

// 屏幕信息
const screenInfo = ref({
  width: 0,
  height: 0,
  pixelRatio: 1
})

// 球体配置
const sphereConfig = ref({
  // 公转中心点配置
  centerX: 50, // 水平中心点
  centerY: 30, // 垂直中心点

  // 公转半径配置
  radiusPercent: 80, // 公转半径占屏幕宽度的百分比
  maxRadiusPercent: 120, // 最大半径占屏幕宽度的百分比

  // 球体大小配置
  sphereSizePercent: 200, // 球体容器占屏幕宽度的百分比

  // 球体背景和边框配置
  showSphereBackground: true, // 是否显示球体背景
  sphereBackgroundColor: 'rgba(0, 0, 0, 0.3)', // 球体背景颜色
  sphereBorderColor: 'rgba(255, 255, 255, 0.1)', // 球体边框颜色
  sphereBorderWidth: 1, // 球体边框宽度

  // 公转速度配置
  baseSpeed: 0.15, // 基础旋转速度
  maxSpeed: 0.8,  // 最大旋转速度
  minSpeed: 0.08, // 最小旋转速度

  // 公转方向配置
  defaultDirection: 1, // 默认旋转方向 (1=顺时针, -1=逆时针)

  // 多方向公转配置
  enableMultiDirection: true, // 是否启用多方向公转
  rotationAxis: 'Y', // 当前旋转轴（限制在XY平面）
  customRotationAngle: 0, // 自定义旋转角度（度）
})

// 筛选相关
const filterGender = ref('')
const filterAgeMin = ref(null)
const filterAgeMax = ref(null)
const filterSkills = ref([])
const filterCities = ref([])

// 性别选项
const genderOptions = [
  { value: '', label: '全部' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' }
]

// 年龄选项
const ageOptions = Array.from({ length: 43 }, (_, i) => ({
  value: i + 18,
  label: `${i + 18}岁`
}))

// 添加ref引用
const userDetailPopup = ref(null)
const filterPopup = ref(null)

// 计算属性
const totalSkills = computed(() => {
  const skills = new Set()
  activeUsers.value.forEach(user => {
    if (user.skills) {
      user.skills.forEach(skill => skills.add(skill))
    }
  })
  return skills.size
})

const totalCities = computed(() => {
  const cities = new Set()
  activeUsers.value.forEach(user => {
    if (user.city) {
      cities.add(user.city)
    }
  })
  return cities.size
})

// 显示技能（限制20个）
const displaySkills = computed(() => {
  const skills = getAvailableSkills()
  return skills.slice(0, 20)
})

// 所有城市
const allCities = computed(() => {
  return getAvailableCities()
})

// 方法
function getGenderText(gender) {
  const genderMap = {
    male: '男',
    female: '女',
    unknown: '未知',
    other: '其他'
  }
  return genderMap[gender] || ''
}

// 年龄相关方法
function getAgeLabel(ageIndex) {
  if (ageIndex === null || ageIndex === undefined || ageIndex === '') {
    return '请选择'
  }
  return ageOptions[ageIndex]?.label || '请选择'
}

function onAgeMinChange(e) {
  const index = Number.parseInt(e.detail.value)
  filterAgeMin.value = index

  // 联动校验：最小年龄不能大于最大年龄
  if (filterAgeMax.value !== null && filterAgeMax.value !== '' &&
    ageOptions[index].value > ageOptions[filterAgeMax.value].value) {
    filterAgeMax.value = index
  }
}

function onAgeMaxChange(e) {
  const index = Number.parseInt(e.detail.value)
  filterAgeMax.value = index

  // 联动校验：最大年龄不能小于最小年龄
  if (filterAgeMin.value !== null && filterAgeMin.value !== '' &&
    ageOptions[index].value < ageOptions[filterAgeMin.value].value) {
    filterAgeMin.value = index
  }
}

function showFilterModal() {
  filterPopup.value.open()
}

function hideFilterModal() {
  filterPopup.value.close()
}

function goToEdit() {
  uni.navigateTo({
    url: '/pages/parjob-square/edit'
  })
}

function goBack() {
  uni.navigateBack()
}

function toggleSkillFilter(skill) {
  const index = filterSkills.value.indexOf(skill)
  if (index > -1) {
    filterSkills.value.splice(index, 1)
  } else {
    filterSkills.value.push(skill)
  }
}

function toggleCityFilter(city) {
  const index = filterCities.value.indexOf(city)
  if (index > -1) {
    filterCities.value.splice(index, 1)
  } else {
    filterCities.value.push(city)
  }
}

function resetFilter() {
  filterGender.value = ''
  filterAgeMin.value = null
  filterAgeMax.value = null
  filterSkills.value = []
  filterCities.value = []
}

function applyFilter() {
  try {
    // 构建筛选条件
    const filters = {}

    if (filterGender.value) {
      filters.gender = filterGender.value
    }

    if (filterAgeMin.value !== null && filterAgeMin.value !== '' &&
      filterAgeMax.value !== null && filterAgeMax.value !== '') {
      filters.ageRange = {
        min: ageOptions[filterAgeMin.value].value,
        max: ageOptions[filterAgeMax.value].value
      }
    }

    if (filterSkills.value.length > 0) {
      filters.skills = filterSkills.value
    }

    if (filterCities.value.length > 0) {
      filters.city = filterCities.value // 支持多城市筛选
    }

    // 使用筛选函数获取数据
    const filteredUsers = getFilteredParjobCards(filters)

    // 转换数据格式以适配现有逻辑
    const formattedUsers = filteredUsers.map(user => ({
      _id: user._id,
      nickname: user.nickname,
      avatar: user.avatar || '/static/images/user-bg.png',
      gender: user.gender,
      age: user.age,
      education: user.education,
      city: user.city,
      skills: user.skills || [],
      tags: user.tags || [],
      strengths: user.strengths,
      photos: user.photos || ['/static/images/user-bg.png'],
      show_fields: user.show_fields,
      isOnline: true // 默认在线状态
    }))

    activeUsers.value = formattedUsers
    hideFilterModal()
  } catch (error) {
    console.error('应用筛选失败:', error)
    uni.showToast({
      title: '筛选失败',
      icon: 'error'
    })
  }
}

function showUserDetail(user) {
  selectedUser.value = user
  userDetailPopup.value.open()
  isUserDetailOpen.value = true
}

function hideUserDetail() {
  selectedUser.value = null
  userDetailPopup.value.close()
  isUserDetailOpen.value = false
}

function contactUser() {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 获取屏幕信息
function getScreenInfo() {
  const systemInfo = uni.getSystemInfoSync()
  screenInfo.value = {
    width: systemInfo.screenWidth,
    height: systemInfo.screenHeight,
    pixelRatio: systemInfo.pixelRatio || 1
  }
}

// 加载活跃用户数据
async function loadActiveUsers() {
  try {
    // 使用真实数据
    const users = getActiveParjobCards()

    // 转换数据格式以适配现有逻辑
    const formattedUsers = users.map(user => ({
      _id: user._id,
      nickname: user.nickname,
      avatar: user.avatar || '/static/images/user-bg.png',
      gender: user.gender,
      age: user.age,
      education: user.education,
      city: user.city,
      skills: user.skills || [],
      tags: user.tags || [],
      strengths: user.strengths,
      photos: user.photos || ['/static/images/user-bg.png'],
      show_fields: user.show_fields,
      isOnline: true // 默认在线状态
    }))

    activeUsers.value = formattedUsers
  } catch (error) {
    console.error('加载用户数据失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  }
}

// 组件事件处理
function handleUserDotClick(user) {
  showUserDetail(user)
}

function handleUserInfoClick(user) {
  showUserDetail(user)
}

function onSpherePause() {
  // 球体暂停时的处理
}

function onSphereResume() {
  // 球体恢复时的处理
}

// 生命周期
onMounted(() => {
  getScreenInfo() // 获取屏幕信息
  loadActiveUsers()
})
</script>

<style scoped>
.parjob-square-container {
  min-height: 100vh;
  background-color: #000;
  overflow: hidden;
  position: relative;
  /* 禁用默认触摸行为，避免passive事件监听器警告 */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* 去除橡皮筋效果 */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
}

/* 导航栏右侧按钮样式 */
.nav-right-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s;
  cursor: pointer;
}

.nav-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.bottom-stats {
  display: flex;
  justify-content: space-around;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  /* 彻底禁用所有模糊效果 */
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
  -webkit-filter: none !important;
  /* 确保在导航栏下方，但低于弹窗 */
  z-index: 50;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5rpx;
}

/* 筛选弹窗样式 */
.filter-popup {
  z-index: 1000 !important;
}

.filter-modal {
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 30rpx 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 30rpx;
}

.filter-actions {
  padding: 20rpx 30rpx 30rpx 30rpx;
  border-top: 1rpx solid #eee;
  background: #fff;
  flex-shrink: 0;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.filter-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-section {
  margin-bottom: 30rpx;
}

.filter-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.filter-options {
  display: flex;
  gap: 20rpx;
}

.filter-option {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;
}

.filter-option.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.age-range {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.age-picker {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 15rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.age-picker text {
  font-size: 26rpx;
  color: #333;
}

.age-separator {
  font-size: 26rpx;
  color: #666;
}

.skill-filter,
.city-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.skill-filter-item,
.city-filter-item {
  padding: 10rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s;
}

.skill-filter-item.active,
.city-filter-item.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.filter-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.filter-reset,
.filter-apply {
  flex: 1;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.filter-reset {
  background: #f5f5f5;
  color: #666;
}

.filter-apply {
  background: #667eea;
  color: #fff;
}

/* 用户详情弹窗样式 */
.user-detail-popup {
  z-index: 1000 !important;
}

.user-detail-modal {
  background: #fff;
  border-radius: 20rpx;
  width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.detail-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.detail-info {
  flex: 1;
}

.detail-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.detail-basic {
  display: flex;
  gap: 15rpx;
  margin-bottom: 8rpx;
}

.detail-basic text {
  font-size: 24rpx;
  color: #666;
}

.detail-city {
  font-size: 24rpx;
  color: #999;
}

.detail-content {
  padding: 30rpx;
}

.detail-section {
  margin-bottom: 30rpx;
}

.detail-section-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.detail-skills,
.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.detail-skill-tag,
.detail-tag {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.detail-strengths {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.detail-photos {
  display: flex;
  gap: 10rpx;
  overflow-x: auto;
}

.detail-photo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.detail-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #eee;
}

.detail-action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.detail-action-btn:not(.secondary) {
  background: #667eea;
  color: #fff;
}

.detail-action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}
</style>
