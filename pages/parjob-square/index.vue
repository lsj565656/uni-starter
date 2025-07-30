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

    <!-- 3D球体容器 -->
    <view class="sphere-container" :style="sphereContainerStyle" @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
      <!-- 旋转球体 -->
      <view class="sphere" :class="{ 'paused': isPaused }" :style="sphereRotationStyle">
        <view v-for="(user, index) in activeUsers" :key="user._id" class="sphere-item"
          :style="getSphereItemStyle(index)">
          <view class="item-content">
            <!-- 实心点 -->
            <view class="item-dot" @click="handleUserDotClick(user, $event)"></view>

            <!-- 用户信息 -->
            <view class="item-info" @click="handleUserInfoClick(user, $event)">
              <text class="item-name">{{ user.nickname }}</text>
              <view class="item-gender">
                <uni-icons :type="getGenderIcon(user.gender)" size="16" :color="getGenderColor(user.gender)" />
              </view>
            </view>
          </view>
        </view>
      </view>


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
    <uni-popup ref="filterPopup" type="bottom">
      <view class="filter-modal">
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <view class="filter-close" @click="hideFilterModal">
            <uni-icons type="close" size="20" color="#333" />
          </view>
        </view>

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
            <input v-model="filterAgeMin" class="age-input" type="number" placeholder="最小年龄" />
            <text class="age-separator">-</text>
            <input v-model="filterAgeMax" class="age-input" type="number" placeholder="最大年龄" />
          </view>
        </view>

        <!-- 技能筛选 -->
        <view class="filter-section">
          <text class="filter-label">技能标签</text>
          <view class="skill-filter">
            <view v-for="skill in availableSkills" :key="skill" class="skill-filter-item"
              :class="{ active: filterSkills.includes(skill) }" @click="toggleSkillFilter(skill)">
              {{ skill }}
            </view>
          </view>
        </view>

        <!-- 城市筛选 -->
        <view class="filter-section">
          <text class="filter-label">城市</text>
          <view class="city-filter">
            <view v-for="city in availableCities" :key="city" class="city-filter-item"
              :class="{ active: filterCities.includes(city) }" @click="toggleCityFilter(city)">
              {{ city }}
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
    <uni-popup ref="userDetailPopup" type="center">
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
import { getActiveParjobCards, getAvailableCities, getAvailableSkills, getFilteredParjobCards } from '@/utils/parjob-cards.js'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// 响应式数据
const activeUsers = ref([])
const selectedUser = ref(null)
const isPaused = ref(false)
const rotationTimer = ref(null)
const currentRotation = ref(0)
const isUserDetailOpen = ref(false) // 新增：用户详情弹窗是否打开

// 屏幕信息
const screenInfo = ref({
  width: 0,
  height: 0,
  pixelRatio: 1
})

