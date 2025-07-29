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
          <view class="nav-btn" @click="showDebugPanel = !showDebugPanel">
            <uni-icons type="settings" size="20" color="#333" />
          </view>
        </view>
      </template>
    </uni-nav-bar>

    <!-- 3D球体容器 -->
    <view class="sphere-container" :style="sphereContainerStyle">
      <!-- 旋转球体 -->
      <view class="sphere" :class="{ 'paused': isPaused }" :style="sphereRotationStyle">
        <view v-for="(user, index) in activeUsers" :key="user._id" class="sphere-item"
          :style="getSphereItemStyle(index)" @click="showUserDetail(user)">
          <view class="item-content" @touchstart="pauseRotation" @touchend="resumeRotation">
            <!-- 实心点 -->
            <view class="item-dot"></view>

            <!-- 用户信息 -->
            <view class="item-info">
              <text class="item-name">{{ user.nickname }}</text>
              <view class="item-gender">
                <uni-icons :type="getGenderIcon(user.gender)" size="16" :color="getGenderColor(user.gender)" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Canvas渲染层 - 只有这里响应手势 -->
      <canvas id="sphere-canvas" class="sphere-canvas" @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd" :style="{ willReadFrequently: 'true' }">
      </canvas>
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

    <!-- 调试面板 -->
    <view class="debug-panel" v-if="showDebugPanel">
      <view class="debug-header">
        <text class="debug-title">调试面板</text>
        <view class="debug-close" @click="showDebugPanel = false">
          <uni-icons type="close" size="16" color="#fff" />
        </view>
      </view>

      <!-- 分布信息 -->
      <view class="debug-section">
        <text class="debug-label">分布信息</text>
        <view class="debug-row">
          <text class="debug-text">用户数量: {{ activeUsers.length }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">球体半径: {{ Math.round(actualRadius) }}rpx</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">当前速度: {{ rotationSpeed.toFixed(2) }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">旋转方向: {{ rotationDirection === 1 ? '顺时针' : '逆时针' }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">是否暂停: {{ isPaused ? '是' : '否' }}</text>
        </view>
      </view>

      <!-- 手势调试信息 -->
      <view class="debug-section">
        <text class="debug-label">手势调试</text>
        <view class="debug-row">
          <text class="debug-text">是否拖拽: {{ isDragging ? '是' : '否' }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">速度X: {{ velocityX.toFixed(2) }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">速度Y: {{ velocityY.toFixed(2) }}</text>
        </view>
        <view class="debug-row">
          <text class="debug-text">衰减定时器: {{ velocityDecayTimer ? '运行中' : '已停止' }}</text>
        </view>
      </view>

      <!-- 中心点配置 -->
      <view class="debug-section">
        <text class="debug-label">中心点配置</text>
        <view class="debug-row">
          <text class="debug-text">X: {{ sphereConfig.centerX }}%</text>
          <slider :value="sphereConfig.centerX" @change="(e) => sphereConfig.centerX = e.detail.value" min="0" max="100"
            step="1" class="debug-slider" />
        </view>
        <view class="debug-row">
          <text class="debug-text">Y: {{ sphereConfig.centerY }}%</text>
          <slider :value="sphereConfig.centerY" @change="(e) => sphereConfig.centerY = e.detail.value" min="0" max="100"
            step="1" class="debug-slider" />
        </view>
      </view>

      <!-- 公转半径配置 -->
      <view class="debug-section">
        <text class="debug-label">公转半径配置</text>
        <view class="debug-row">
          <text class="debug-text">公转半径: {{ sphereConfig.radiusPercent }}% ({{ Math.round(actualRadius) }}rpx)</text>
          <slider :value="sphereConfig.radiusPercent" @change="(e) => sphereConfig.radiusPercent = e.detail.value"
            min="10" max="200" step="1" class="debug-slider" />
        </view>
        <view class="debug-row">
          <text class="debug-text">最大半径: {{ sphereConfig.maxRadiusPercent }}%</text>
          <slider :value="sphereConfig.maxRadiusPercent" @change="(e) => sphereConfig.maxRadiusPercent = e.detail.value"
            min="20" max="200" step="5" class="debug-slider" />
        </view>
      </view>

      <!-- 球体背景和边框配置 -->
      <view class="debug-section">
        <text class="debug-label">球体背景和边框</text>
        <view class="debug-row">
          <text class="debug-text">显示背景: {{ sphereConfig.showSphereBackground ? '是' : '否' }}</text>
          <button class="debug-btn" :class="{ active: sphereConfig.showSphereBackground }"
            @click="sphereConfig.showSphereBackground = true">
            显示
          </button>
          <button class="debug-btn" :class="{ active: !sphereConfig.showSphereBackground }"
            @click="sphereConfig.showSphereBackground = false">
            隐藏
          </button>
        </view>
        <view class="debug-row">
          <text class="debug-text">背景颜色: {{ sphereConfig.sphereBackgroundColor }}</text>
          <input type="color" v-model="sphereConfig.sphereBackgroundColor" class="debug-color-input" />
        </view>
        <view class="debug-row">
          <text class="debug-text">边框颜色: {{ sphereConfig.sphereBorderColor }}</text>
          <input type="color" v-model="sphereConfig.sphereBorderColor" class="debug-color-input" />
        </view>
        <view class="debug-row">
          <text class="debug-text">边框宽度: {{ sphereConfig.sphereBorderWidth }}rpx</text>
          <slider :value="sphereConfig.sphereBorderWidth"
            @change="(e) => sphereConfig.sphereBorderWidth = e.detail.value" min="0" max="5" step="1"
            class="debug-slider" />
        </view>
        <view class="debug-info">
          <text class="debug-text">💡 提示: 背景色建议使用rgba格式，如rgba(0,0,0,0.3)</text>
        </view>
      </view>

      <!-- 球体大小配置 -->
      <view class="debug-section">
        <text class="debug-label">球体大小配置</text>
        <view class="debug-row">
          <text class="debug-text">容器大小: {{ sphereConfig.sphereSizePercent }}%</text>
          <slider :value="sphereConfig.sphereSizePercent"
            @change="(e) => sphereConfig.sphereSizePercent = e.detail.value" min="1" max="200" step="5"
            class="debug-slider" />
        </view>
      </view>

      <!-- 速度配置 -->
      <view class="debug-section">
        <text class="debug-label">速度配置</text>
        <view class="debug-row">
          <text class="debug-text">基础速度: {{ sphereConfig.baseSpeed }}</text>
          <slider :value="sphereConfig.baseSpeed * 10" @change="(e) => sphereConfig.baseSpeed = e.detail.value / 10"
            min="1" max="50" step="1" class="debug-slider" />
        </view>
        <view class="debug-row">
          <text class="debug-text">最大速度: {{ sphereConfig.maxSpeed }}</text>
          <slider :value="sphereConfig.maxSpeed * 10" @change="(e) => sphereConfig.maxSpeed = e.detail.value / 10"
            min="10" max="100" step="1" class="debug-slider" />
        </view>
      </view>

      <!-- 方向配置 -->
      <view class="debug-section">
        <text class="debug-label">方向配置</text>
        <view class="debug-row">
          <button class="debug-btn" :class="{ active: rotationDirection === 1 }" @click="rotationDirection = 1">
            顺时针
          </button>
          <button class="debug-btn" :class="{ active: rotationDirection === -1 }" @click="rotationDirection = -1">
            逆时针
          </button>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="debug-actions">
        <button class="debug-action-btn" @click="resetConfig">重置配置</button>
        <button class="debug-action-btn" @click="pauseRotation">暂停</button>
        <button class="debug-action-btn" @click="resumeRotation">继续</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// 响应式数据
const activeUsers = ref([])
const selectedUser = ref(null)
const isPaused = ref(false)
const rotationTimer = ref(null)
const currentRotation = ref(0)

// 屏幕信息
const screenInfo = ref({
  width: 0,
  height: 0,
  pixelRatio: 1
})

// 可配置的公转参数
const sphereConfig = ref({
  // 公转中心点配置 (相对于屏幕的百分比)
  centerX: 50, // 水平中心点 (50% = 屏幕中心)
  centerY: 50, // 垂直中心点 (50% = 屏幕中心)

  // 公转半径配置 (相对于屏幕宽度的百分比)
  radiusPercent: 100, // 公转半径占屏幕宽度的百分比
  maxRadiusPercent: 120, // 最大半径占屏幕宽度的百分比（允许超过屏幕宽度）

  // 球体大小配置 (相对于屏幕宽度的百分比 200% 最大 占整个屏幕)
  sphereSizePercent: 200, // 球体容器占屏幕宽度的百分比 - 设置合理的默认值

  // 球体背景和边框配置
  showSphereBackground: true, // 是否显示球体背景
  sphereBackgroundColor: 'rgba(0, 0, 0, 0.3)', // 球体背景颜色 - 更透明
  sphereBorderColor: 'rgba(255, 255, 255, 0.1)', // 球体边框颜色 - 更透明
  sphereBorderWidth: 1, // 球体边框宽度 - 更细

  // 公转速度配置
  baseSpeed: 1, // 基础旋转速度
  maxSpeed: 3,  // 最大旋转速度
  minSpeed: 0.5, // 最小旋转速度

  // 公转方向配置
  defaultDirection: 1, // 默认旋转方向 (1=顺时针, -1=逆时针)
})

const rotationSpeed = ref(sphereConfig.value.baseSpeed) // 旋转速度
const rotationDirection = ref(sphereConfig.value.defaultDirection) // 旋转方向：1为顺时针，-1为逆时针

// 调试面板相关
const showDebugPanel = ref(false) // 是否显示调试面板

// 手势控制相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isDragging = ref(false)
const lastTouchX = ref(0)
const lastTouchY = ref(0)
const velocityX = ref(0)
const velocityY = ref(0)
const velocityDecayTimer = ref(null)

// 筛选相关
const filterGender = ref('')
const filterAgeMin = ref('')
const filterAgeMax = ref('')
const filterSkills = ref([])
const filterCities = ref([])

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
  const skills = new Set()
  activeUsers.value.forEach(user => {
    if (user.skills) {
      user.skills.forEach(skill => skills.add(skill))
    }
  })
  return [...skills]
})

const availableCities = computed(() => {
  const cities = new Set()
  activeUsers.value.forEach(user => {
    if (user.city) {
      cities.add(user.city)
    }
  })
  return [...cities]
})

// 球体旋转样式 - 使用可配置的中心点
const sphereRotationStyle = computed(() => {
  return {
    transform: `rotateY(${currentRotation.value}deg)`
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

// 优化的3D位置计算 - 所有点都在球体表面，避免极点和中心点
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

  // 使用改进的球面分布算法，完全避开极点和中心点
  // 1. 使用斐波那契球面分布，确保均匀分布
  // 2. 添加偏移量，避免极点和中心点
  // 3. 使用安全的纬度范围，避开极点

  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const goldenAngle = 2 * Math.PI / goldenRatio

  // 计算纬度角，避开极点（0度和180度）
  // 使用0.1到π-0.1的范围，确保不在极点
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

  // 让卡片往横轴线靠拢 - 压缩Y轴坐标
  const compressedY = y * 0.5 // 压缩Y轴到50%
  const adjustedZ = z * 0.8 // 稍微压缩Z轴到80%

  // 缩放到球体半径
  const scaledX = x * radius
  const scaledY = compressedY * radius
  const scaledZ = adjustedZ * radius

  // 计算自转角度，抵消公转翻转，确保卡片始终面向用户
  const selfRotation = -currentRotation.value

  return {
    '--index': index,
    '--num-elements': count,
    '--radius': radius,
    '--phi': adjustedPhi,
    '--theta': adjustedTheta,
    '--x': x,
    '--y': compressedY,
    '--z': adjustedZ,
    '--scaled-x': scaledX,
    '--scaled-y': scaledY,
    '--scaled-z': scaledZ,
    // 使用translate3d定位，添加自转抵消翻转，强制覆盖CSS
    transform: `translate3d(${scaledX}rpx, ${scaledY}rpx, ${scaledZ}rpx) rotateY(${selfRotation}deg) !important`,
    position: 'absolute !important',
    left: '50% !important',
    top: '50% !important',
    transformOrigin: 'center center !important'
  }
}

// 启动旋转动画 - 使用可配置的速度参数
function startRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
  }

  rotationTimer.value = setInterval(() => {
    if (!isPaused.value) {
      currentRotation.value += rotationSpeed.value * rotationDirection.value
      if (currentRotation.value >= 360) {
        currentRotation.value = 0
      } else if (currentRotation.value < 0) {
        currentRotation.value = 360
      }
    }
  }, 50) // 50ms更新一次，约20fps
}

// 停止旋转
function stopRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}

