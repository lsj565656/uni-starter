<template>
  <view class="parjob-square-container">
    <!-- 使用官方uni-nav-bar组件 -->
    <uni-nav-bar :fixed="true" :border="false" :shadow="true" :statusBar="true" background-color="#fff" color="#333"
      left-icon="left" left-text="" title="趴活广场" @clickLeft="goBack">
    </uni-nav-bar>

    <!-- 3D球体组件 - 只在4个以上用户时显示 -->
    <planet-sphere v-if="activeUsers.length >= 4" :items="activeUsers" :config="sphereConfig" :screen-info="screenInfo"
      :show-gender="false" :is-paused="isUserDetailOpen" @item-click="handleUserDotClick"
      @item-info-click="handleUserInfoClick" @sphere-pause="onSpherePause" @sphere-resume="onSphereResume" />

    <!-- 1-3个用户时的固定展示 -->
    <view v-if="activeUsers.length < 4 && activeUsers.length > 0" class="fixed-users-display"
      :style="fixedDisplayStyle">
      <view class="fixed-users-container" :class="`users-count-${activeUsers.length}`">
        <view v-for="(user, index) in activeUsers" :key="user._id" class="fixed-user-item"
          @click="handleUserDotClick(user)">
          <view class="fixed-user-avatar">
            <image :src="user.avatar" class="user-avatar" mode="aspectFill" />
            <view class="user-gender-icon">
              <uni-icons custom-prefix="iconfont" :type="getGenderIcon(user.gender)" size="12"
                :color="getGenderColor(user.gender)" />
            </view>
          </view>
          <view class="fixed-user-info">
            <text class="fixed-user-name">{{ user.nickname }}</text>
            <text v-if="user.city" class="fixed-user-city">{{ user.city }}</text>
            <view v-if="user.skills && user.skills.length > 0" class="fixed-user-skills">
              <text class="fixed-user-skills-text">
                {{ user.skills.slice(0, 2).join(' · ') }}{{ user.skills.length > 2 ? '...' : '' }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 没有匹配用户时的提示 -->
    <view v-if="activeUsers.length === 0" class="no-users-display">
      <view class="no-users-content">
        <uni-icons type="search" size="60" color="rgba(255, 255, 255, 0.5)" />
        <text class="no-users-title">暂无匹配用户</text>
        <text class="no-users-desc">请尝试调整筛选条件</text>
      </view>
    </view>

        <!-- 功能区块 -->
    <view class="function-blocks">
      <!-- 编辑信息卡按钮 -->
      <uni-card class="function-card edit-profile-card" @click="goToEdit">
        <view class="card-content">
          <view class="block-icon">
            <uni-icons custom-prefix="iconfont" type="icon-xiugai" size="24" color="#fff" />
          </view>
          <view class="block-content">
            <text class="block-title">编辑我的信息卡</text>
            <text class="block-desc">完善个人信息，提高匹配率</text>
          </view>
          <view class="card-actions">
            <view @click.stop class="card-actions-eye">
              <uni-icons type="eye" size="16" color="#fff" @click="viewMyProfile" />
            </view>
            <uni-icons type="right" size="16" color="#fff" />
          </view>
        </view>
      </uni-card>

      <!-- 筛选条件块 -->
      <uni-card class="function-card filter-card" @click="showFilterModal">
        <view class="card-content">
          <view class="block-icon">
            <uni-icons type="list" size="24" color="#fff" />
          </view>
          <view class="block-content">
            <text class="block-title">筛选条件</text>
            <view class="filter-tags" v-if="hasActiveFilters">
              <view v-for="(tag, index) in activeFilterTags" :key="index" class="filter-tag">
                {{ tag }}
              </view>
              <text class="filter-count">({{ activeFilterCount }})</text>
            </view>
            <text v-else class="block-desc">设置筛选条件，精准匹配</text>
          </view>
          <uni-icons type="right" size="16" color="#fff" />
        </view>
      </uni-card>

      <!-- 智能推荐按钮 -->
      <uni-card class="function-card smart-recommend-card" @click="startSmartRecommend">
        <view class="card-content">
          <view class="block-icon">
            <uni-icons custom-prefix="iconfont" type="icon-zhinengtuijian" size="24" color="#fff" />
          </view>
          <view class="block-content">
            <text class="block-title">智能推荐</text>
            <text class="block-desc">根据发布任务智能匹配</text>
          </view>
          <uni-icons type="right" size="16" color="#fff" />
        </view>
      </uni-card>
    </view>

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
            <text class="filter-label">技能标签 (最多4个)</text>
            <view class="skill-filter">
              <view v-for="skill in displaySkills" :key="skill" class="skill-filter-item"
                :class="{ active: filterSkills.includes(skill) }" @click="toggleSkillFilter(skill)">
                {{ skill }}
              </view>
            </view>
          </view>

          <!-- 城市筛选 -->
          <view class="filter-section">
            <text class="filter-label">城市 (最多4个)</text>
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
    <uni-popup ref="userDetailPopup" type="center" class="user-detail-popup" @maskClick="hideUserDetail">
      <view class="user-detail-modal" v-if="selectedUser">
        <view class="detail-header">
          <image :src="selectedUser.avatar" class="detail-avatar" mode="aspectFill" />
          <view class="detail-info">
            <text class="detail-name">{{ selectedUser.nickname }}</text>
            <view class="detail-basic">
              <text v-if="selectedUser.show_fields?.age">{{ selectedUser.age }}岁</text>
              <uni-icons custom-prefix="iconfont" :type="getGenderIcon(selectedUser.gender)" size="12"
                :color="getGenderColor(selectedUser.gender)" />
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

          <view v-if="selectedUser.show_fields?.categorie_tags && selectedUser.categorie_tags.length > 0"
            class="detail-section">
            <text class="detail-section-title">擅长领域</text>
            <view class="detail-tags">
              <view v-for="categorie_tag in selectedUser?.categorie_tags" :key="categorie_tag" class="detail-tag">
                {{ categorie_tag }}
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
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { onBackPress } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'

// 响应式数据
const activeUsers = ref([])
const selectedUser = ref(null)
const isUserDetailOpen = ref(false)

// 获取用户信息
const userInfo = computed(() => store.userInfo)

// 屏幕信息
const screenInfo = ref({
  width: 0,
  height: 0,
  pixelRatio: 1
})

// 球体配置
const sphereConfig = ref({
  // 中心点配置
  centerX: 50, // 水平中心点
  centerY: 30, // 垂直中心点

  // 半径配置
  radiusPercent: 80, // 公转半径占屏幕宽度的百分比
  maxRadiusPercent: 120, // 最大半径占屏幕宽度的百分比

  // 大小配置
  sphereSizePercent: 200, // 球体容器占屏幕宽度的百分比

  // 背景和边框配置
  showSphereBackground: true, // 是否显示球体背景
  sphereBackgroundColor: 'rgba(0, 0, 0, 0.3)', // 球体背景颜色
  sphereBorderColor: 'rgba(255, 255, 255, 0.1)', // 球体边框颜色
  sphereBorderWidth: 1, // 球体边框宽度

  // 速度配置
  baseSpeed: 0.15, // 基础旋转速度
  maxSpeed: 0.8,  // 最大旋转速度
  minSpeed: 0.08, // 最小旋转速度

  // 方向配置
  defaultDirection: 1, // 默认旋转方向 (1=顺时针, -1=逆时针)

  // 多方向配置
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
  { value: 1, label: '男' },
  { value: 2, label: '女' },
  { value: 0, label: '未知' }
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
  // return skills.slice(0, 20)
  return skills
})

// 所有城市
const allCities = computed(() => {
  return getAvailableCities()
})

// 筛选相关计算属性
const hasActiveFilters = computed(() => {
  return filterGender.value ||
    (filterAgeMin.value !== null && filterAgeMax.value !== null) ||
    filterSkills.value.length > 0 ||
    filterCities.value.length > 0
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filterGender.value) count++
  if (filterAgeMin.value !== null && filterAgeMax.value !== null) count++
  if (filterSkills.value.length > 0) count++
  if (filterCities.value.length > 0) count++
  return count
})