// 可配置的公转参数
const sphereConfig = ref({
  // 公转中心点配置
  centerX: 50, // 水平中心点
  centerY: 50, // 垂直中心点

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

const rotationSpeed = ref(sphereConfig.value.baseSpeed) // 旋转速度
const rotationDirection = ref(sphereConfig.value.defaultDirection) // 旋转方向：1为顺时针，-1为逆时针

// 多方向公转相关变量
const currentRotationAngle = ref(0) // 当前公转角度（度）
const targetRotationAngle = ref(0) // 目标公转角度（度）
const rotationAxis = ref('Y') // 当前旋转轴（限制在XY平面）
const isCustomRotation = ref(false) // 是否使用自定义旋转角度


// 手势控制相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isSliding = ref(false)
const lastTouchX = ref(0)
const lastTouchY = ref(0)
const velocityDecayTimer = ref(null)

// 拖拽相关变量
const isDragging = ref(false)
const dragStartTime = ref(0)
const dragVelocity = ref(0)
const dragDirection = ref(1)
const dragAngle = ref(0)
const dragDecayTimer = ref(null)

// 防抖相关变量
const moveThreshold = 8 // 移动阈值，避免微小抖动

// 智能暂停和恢复机制相关变量
const isPausedForViewing = ref(false) // 是否因查看而暂停
const touchHoldDuration = ref(0) // 触摸持续时间

// 缓存原始公转状态
const cachedRotationSpeed = ref(0) // 缓存的旋转速度
const cachedRotationDirection = ref(1) // 缓存的旋转方向
const cachedRotationAngle = ref(0) // 缓存的旋转角度
const isRestoringFromCache = ref(false) // 是否正在从缓存恢复

// 自动恢复相关
const autoResumeTimer = ref(null) // 自动恢复定时器

const autoResumeDelay = 3000 // 自动恢复延迟（3秒）

// 筛选相关
const filterGender = ref('')
const filterAgeMin = ref('')
const filterAgeMax = ref('')
const filterSkills = ref([])
const filterCities = ref([])

// 性别选项
const genderOptions = [
  { value: '', label: '全部' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' }
]

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

const availableSkills = computed(() => {
  return getAvailableSkills()
})

const availableCities = computed(() => {
  return getAvailableCities()
})

// 球体旋转样式 - 严格限制在XY平面
const sphereRotationStyle = computed(() => {
  // 多方向旋转：严格限制在XY平面
  if (sphereConfig.value.enableMultiDirection && isCustomRotation.value) {
    // 计算垂直于滑动方向的旋转轴，严格限制在XY平面
    const rotationRad = currentRotationAngle.value * Math.PI / 180
    const perpendicularAngle = rotationRad + Math.PI / 2
    const axisX = Math.cos(perpendicularAngle)
    const axisY = Math.sin(perpendicularAngle)

    // 确保Z轴分量为0，严格限制在XY平面
    const axisZ = 0

    // 根据旋转方向调整旋转角度
    const rotationAngle = currentRotation.value * rotationDirection.value

    return {
      transform: `translate(-50%, -50%) rotate3d(${axisX}, ${axisY}, ${axisZ}, ${rotationAngle}deg)`
    }
  } else {
    // 传统单轴旋转 - 也限制在XY平面
    const axis = rotationAxis.value.toLowerCase()
    if (axis === 'z') {
      // 如果默认轴是Z轴，改为Y轴旋转
      return {
        transform: `translate(-50%, -50%) rotateY(${currentRotation.value}deg)`
      }
    } else {
      return {
        transform: `translate(-50%, -50%) rotate${axis.toUpperCase()}(${currentRotation.value}deg)`
      }
    }
  }
})

// 球体容器样式 - 让centerX和centerY配置真正生效
const sphereContainerStyle = computed(() => {
  // 如果屏幕宽度为0，使用默认值
  const screenWidth = screenInfo.value.width || 750 // 默认750rpx
  const sphereSize = Math.min(
    screenWidth * sphereConfig.value.sphereSizePercent / 100,
    screenWidth * 2 // 最大不超过屏幕宽度的200%
  )

  const style = {
    width: `${sphereSize}rpx !important`,
    height: `${sphereSize}rpx !important`,
    overflow: 'visible !important', // 确保用户点不会被裁剪
    position: 'absolute !important',
    borderRadius: '50% !important',
    // 明确禁用所有滤镜效果
    filter: 'none !important',
    backdropFilter: 'none !important',
    webkitBackdropFilter: 'none !important'
  }

  // 根据配置设置背景和边框
  if (sphereConfig.value.showSphereBackground) {
    style.background = `radial-gradient(${sphereConfig.value.sphereBackgroundColor} 20%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.05) 100%) !important`
    style.border = `${sphereConfig.value.sphereBorderWidth}rpx solid ${sphereConfig.value.sphereBorderColor} !important`
  } else {
    style.background = 'transparent !important'
    style.border = 'none !important'
  }

  // 根据centerX和centerY配置设置位置
  if (sphereConfig.value.centerX === 50 && sphereConfig.value.centerY === 50) {
    // 完全居中
    style.top = '50% !important'
    style.left = '50% !important'
    style.transform = 'translate(-50%, -50%) !important'
  } else {
    // 使用配置的中心点
    style.top = `${sphereConfig.value.centerY}% !important`
    style.left = `${sphereConfig.value.centerX}% !important`
    style.transform = 'translate(-50%, -50%) !important'
  }

  return style
})

// 计算实际半径 - 基于屏幕宽度
const actualRadius = computed(() => {
  // 如果屏幕宽度为0，使用默认值
  const screenWidth = screenInfo.value.width || 750 // 默认750rpx
  const maxRadius = screenWidth * sphereConfig.value.maxRadiusPercent / 100
  const desiredRadius = screenWidth * sphereConfig.value.radiusPercent / 100
  return Math.min(desiredRadius, maxRadius)
})

// 方法
function getGenderText(gender) {
  const genderMap = {
    male: '男',
    female: '女',
    other: '其他'
  }
  return genderMap[gender] || ''
}

function getGenderIcon(gender) {
  const iconMap = {
    male: 'male',
    female: 'female',
    other: 'help'
  }
  return iconMap[gender] || 'help'
}

function getGenderColor(gender) {
  const colorMap = {
    male: '#007AFF',
    female: '#FF2D92',
    other: '#FF9500'
  }
  return colorMap[gender] || '#999'
}

// 优化的3D位置计算 - 实现真实球面分布和深度感知
function getSphereItemStyle(index) {
  const count = activeUsers.value.length
  const radius = actualRadius.value // 使用基于屏幕宽度的实际半径

  // 防止count为0的情况
  if (count <= 0) {
    return {
      transform: 'translate3d(0rpx, 0rpx, 0rpx) rotateY(0deg) !important',
      position: 'absolute !important',
      left: '50% !important',
      top: '50% !important',
      transformOrigin: 'center center !important',
      opacity: '0 !important'
    }
  }

  // 使用改进的球面分布算法，实现更真实的球面分布
  // 1. 使用斐波那契球面分布，确保均匀分布
  // 2. 添加偏移量，避免极点和中心点
  // 3. 使用安全的纬度范围，避开极点

  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const goldenAngle = 2 * Math.PI / goldenRatio

  // 计算纬度角，避开极点（0度和180度）
  // 使用0.1到 π-0.1的范围，确保不在极点
  const minLat = 0.1 // 最小纬度，避开北极
  const maxLat = Math.PI - 0.1 // 最大纬度，避开南极
  const latRange = maxLat - minLat

  // 为每个点计算独特的球面坐标
  const phi = minLat + (latRange * (index + 0.5)) / count // 纬度角，避开极点
  const theta = goldenAngle * index + (index * 0.1) // 经度角，添加偏移避免对称

  // 添加额外的随机偏移，确保分布更自然
  const randomOffsetX = Math.sin(index * 1.5) * 0.05
  const randomOffsetY = Math.cos(index * 2.3) * 0.05
  const adjustedPhi = phi + randomOffsetX
  const adjustedTheta = theta + randomOffsetY

  // 计算球面坐标
  const x = Math.cos(adjustedTheta) * Math.sin(adjustedPhi)
  const y = Math.sin(adjustedTheta) * Math.sin(adjustedPhi)
  const z = Math.cos(adjustedPhi)

  // 缩放到球体半径
  const scaledX = x * radius
  const scaledY = y * radius
  const scaledZ = z * radius

  // 生成现代设计色彩
  const colors = [
    'hsl(220, 85%, 65%)', // 蓝色
    'hsl(120, 75%, 60%)', // 绿色
    'hsl(350, 80%, 65%)', // 红色
    'hsl(280, 75%, 65%)', // 紫色
    'hsl(40, 85%, 65%)',  // 橙色
    'hsl(180, 75%, 60%)', // 青色
    'hsl(320, 80%, 65%)', // 粉色
    'hsl(90, 75%, 60%)',  // 黄绿色
    'hsl(260, 75%, 65%)', // 蓝紫色
    'hsl(15, 85%, 65%)',  // 红橙色
    'hsl(150, 75%, 60%)', // 青绿色
    'hsl(300, 80%, 65%)', // 洋红色
    'hsl(200, 75%, 65%)', // 天蓝色
    'hsl(60, 85%, 65%)',  // 金黄色
    'hsl(340, 75%, 60%)', // 玫红色
    'hsl(240, 80%, 65%)', // 深蓝色
    'hsl(100, 75%, 65%)', // 草绿色
    'hsl(20, 85%, 65%)',  // 橙红色
    'hsl(270, 75%, 60%)', // 紫蓝色
    'hsl(140, 80%, 65%)'  // 薄荷绿
  ]

  // 如果超过预定义颜色数量，使用循环生成
  const colorIndex = index % colors.length
  const dynamicColor = index >= colors.length
    ? `hsl(${(index * 18) % 360}, 75%, 60%)`
    : colors[colorIndex]

  // 检查用户点是否在可视范围内
  const screenWidth = screenInfo.value.width || 750
  const sphereSize = Math.min(screenWidth * sphereConfig.value.sphereSizePercent / 100, screenWidth * 2)

  // 计算用户点在屏幕上的实际位置（考虑球体旋转，限制在XY平面）
  const rotationRadForBounds = (currentRotation.value * Math.PI) / 180
  const rotatedXForBounds = scaledX * Math.cos(rotationRadForBounds) - scaledZ * Math.sin(rotationRadForBounds)

  // 检查是否超出边界（只考虑XY平面的位置）
  const isOutOfBounds = Math.abs(rotatedXForBounds) > sphereSize / 2 || Math.abs(scaledY) > sphereSize / 2

  return {
    '--index': index,
    '--num-elements': count,
    '--radius': radius,
    '--phi': adjustedPhi,
    '--theta': adjustedTheta,
    '--x': x,
    '--y': y,
    '--z': z,
    '--scaled-x': scaledX,
    '--scaled-y': scaledY,
    '--scaled-z': scaledZ,
    '--color': dynamicColor, // 动态设置颜色

    // 使用translate3d定位，添加自转抵消翻转
    transform: (() => {
      let transform = `translate3d(${scaledX}rpx, ${scaledY}rpx, ${scaledZ}rpx)`

      if (sphereConfig.value.enableMultiDirection && isCustomRotation.value) {
        // 多方向旋转：使用与公转相同的轴进行自转，严格限制在XY平面
        const rotationRad = currentRotationAngle.value * Math.PI / 180
        const perpendicularAngle = rotationRad + Math.PI / 2
        const axisX = Math.cos(perpendicularAngle)
        const axisY = Math.sin(perpendicularAngle)
        const axisZ = 0 // 确保Z轴分量为0
        // 自转方向与公转方向相反，抵消翻转效果
        const selfRotation = -currentRotation.value * rotationDirection.value
        transform += ` rotate3d(${axisX}, ${axisY}, ${axisZ}, ${selfRotation}deg)`
      } else {
        // 单轴旋转 - 限制在XY平面
        const selfRotation = -currentRotation.value
        transform += ` rotateY(${selfRotation}deg)`
      }

      return `${transform} !important`
    })(),
    position: 'absolute !important',
    left: '50% !important',
    top: '50% !important',
    transformOrigin: 'center center !important',
    // 超出边界的用户点隐藏
    opacity: isOutOfBounds ? '0' : '1',
    pointerEvents: isOutOfBounds ? 'none' : 'auto'
  }
}

// 启动旋转动画 - 支持多方向公转
function startRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
  }


  rotationTimer.value = setInterval(() => {
    try {
      // 只在没有手动操作、不在查看暂停状态、且用户详情弹窗未打开时才自动旋转
      if (!isSliding.value && !isDragging.value && !isPaused.value && !isPausedForViewing.value && !isUserDetailOpen.value) {
        currentRotation.value += rotationSpeed.value * rotationDirection.value

        // 只在非多方向模式下重置角度
        if (!sphereConfig.value.enableMultiDirection) {
          if (currentRotation.value >= 360) {
            currentRotation.value = 0
          } else if (currentRotation.value < 0) {
            currentRotation.value = 360
          }
        }


        // 多方向公转时，平滑过渡到目标角度
        if (sphereConfig.value.enableMultiDirection && isCustomRotation.value) {
          const angleDiff = targetRotationAngle.value - currentRotationAngle.value
          if (Math.abs(angleDiff) > 1) {
            currentRotationAngle.value += angleDiff * 0.1 // 平滑过渡
          }
        }
      }
    } catch (error) {
      console.error('❌ 旋转动画出错:', error)
      // 出错时重置状态
      isPaused.value = false
      isPausedForViewing.value = false
      isSliding.value = false
      isDragging.value = false
      isUserDetailOpen.value = false
    }
  }, 16) // 16ms更新一次，约60fps，提高流畅性
}

// 停止旋转
function stopRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}