function pauseRotation() {
  isPaused.value = true
}

function resumeRotation() {
  isPaused.value = false
}

// 改进的手势控制
function onTouchStart(event) {
  console.log('🖐️ Touch Start:', event.touches[0])
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
  touchStartTime.value = Date.now()
  isDragging.value = false
  isPaused.value = true

  // 清除之前的衰减定时器
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }
}

function onTouchMove(event) {
  const touch = event.touches[0]
  const currentX = touch.clientX
  const currentY = touch.clientY
  const deltaX = currentX - lastTouchX.value
  const deltaY = currentY - lastTouchY.value
  const deltaTime = Date.now() - touchStartTime.value

  // 计算速度
  velocityX.value = deltaX / Math.max(deltaTime, 1) * 1000 // 像素/秒
  velocityY.value = deltaY / Math.max(deltaTime, 1) * 1000

  // 判断是否为有效拖拽
  const totalDelta = Math.hypot(deltaX, deltaY)
  if (totalDelta > 5) { // 降低阈值，提高灵敏度
    isDragging.value = true

    // 计算滑动方向角度（弧度）
    const angle = Math.atan2(deltaY, deltaX)

    // 将角度转换为旋转方向
    // 水平向右 = 0度，垂直向下 = 90度
    const rotationAngle = angle * (180 / Math.PI)

    // 根据滑动方向计算旋转方向
    // 向右滑动 = 顺时针，向左滑动 = 逆时针
    // 向下滑动 = 顺时针，向上滑动 = 逆时针
    const speed = Math.min(totalDelta / 30, sphereConfig.value.maxSpeed) // 提高灵敏度

    // 计算旋转速度的X和Y分量
    const speedX = Math.cos(angle) * speed
    const speedY = Math.sin(angle) * speed

    // 综合X和Y方向的速度
    rotationSpeed.value = Math.hypot(speedX, speedY)

    // 根据滑动方向确定旋转方向
    // 这里可以根据需要调整方向映射
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 主要是水平滑动
      rotationDirection.value = deltaX > 0 ? 1 : -1
    } else {
      // 主要是垂直滑动
      rotationDirection.value = deltaY > 0 ? 1 : -1
    }

    // 实时更新旋转
    currentRotation.value += rotationSpeed.value * rotationDirection.value * 0.5

    console.log('🔄 Touch Move:', {
      deltaX: deltaX.toFixed(2),
      deltaY: deltaY.toFixed(2),
      totalDelta: totalDelta.toFixed(2),
      speed: rotationSpeed.value.toFixed(2),
      direction: rotationDirection.value,
      angle: rotationAngle.toFixed(2)
    })
  }

  // 更新上一次触摸位置
  lastTouchX.value = currentX
  lastTouchY.value = currentY
  touchStartTime.value = Date.now()
}