const activeFilterTags = computed(() => {
  const tags = []

  if (filterGender.value) {
    const genderText = genderOptions.find(opt => opt.value === filterGender.value)?.label
    if (genderText) tags.push(genderText)
  }

  if (filterAgeMin.value !== null && filterAgeMax.value !== null) {
    const minAge = ageOptions[filterAgeMin.value]?.value
    const maxAge = ageOptions[filterAgeMax.value]?.value
    if (minAge && maxAge) tags.push(`${minAge}-${maxAge}岁`)
  }

  if (filterSkills.value.length > 0) {
    tags.push(`技能:${filterSkills.value.length}个`)
  }

  if (filterCities.value.length > 0) {
    tags.push(`城市:${filterCities.value.length}个`)
  }

  return tags
})

// 计算固定展示区域的样式，与3D球体位置完全一致
const fixedDisplayStyle = computed(() => {
  const screenWidth = screenInfo.value.width || 750

  // 计算球体中心位置（与3D球体组件完全一致）
  const centerX = sphereConfig.value.centerX
  const centerY = sphereConfig.value.centerY

  // 计算球体大小（与3D球体容器大小完全一致）
  const sphereSize = Math.min(
    screenWidth * sphereConfig.value.sphereSizePercent / 100,
    screenWidth * 2
  )

  // 使用球体大小作为固定展示区域的尺寸
  const displaySize = sphereSize

  // 构建样式对象（与3D球体容器样式保持一致）
  const style = {
    position: 'absolute',
    width: `${displaySize}rpx`,
    height: `${displaySize}rpx`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backdropFilter: 'blur(10rpx)',
    boxShadow: '0 8rpx 32rpx rgba(0, 0, 0, 0.3)'
  }

  // 设置背景和边框（与3D球体配置一致）
  if (sphereConfig.value.showSphereBackground) {
    style.background = `radial-gradient(${sphereConfig.value.sphereBackgroundColor} 20%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.05) 100%)`
    style.border = `${sphereConfig.value.sphereBorderWidth}rpx solid ${sphereConfig.value.sphereBorderColor}`
  } else {
    style.background = 'radial-gradient(rgba(0, 0, 0, 0.4) 20%, rgba(0, 0, 0, 0.15) 60%, rgba(0, 0, 0, 0.08) 100%)'
    style.border = '2rpx solid rgba(255, 255, 255, 0.15)'
  }

  // 设置位置（与3D球体容器位置完全一致）
  if (centerX === 50 && centerY === 50) {
    style.top = '50%'
    style.left = '50%'
    style.transform = 'translate(-50%, -50%)'
  } else {
    style.top = `${centerY}%`
    style.left = `${centerX}%`
    style.transform = 'translate(-50%, -50%)'
  }

  return style
})