// 改进的手势控制
function onTouchStart(event) {
  // 阻止事件冒泡，避免重复触发
  event.stopPropagation()
  const touch = event.touches[0]

  // 检查触摸位置是否在可控制区域内
  const screenWidth = screenInfo.value.width || 750
  const sphereSize = Math.min(screenWidth * sphereConfig.value.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (screenInfo.value.height || 1334) / 2

  const touchDistance = Math.hypot(touch.clientX - centerX, touch.clientY - centerY)
  const maxDistance = sphereSize / 2

  // 如果触摸位置超出可控制区域，不处理滑动
  if (touchDistance > maxDistance) {
    return
  }

  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
  touchStartTime.value = Date.now()
  isSliding.value = false

  // 初始化拖拽状态
  isDragging.value = false
  dragStartTime.value = Date.now()
  dragVelocity.value = 0
  dragDirection.value = 1
  dragAngle.value = 0

  // 记录触摸开始时间，用于计算触摸持续时间
  touchHoldDuration.value = 0

  // 设置触摸标志，防止自动旋转
  isPausedForViewing.value = true


  // 清除自动恢复定时器
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }

  // 如果当前是暂停状态，检查是否命中用户点
  if (isPaused.value) {
    checkUserClick(touch.clientX, touch.clientY).then(clickedUser => {
      if (clickedUser) {
        // 缓存当前的公转状态
        cachedRotationSpeed.value = rotationSpeed.value
        cachedRotationDirection.value = rotationDirection.value
        cachedRotationAngle.value = currentRotation.value
        // 保持暂停状态，显示用户详情
        showUserDetail(clickedUser)
        isRestoringFromCache.value = true
        startAutoResumeTimer()
      } else {
        // 暂停状态下点击空白区域，立即恢复
        resumeFromCache()
      }
    }).catch(error => {
      console.error('❌ 检查用户点击失败:', error)
      // 出错时也恢复公转
      resumeFromCache()
    })
    return // 暂停状态下不执行后续逻辑
  }

  // 手指刚进入时，不要立即暂停，避免抖动
  // 只有在真正开始滑动时才暂停
  // isPaused.value = true
  // isPausedForViewing.value = true

  // 缓存当前的公转状态
  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  // 清除之前的衰减定时器
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }

  // 添加延迟，避免手指刚进入时的抖动
  setTimeout(() => {
    // 延迟后检查是否还在触摸
    if (isSliding.value) {
      // 如果已经开始滑动，不执行任何操作
      return
    }
  }, 100) // 100ms延迟


}