function onTouchEnd(event) {
  console.log('👋 Touch End:', isDragging.value)
  if (isDragging.value) {
    // 保持当前旋转方向，但启动速度衰减
    startVelocityDecay()
  }
  isPaused.value = false
  isDragging.value = false
}

// 速度衰减机制
function startVelocityDecay() {
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
  }

  velocityDecayTimer.value = setInterval(() => {
    // 逐渐降低速度到基础速度
    if (rotationSpeed.value > sphereConfig.value.baseSpeed) {
      rotationSpeed.value = Math.max(
        rotationSpeed.value * 0.95, // 每次衰减5%
        sphereConfig.value.baseSpeed
      )
    } else {
      // 达到基础速度后停止衰减
      clearInterval(velocityDecayTimer.value)
      velocityDecayTimer.value = null
    }
  }, 100) // 每100ms衰减一次
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
  loadActiveUsers()
  hideFilterModal()
}

function showUserDetail(user) {
  selectedUser.value = user
  userDetailPopup.value.open()
}

function hideUserDetail() {
  selectedUser.value = null
  userDetailPopup.value.close()
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

// 重置配置到默认值
function resetConfig() {
  sphereConfig.value = {
    centerX: 50,
    centerY: 50,
    radiusPercent: 100,
    maxRadiusPercent: 120,
    sphereSizePercent: 80, // 设置合理的默认值
    showSphereBackground: true,
    sphereBackgroundColor: 'rgba(0, 0, 0, 0.3)', // 更透明
    sphereBorderColor: 'rgba(255, 255, 255, 0.1)', // 更透明
    sphereBorderWidth: 1, // 更细
    baseSpeed: 1,
    maxSpeed: 3,
    minSpeed: 0.5,
    defaultDirection: 1
  }
  rotationSpeed.value = sphereConfig.value.baseSpeed
  rotationDirection.value = sphereConfig.value.defaultDirection
}

// 加载活跃用户数据
async function loadActiveUsers() {
  try {
    // 模拟云端数据 - 支持任意ID开始的数据
    const mockUsers = [
      {
        _id: '1', // 从1开始，符合云端数据规律
        nickname: '小明',
        avatar: '/static/images/user-bg.png',
        gender: 'male',
        age: 25,
        education: '本科',
        city: '北京',
        skills: ['前端开发', 'Vue.js', 'JavaScript', 'React'],
        tags: ['Web开发', '移动端', 'UI设计'],
        strengths: '擅长前端开发，有3年工作经验，熟悉Vue.js生态系统，对用户体验有深入研究',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '2',
        nickname: '小红',
        avatar: '/static/images/user-bg.png',
        gender: 'female',
        age: 28,
        education: '硕士',
        city: '上海',
        skills: ['UI设计', 'Photoshop', 'Figma', 'Sketch'],
        tags: ['设计', '创意', '品牌设计'],
        strengths: '专业UI设计师，有5年设计经验，擅长用户界面设计和品牌视觉设计',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: false
      },
      {
        _id: '3',
        nickname: '小李',
        avatar: '/static/images/user-bg.png',
        gender: 'male',
        age: 30,
        education: '本科',
        city: '深圳',
        skills: ['后端开发', 'Java', 'Spring Boot', 'MySQL'],
        tags: ['后端开发', '数据库', '微服务'],
        strengths: '资深后端工程师，精通Java技术栈，有丰富的项目经验，擅长系统架构设计',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '4',
        nickname: '小张',
        avatar: '/static/images/user-bg.png',
        gender: 'female',
        age: 26,
        education: '本科',
        city: '广州',
        skills: ['数据分析', 'Python', 'SQL', '机器学习'],
        tags: ['数据分析', '机器学习', '商业分析'],
        strengths: '数据分析师，擅长数据挖掘和可视化，有丰富的业务分析经验',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '5',
        nickname: '小王',
        avatar: '/static/images/user-bg.png',
        gender: 'male',
        age: 29,
        education: '硕士',
        city: '杭州',
        skills: ['产品经理', 'Axure', '用户研究', '数据分析'],
        tags: ['产品设计', '用户体验', '市场分析'],
        strengths: '产品经理，有4年产品设计经验，擅长用户需求分析和产品规划',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: false
      },
      {
        _id: '6',
        nickname: '小陈',
        avatar: '/static/images/user-bg.png',
        gender: 'female',
        age: 27,
        education: '本科',
        city: '成都',
        skills: ['移动端开发', 'iOS', 'Swift', 'Flutter'],
        tags: ['移动端', '跨平台', '原生开发'],
        strengths: '移动端开发工程师，精通iOS原生开发和Flutter跨平台开发',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '7',
        nickname: '小刘',
        avatar: '/static/images/user-bg.png',
        gender: 'male',
        age: 31,
        education: '本科',
        city: '武汉',
        skills: ['运维工程师', 'Linux', 'Docker', 'Kubernetes'],
        tags: ['运维', '云计算', '自动化'],
        strengths: '运维工程师，有6年运维经验，擅长容器化和自动化部署',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '8',
        nickname: '小赵',
        avatar: '/static/images/user-bg.png',
        gender: 'female',
        age: 24,
        education: '本科',
        city: '西安',
        skills: ['测试工程师', '自动化测试', 'Selenium', '性能测试'],
        tags: ['测试', '质量保证', '自动化'],
        strengths: '测试工程师，擅长自动化测试和性能测试，对软件质量有严格要求',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: false
      },
      {
        _id: '9',
        nickname: '小孙',
        avatar: '/static/images/user-bg.png',
        gender: 'male',
        age: 33,
        education: '硕士',
        city: '南京',
        skills: ['算法工程师', 'Python', '深度学习', 'TensorFlow'],
        tags: ['算法', 'AI', '机器学习'],
        strengths: '算法工程师，专注于深度学习和计算机视觉，有多个AI项目经验',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      },
      {
        _id: '10',
        nickname: '小周',
        avatar: '/static/images/user-bg.png',
        gender: 'female',
        age: 26,
        education: '本科',
        city: '重庆',
        skills: ['运营专员', '内容运营', '用户增长', '数据分析'],
        tags: ['运营', '增长', '内容'],
        strengths: '运营专员，擅长用户增长和内容运营，有丰富的社区运营经验',
        photos: ['/static/images/user-bg.png'],
        show_fields: {
          age: true,
          gender: true,
          education: true,
          city: true,
          skills: true,
          strengths: true,
          tags: true,
          photos: true
        },
        isOnline: true
      }
    ]

    activeUsers.value = mockUsers
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
  })
})