// 方法

function getGenderIcon(gender) {
  const iconMap = {
    1: 'icon-sex_man',
    2: 'icon-sex_woman',
    0: 'icon-gender_unknown'
  }
  return iconMap[gender] || 'icon-gender_unknown'
}

function getGenderColor(gender) {
  const colorMap = {
    1: '#007AFF',
    2: '#FF2D92',
    0: '#FF9500'
  }
  return colorMap[gender] || '#999'
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
    // 限制最多选3个技能
    if (filterSkills.value.length < 4) {
      filterSkills.value.push(skill)
    } else {
      uni.showToast({
        title: '最多只能选择4个技能',
        icon: 'none'
      })
    }
  }
}

function toggleCityFilter(city) {
  const index = filterCities.value.indexOf(city)
  if (index > -1) {
    filterCities.value.splice(index, 1)
  } else {
    // 限制最多选4个城市
    if (filterCities.value.length < 4) {
      filterCities.value.push(city)
    } else {
      uni.showToast({
        title: '最多只能选择4个城市',
        icon: 'none'
      })
    }
  }
}

function resetFilter() {
  filterGender.value = ''
  filterAgeMin.value = null
  filterAgeMax.value = null
  filterSkills.value = []
  filterCities.value = []

  // 重置后直接应用筛选
  applyFilter()
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
      categorie_tags: user.categorie_tags || [],
      strengths: user.strengths,
      photos: user.photos || ['/static/images/user-bg.png'],
      show_fields: user.show_fields,
      isOnline: true
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

function startSmartRecommend() {
  uni.showToast({
    title: '智能推荐功能开发中',
    icon: 'none'
  })
}

function viewMyProfile() {
  console.log('viewMyProfile')
  // 获取当前用户的信息卡数据
  const currentUser = getActiveParjobCards().find(user => user.user_id === userInfo.value._id)
  
  if (currentUser) {
    // 如果有信息卡，显示用户详情
    showUserDetail(currentUser)
  } else {
    // 如果没有信息卡，提示用户先编辑
    uni.showToast({
      title: '请先编辑您的信息卡',
      icon: 'none'
    })
  }
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
      categorie_tags: user.categorie_tags || [],
      strengths: user.strengths,
      photos: user.photos || ['/static/images/user-bg.png'],
      show_fields: user.show_fields,
      isOnline: true
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
  // 球体暂停时的处理逻辑
}

function onSphereResume() {
  // 球体恢复时的处理逻辑
}

// 页面返回拦截
onBackPress(() => {
  // 检查用户详情弹窗是否打开
  if (isUserDetailOpen.value) {
    hideUserDetail()
    return true // 阻止页面返回
  }
  return false // 允许页面正常返回
})

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

/* 功能区块样式 */
.function-blocks {
  position: absolute;
  bottom: 120rpx;
  left: 12rpx;
  right: 12rpx;
  z-index: 80;
}

.function-card {
  border-radius: 16rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  padding: 0 !important;
  margin: 4px 6px 12px !important;
  overflow: hidden;
}

.function-card:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
}