function onTouchMove(event) {
  // 阻止事件冒泡，避免重复触发
  event.stopPropagation()

  const touch = event.touches[0]
  const currentX = touch.clientX
  const currentY = touch.clientY

  // 检查触摸位置是否在可控制区域内
  const screenWidth = screenInfo.value.width || 750
  const sphereSize = Math.min(screenWidth * sphereConfig.value.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (screenInfo.value.height || 1334) / 2

  const touchDistance = Math.hypot(currentX - centerX, currentY - centerY)
  const maxDistance = sphereSize / 2

  // 如果触摸位置超出可控制区域，不处理滑动
  if (touchDistance > maxDistance) {
    return
  }

  const deltaX = currentX - lastTouchX.value
  const deltaY = currentY - lastTouchY.value
  const deltaTime = Date.now() - touchStartTime.value

  // 更新触摸持续时间
  touchHoldDuration.value = deltaTime

  // 计算总移动距离
  const totalDelta = Math.hypot(deltaX, deltaY)


  // 如果移动距离超过阈值，认为是拖拽操作
  if (totalDelta > moveThreshold) {
    // 开始拖拽
    isDragging.value = true
    isSliding.value = false

    // 只有在之前是暂停状态时才恢复控制
    if (isPaused.value || isPausedForViewing.value) {
      isPaused.value = false
      isPausedForViewing.value = false
    }

    // 计算拖拽角度（手指滑动方向）
    const slideAngle = Math.atan2(deltaY, deltaX)
    const angleDegrees = slideAngle * 180 / Math.PI

    // 根据拖拽方向确定旋转方向
    let rotationDir = 1
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      rotationDir = deltaX > 0 ? 1 : -1
    } else {
      rotationDir = deltaY > 0 ? 1 : -1
    }

    // 设置拖拽角度和方向
    dragAngle.value = angleDegrees
    dragDirection.value = rotationDir

    // 设置公转角度（考虑旋转方向）
    isCustomRotation.value = true
    currentRotationAngle.value = angleDegrees
    targetRotationAngle.value = angleDegrees

    // 设置旋转方向
    rotationDirection.value = rotationDir

    // 拖拽跟随：直接跟随手指移动，使用适中的增量
    const rotationIncrement = Math.min(totalDelta / 1000, 2) // 适中的增量
    currentRotation.value += rotationIncrement * rotationDirection.value
  }

  // 更新上一次触摸位置
  lastTouchX.value = currentX
  lastTouchY.value = currentY
  // 不要重置touchStartTime，保持正确的时间计算
}