onUnmounted(() => {
  stopRotation()
  // 清理速度衰减定时器
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }
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

/* 3D球体容器 - 完全由JavaScript控制 */
.sphere-container {
  perspective: 1600rpx;
  transform-style: preserve-3d;
  position: absolute;
  top: 0;
  /* uni-nav-bar会自动处理状态栏和导航栏高度 */
  left: 0;
  right: 0;
  bottom: 0;
  /* background: radial-gradient(rgba(0, 0, 0, 0.75) 15%, rgba(0, 0, 0, 0) calc(75% - 60rpx)); */
  border-radius: 50%;
  /* overflow: visible !important;   */
  /* 确保用户点不会被裁剪 */
}

/* 旋转球体 - 完全由JavaScript控制 */
.sphere {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  transform: translate(-50%, -50%);
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

.sphere.paused .sphere-item:not(:has(div:hover)) {
  opacity: 0.25;
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
}

.item-dot {
  width: 32rpx;
  /* 进一步增加点的大小 */
  height: 32rpx;
  /* 进一步增加点的大小 */
  border-radius: 50%;
  background: var(--color);
  box-shadow: 0 0 20rpx var(--color), 0 0 40rpx var(--color);
  /* 增强发光效果 */
  transition: all 0.3s ease;
  border: 3rpx solid rgba(255, 255, 255, 0.5);
  /* 添加边框增强可见性 */
}

.item-content:hover .item-dot {
  transform: scale(1.5);
  box-shadow: 0 0 30rpx var(--color), 0 0 60rpx var(--color);
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  background: rgba(0, 0, 0, 0.9);
  /* 增强背景透明度 */
  padding: 10rpx 15rpx;
  /* 增加内边距 */
  border-radius: 12rpx;
  /* 彻底移除模糊效果 */
  min-width: 100rpx;
  /* 增加最小宽度 */
  /* 确保信息卡片始终面向用户，不受父元素旋转影响 */
  transform: none;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  /* 添加边框 */
  z-index: 15;
  /* 确保在最上层 */
}

.item-name {
  font-size: 20rpx;
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

/* Canvas渲染层 */
.sphere-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: auto;
  /* 确保可以接收触摸事件 */
  background: transparent;
  /* 禁用默认触摸行为，避免passive事件监听器警告 */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* 添加调试边框，方便查看手势区域 */
  /* border: 1px solid rgba(255, 255, 255, 0.1); */
}

/* 为每个点生成不同的颜色 */
.sphere-item:nth-child(1) {
  --color: hsl(0, 70%, 60%);
}

.sphere-item:nth-child(2) {
  --color: hsl(60, 70%, 60%);
}

.sphere-item:nth-child(3) {
  --color: hsl(120, 70%, 60%);
}

.sphere-item:nth-child(4) {
  --color: hsl(180, 70%, 60%);
}

.sphere-item:nth-child(5) {
  --color: hsl(240, 70%, 60%);
}

.sphere-item:nth-child(6) {
  --color: hsl(300, 70%, 60%);
}

.sphere-item:nth-child(7) {
  --color: hsl(30, 70%, 60%);
}

.sphere-item:nth-child(8) {
  --color: hsl(90, 70%, 60%);
}

.sphere-item:nth-child(9) {
  --color: hsl(150, 70%, 60%);
}

.sphere-item:nth-child(10) {
  --color: hsl(210, 70%, 60%);
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

/* 调试面板样式 */
.debug-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600rpx;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20rpx;
  padding: 30rpx;
  z-index: 1000;
  overflow-y: auto;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  /* 彻底禁用所有模糊效果 */
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
  -webkit-filter: none !important;

}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.debug-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.debug-close {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.debug-section {
  margin-bottom: 30rpx;
}

.debug-label {
  display: block;
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 15rpx;
  font-weight: bold;
}

.debug-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 15rpx;
}

.debug-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  min-width: 120rpx;
}

.debug-slider {
  flex: 1;
}

.debug-btn {
  flex: 1;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  font-size: 24rpx;
  margin: 0 10rpx;
}

.debug-btn.active {
  background: #667eea;
  border-color: #667eea;
}

.debug-color-input {
  width: 60rpx;
  height: 40rpx;
  border: none;
  border-radius: 4rpx;
  background: transparent;
}

.debug-actions {
  display: flex;
  gap: 15rpx;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.debug-action-btn {
  flex: 1;
  height: 60rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.debug-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8rpx;
  padding: 15rpx;
  margin-top: 10rpx;
}

.debug-info .debug-text {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 5rpx;
}

/* 测试用户点样式 */
.test-item {
  z-index: 20;
  /* 确保在最上层 */
}

.test-item .item-dot {
  background: #ff0000 !important;
  box-shadow: 0 0 30rpx #ff0000, 0 0 60rpx #ff0000 !important;
  border: 4rpx solid rgba(255, 255, 255, 0.8) !important;
}

.test-item .item-info {
  background: rgba(255, 0, 0, 0.9) !important;
  border: 2rpx solid rgba(255, 255, 255, 0.8) !important;
}
</style>