.card-content {
  display: flex;
  align-items: center;
  padding: 2rpx 4rpx;
}

.uni-card__content {
  padding: 0 !important;
}

.block-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.edit-profile-card .block-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.filter-card .block-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.smart-recommend-card .block-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.block-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.block-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5rpx;
}

.block-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.card-actions {
  display: flex;
  align-items: center;
  width: 200rpx;
  justify-content: space-between;
  gap: 10rpx;
}

.card-actions-eye {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  align-items: center;
}

.filter-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.filter-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
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
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #eee;
  background: #fff;
  flex-shrink: 0;
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

.fixed-users-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40rpx;
  position: relative;
}

/* 1个用户时的布局 */
.users-count-1 .fixed-user-item {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 2个用户时的布局 - 并排展示 */
.users-count-2 {
  flex-direction: row;
  gap: 100rpx;
  align-items: center;
  justify-content: center;
}

.users-count-2 .fixed-user-item {
  flex: 0 0 auto;
  width: 200rpx;
}

/* 3个用户时的布局 - 三角形分布 */
.users-count-3 {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 60rpx;
  align-items: center;
  justify-content: center;
}

.users-count-3 .fixed-user-item:nth-child(1) {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.users-count-3 .fixed-user-item:nth-child(2) {
  position: absolute;
  top: 75%;
  left: 35%;
  transform: translate(-50%, -50%);
}

.users-count-3 .fixed-user-item:nth-child(3) {
  position: absolute;
  top: 75%;
  left: 65%;
  transform: translate(-50%, -50%);
}

.fixed-user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 200rpx;
  height: 280rpx;
}

.fixed-user-item:active {
  transform: scale(0.95);
}

.fixed-user-avatar {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.25);
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-gender-icon {
  position: absolute;
  bottom: 15rpx;
  right: 15rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.fixed-user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  margin-top: 2rpx;
  min-height: 60rpx;
  justify-content: flex-start;
}

.fixed-user-name {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
  text-align: center;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fixed-user-city {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.5);
}

.fixed-user-skills {
  display: flex;
  justify-content: center;
  width: 200rpx;
  margin-top: 8rpx;
}

.fixed-user-skills-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* 没有用户时的提示样式 */
.no-users-display {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.no-users-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  text-align: center;
}

.no-users-title {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.no-users-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