function onTouchEnd(event) {
  // 阻止事件冒泡，避免重复触发
  event.stopPropagation()

  // 检查触摸位置是否在可控制区域内
  const screenWidth = screenInfo.value.width || 750
  const sphereSize = Math.min(screenWidth * sphereConfig.value.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (screenInfo.value.height || 1334) / 2

  const touchDistance = Math.hypot(lastTouchX.value - centerX, lastTouchY.value - centerY)
  const maxDistance = sphereSize / 2

  // 如果触摸位置超出可控制区域，不处理滑动
  if (touchDistance > maxDistance) {
    return
  }

  if (isDragging.value) {
    // 无缝衔接：立即转换为滑动状态
    isSliding.value = true
    isDragging.value = false

    // 拖拽完成后，直接使用baseSpeed，不使用拖拽获得的速度
    rotationSpeed.value = sphereConfig.value.baseSpeed
    rotationDirection.value = dragDirection.value
    currentRotationAngle.value = dragAngle.value
    targetRotationAngle.value = dragAngle.value

    // 拖拽结束：设置最大速度然后衰减到基本速度
    rotationSpeed.value = sphereConfig.value.maxSpeed

    // 缓存当前状态
    cachedRotationSpeed.value = rotationSpeed.value
    cachedRotationDirection.value = rotationDirection.value
    cachedRotationAngle.value = currentRotation.value
    isRestoringFromCache.value = false

    // 使用startVelocityDecay衰减到基本速度
    startVelocityDecay()

  } else {
    // 没有滑动，检查是否命中用户点
    checkUserClick(lastTouchX.value, lastTouchY.value).then(clickedUser => {
      if (clickedUser) {
        // 命中了用户点且没有滑动

        // 缓存当前的公转状态
        cachedRotationSpeed.value = rotationSpeed.value
        cachedRotationDirection.value = rotationDirection.value
        cachedRotationAngle.value = currentRotation.value

        showUserDetail(clickedUser)
        // 保持暂停状态，等待用户关闭弹窗
        isPaused.value = true
        isPausedForViewing.value = true
        isRestoringFromCache.value = true

        // 启动自动恢复定时器
        startAutoResumeTimer()

      } else {
        // 没有命中用户点，恢复原始公转状态
        isPausedForViewing.value = false // 重置触摸标志
        resumeFromCache()
      }
    }).catch(error => {
      console.error('❌ 检查用户点击失败:', error)
      // 出错时也恢复公转
      resumeFromCache()
    })
  }

  isSliding.value = false
  isPausedForViewing.value = false // 重置触摸标志
}

// 速度衰减机制
function startVelocityDecay() {
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
  }

  velocityDecayTimer.value = setInterval(() => {
    // 逐渐降低速度到基础速度
    if (rotationSpeed.value > sphereConfig.value.baseSpeed) {
      const decayRate = 0.95 // 每次衰减5%，更平滑
      rotationSpeed.value = Math.max(
        rotationSpeed.value * decayRate,
        sphereConfig.value.baseSpeed
      )
    } else {
      // 达到基础速度后停止衰减
      clearInterval(velocityDecayTimer.value)
      velocityDecayTimer.value = null

      // 确保状态正确，恢复正常的自动旋转
      isSliding.value = false
      isDragging.value = false
      isPaused.value = false
      isPausedForViewing.value = false
    }
  }, 100) // 每100ms衰减一次，更平滑
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
  filterAgeMin.value = ''
  filterAgeMax.value = ''
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

    if (filterAgeMin.value && filterAgeMax.value) {
      filters.ageRange = {
        min: Number.parseInt(filterAgeMin.value),
        max: Number.parseInt(filterAgeMax.value)
      }
    }

    if (filterSkills.value.length > 0) {
      filters.skills = filterSkills.value
    }

    if (filterCities.value.length > 0) {
      filters.city = filterCities.value[0] // 暂时只支持单个城市筛选
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

  // 标记弹窗已打开
  isUserDetailOpen.value = true

  // 注意：暂停状态和缓存状态现在由调用此函数的函数处理
  // 这里不再重复设置，避免覆盖已设置的状态
}

function hideUserDetail() {
  selectedUser.value = null
  userDetailPopup.value.close()

  // 标记弹窗已关闭
  isUserDetailOpen.value = false

  // 清除自动恢复定时器
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }

  // 关闭弹窗后从缓存恢复公转状态，并使用衰减方法
  if (isRestoringFromCache.value) {
    // 从缓存恢复，但使用衰减方法
    isPaused.value = false
    isPausedForViewing.value = false
    rotationSpeed.value = sphereConfig.value.maxSpeed // 先设置最大速度
    rotationDirection.value = cachedRotationDirection.value
    currentRotation.value = cachedRotationAngle.value

    // 使用衰减方法降到基本速度
    startVelocityDecay()
  } else {
    // 直接恢复，使用衰减方法
    isPaused.value = false
    isPausedForViewing.value = false
    rotationSpeed.value = sphereConfig.value.maxSpeed // 先设置最大速度
    rotationDirection.value = sphereConfig.value.defaultDirection

    // 使用衰减方法降到基本速度
    startVelocityDecay()
  }
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

// 生命周期
onMounted(() => {
  getScreenInfo() // 获取屏幕信息
  loadActiveUsers()
  nextTick(() => {
    startRotation()

    // 初始化缓存状态
    cachedRotationSpeed.value = rotationSpeed.value
    cachedRotationDirection.value = rotationDirection.value
    cachedRotationAngle.value = currentRotation.value
  })
})

onUnmounted(() => {
  stopRotation()
  // 清理速度衰减定时器
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }

  // 清理拖拽衰减定时器
  if (dragDecayTimer.value) {
    clearInterval(dragDecayTimer.value)
    dragDecayTimer.value = null
  }

  // 清理自动恢复定时器
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }
})

// 检查点击是否在用户点上 - 优化版本
function checkUserClick(x, y) {
  try {
    return new Promise((resolve) => {
      const query = uni.createSelectorQuery()
      query.select('.sphere-container').boundingClientRect((containerRect) => {
        if (!containerRect) {
          resolve(null)
          return
        }

        const centerX = containerRect.left + containerRect.width / 2
        const centerY = containerRect.top + containerRect.height / 2

        // 计算点击位置相对于球体中心的偏移
        const offsetX = x - centerX
        const offsetY = y - centerY

        // 检查是否在球体范围内
        const distance = Math.hypot(offsetX, offsetY)
        const sphereRadius = actualRadius.value
        if (distance <= sphereRadius) {
          // 在球体范围内，查找最近的用户点
          let closestUser = null
          let minDistance = Number.POSITIVE_INFINITY

          activeUsers.value.forEach((user, index) => {
            // 获取用户点的3D位置
            const userStyle = getSphereItemStyle(index)
            const transform = userStyle.transform
            const match = transform.match(/translate3d\(([^,]+),([^,]+),([^)]+)\)/)

            if (match) {
              // 更精确的像素转换 - 使用系统像素比
              const pixelRatio = screenInfo.value.pixelRatio || 1
              const userX = Number.parseFloat(match[1]) / pixelRatio
              const userY = Number.parseFloat(match[2]) / pixelRatio
              const userZ = Number.parseFloat(match[3]) / pixelRatio

              // 考虑球体旋转对用户点位置的影响（限制在XY平面）
              // 当前旋转角度会影响用户点的实际屏幕位置
              const rotationRad = (currentRotation.value * Math.PI) / 180
              const rotatedX = userX * Math.cos(rotationRad) - userZ * Math.sin(rotationRad)
              const rotatedZ = userX * Math.sin(rotationRad) + userZ * Math.cos(rotationRad)

              // 计算2D距离（只考虑XY平面）
              const userDistance = Math.hypot(offsetX - rotatedX, offsetY - userY)

              // 根据Z轴深度调整点击范围 - 越近的点点击范围越小
              const baseClickRadius = 10 // 基础点击半径（像素）
              const depthFactor = Math.max(0.4, Math.min(1.2, 1 - Math.abs(rotatedZ) / sphereRadius))
              const clickRadius = baseClickRadius * depthFactor


              if (userDistance <= clickRadius && userDistance < minDistance) {
                minDistance = userDistance
                closestUser = user
              }
            }
          })


          resolve(closestUser)
        } else {
          resolve(null)
        }
      }).exec()
    })
  } catch (error) {
    console.error('❌ 检查用户点击时出错:', error)
    return Promise.resolve(null)
  }
}

// 处理用户点点击
function handleUserDotClick(user) {

  // 缓存当前的公转状态
  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  // 暂停公转
  isPaused.value = true
  isPausedForViewing.value = true
  isRestoringFromCache.value = true

  // 显示用户详情
  showUserDetail(user)

  // 启动自动恢复定时器
  startAutoResumeTimer()
}

// 处理用户信息点击
function handleUserInfoClick(user) {

  // 缓存当前的公转状态
  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  // 暂停公转
  isPaused.value = true
  isPausedForViewing.value = true
  isRestoringFromCache.value = true

  // 显示用户详情
  showUserDetail(user)

  // 启动自动恢复定时器
  startAutoResumeTimer()
}

// 从缓存恢复公转状态
function resumeFromCache() {
  // 清除自动恢复定时器
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }

  // 只有在弹窗关闭时才恢复公转
  if (!isUserDetailOpen.value) {
    isPaused.value = false
    isPausedForViewing.value = false

    // 先设置最大速度，然后使用衰减方法
    rotationSpeed.value = sphereConfig.value.maxSpeed
    rotationDirection.value = cachedRotationDirection.value
    currentRotation.value = cachedRotationAngle.value

    isRestoringFromCache.value = false

    // 使用衰减方法降到基本速度
    startVelocityDecay()
  }
}

// 启动自动恢复定时器
function startAutoResumeTimer() {
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
  }

  autoResumeTimer.value = setTimeout(() => {
    // 只有在弹窗关闭时才自动恢复
    if (!isUserDetailOpen.value) {
      resumeFromCache()
    }
  }, autoResumeDelay)
}


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

/* 3D球体容器 - 限制在XY平面 */
.sphere-container {
  perspective: none;
  /* 移除透视，避免Z轴旋转 */
  transform-style: preserve-3d;
  position: absolute;
  top: 0;
  /* uni-nav-bar会自动处理状态栏和导航栏高度 */
  left: 0;
  right: 0;
  bottom: 0;
  /* 添加可控制区域的背景和边框 */
  background: radial-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  /* overflow: visible !important;   */
  /* 确保用户点不会被裁剪 */
  /* 确保可以接收触摸事件 */
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 旋转球体 - 限制在XY平面 */
.sphere {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  /* 移除固定的transform，由JavaScript动态控制 */
  z-index: 2;
  overflow: visible !important;
  /* 确保用户点不会被裁剪 */
}

.sphere.paused {
  animation-play-state: paused;
}

.sphere-item {
  position: absolute;
  width: 30rpx;
  /* 增加item容器大小 */
  height: 30rpx;
  /* 增加item容器大小 */
  /* 设置旋转中心为球体中心 */
  left: 50%;
  top: 50%;
  transform-style: preserve-3d;
  /* 确保每个item都有自己的3D变换 */
  transform-origin: center center;
  z-index: 10;
  /* 确保在最上层 */
  /* 移除过渡效果，提高性能 */
}

.sphere-item>div {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: opacity 0.3s;
  /* 移除transform，让父元素的transform生效 */
  transform: none;
}

/* 用户点样式 */
.item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  /* 确保内容始终面向用户 */
  transform-style: preserve-3d;
  /* 确保内容不会被父元素的旋转影响 */
  transform: none;
  /* 确保文本始终在点的下方 */
  position: relative;
}

.item-dot {
  width: 16rpx;
  /* 进一步增加点的大小 */
  height: 16rpx;
  /* 进一步增加点的大小 */
  border-radius: 50%;
  background: var(--color);
  box-shadow: 0 0 20rpx var(--color), 0 0 40rpx var(--color);
  /* 增强发光效果 */
  transition: all 0.3s ease;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  /* 添加边框增强可见性 */
  /* 确保可以接收触摸事件 */
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* 移除深度感知，保持原始亮度 */
}

.item-content:hover .item-dot {
  transform: scale(1.5);
  box-shadow: 0 0 30rpx var(--color), 0 0 60rpx var(--color);
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  background: rgba(0, 0, 0, 0.9);
  /* 增强背景透明度 */
  padding: 2rpx 3rpx;
  /* 增加内边距 */
  border-radius: 8rpx;
  /* 彻底移除模糊效果 */
  min-width: 50rpx;
  /* 增加最小宽度 */
  /* 确保信息卡片始终面向用户，不受父元素旋转影响 */
  transform: none;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  /* 添加边框 */
  z-index: 15;
  /* 确保在最上层 */
  /* 确保可以接收触摸事件 */
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* 确保文本始终在点的下方 */
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4rpx;
  /* 移除深度感知，保持原始透明度 */
}

.item-name {
  font-size: 16rpx;
  color: #fff;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80rpx;
}

.item-gender {
  display: flex;
  align-items: center;
  justify-content: center;
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
  /* 确保在导航栏下方 */
  z-index: 100;
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
.filter-modal {
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  max-height: 80vh;
  overflow-y: auto;
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

.age-input {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
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


/* 用户点颜色 - 由JavaScript动态生成 */
.sphere-item {
  --color: var(--color, hsl(220, 85%, 65%));
  /* 默认蓝色 */
}
</style>
