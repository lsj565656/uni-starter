<template>
  <view class="planet-sphere-container" :style="sphereContainerStyle" @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
    <!-- 旋转球体 -->
    <view class="sphere" :class="{ 'paused': isPaused }" :style="sphereRotationStyle">
      <view v-for="(item, index) in items" :key="item._id" class="sphere-item" :style="getSphereItemStyle(index)">
        <view class="item-content">
          <!-- 实心点 -->
          <view class="item-dot" @click="handleItemDotClick(item, $event)"></view>

          <!-- 项目信息 -->
          <view class="item-info" @click="handleItemInfoClick(item, $event)">
            <text class="item-name">{{ item.nickname }}</text>
            <view class="item-gender" v-if="showGender">
              <uni-icons :type="getGenderIcon(item.gender)" size="16" :color="getGenderColor(item.gender)" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// Props定义
const props = defineProps({
  // 数据相关
  items: {
    type: Array,
    default: () => []
  },

  // 配置相关
  config: {
    type: Object,
    default: () => ({
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
  },

  // 显示配置
  showGender: {
    type: Boolean,
    default: true
  },

  // 屏幕信息
  screenInfo: {
    type: Object,
    default: () => ({
      width: 0,
      height: 0,
      pixelRatio: 1
    })
  },

  // 暂停状态
  isPaused: {
    type: Boolean,
    default: false
  }
})

// Emits定义
const emit = defineEmits([
  'itemClick',
  'itemInfoClick',
  'spherePause',
  'sphereResume'
])

// 响应式数据
const rotationTimer = ref(null)
const currentRotation = ref(0)
const isUserDetailOpen = ref(false)

// 旋转相关变量
const rotationSpeed = ref(props.config.baseSpeed)
const rotationDirection = ref(props.config.defaultDirection)

// 多方向公转相关变量
const currentRotationAngle = ref(0)
const targetRotationAngle = ref(0)
const rotationAxis = ref('Y')
const isCustomRotation = ref(false)

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
const moveThreshold = 8

// 智能暂停和恢复机制相关变量
const isPausedForViewing = ref(false)
const touchHoldDuration = ref(0)

// 缓存原始公转状态
const cachedRotationSpeed = ref(0)
const cachedRotationDirection = ref(1)
const cachedRotationAngle = ref(0)
const isRestoringFromCache = ref(false)

// 自动恢复相关
const autoResumeTimer = ref(null)
const autoResumeDelay = 3000

// 计算属性
const actualRadius = computed(() => {
  const screenWidth = props.screenInfo.width || 750
  const maxRadius = screenWidth * props.config.maxRadiusPercent / 100
  const desiredRadius = screenWidth * props.config.radiusPercent / 100
  return Math.min(desiredRadius, maxRadius)
})

// 球体旋转样式
const sphereRotationStyle = computed(() => {
  // 1-3个用户时球体不公转，保持固定
  if (props.items.length < 4) {
    return {
      transform: 'translate(-50%, -50%)'
    }
  }

  // 4个以上用户时正常公转
  if (props.config.enableMultiDirection && isCustomRotation.value) {
    const rotationRad = currentRotationAngle.value * Math.PI / 180
    const perpendicularAngle = rotationRad + Math.PI / 2
    const axisX = Math.cos(perpendicularAngle)
    const axisY = Math.sin(perpendicularAngle)
    const axisZ = 0
    const rotationAngle = currentRotation.value * rotationDirection.value

    return {
      transform: `translate(-50%, -50%) rotate3d(${axisX}, ${axisY}, ${axisZ}, ${rotationAngle}deg)`
    }
  } else {
    const axis = rotationAxis.value.toLowerCase()
    if (axis === 'z') {
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

// 球体容器样式
const sphereContainerStyle = computed(() => {
  const screenWidth = props.screenInfo.width || 750
  const sphereSize = Math.min(
    screenWidth * props.config.sphereSizePercent / 100,
    screenWidth * 2
  )

  const style = {
    width: `${sphereSize}rpx !important`,
    height: `${sphereSize}rpx !important`,
    overflow: 'visible !important',
    position: 'absolute !important',
    borderRadius: '50% !important',
    filter: 'none !important',
    backdropFilter: 'none !important',
    webkitBackdropFilter: 'none !important'
  }

  if (props.config.showSphereBackground) {
    style.background = `radial-gradient(${props.config.sphereBackgroundColor} 20%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.05) 100%) !important`
    style.border = `${props.config.sphereBorderWidth}rpx solid ${props.config.sphereBorderColor} !important`
  } else {
    style.background = 'transparent !important'
    style.border = 'none !important'
  }

  if (props.config.centerX === 50 && props.config.centerY === 50) {
    style.top = '50% !important'
    style.left = '50% !important'
    style.transform = 'translate(-50%, -50%) !important'
  } else {
    style.top = `${props.config.centerY}% !important`
    style.left = `${props.config.centerX}% !important`
    style.transform = 'translate(-50%, -50%) !important'
  }

  return style
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

// 优化的3D位置计算
function getSphereItemStyle(index) {
  const count = props.items.length
  const radius = actualRadius.value

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

  // 用户分布逻辑
  let phi, theta

  if (count < 4) {
    // 1-3个用户时，使用固定位置，完全脱离公转和自转
    if (count === 1) {
      phi = Math.PI / 2 // 赤道位置，完全正面
      theta = 0 // 正前方
    } else if (count === 2) {
      // 2个用户时，分别放在球体的正面和侧面
      phi = Math.PI / 2
      theta = index * Math.PI / 2 // 90度间隔，一个正面一个侧面
    } else {
      // 3个用户时，使用三角形分布
      phi = Math.PI / 2
      theta = index * (2 * Math.PI / 3) // 120度间隔
    }
  } else {
    // 4个以上用户使用黄金螺旋分布，正常转动
    const goldenRatio = (1 + Math.sqrt(5)) / 2
    const goldenAngle = 2 * Math.PI / goldenRatio

    const minLat = 0.1
    const maxLat = Math.PI - 0.1
    const latRange = maxLat - minLat

    phi = minLat + (latRange * (index + 0.5)) / count
    theta = goldenAngle * index + (index * 0.1)

    const randomOffsetX = Math.sin(index * 1.5) * 0.05
    const randomOffsetY = Math.cos(index * 2.3) * 0.05
    phi += randomOffsetX
    theta += randomOffsetY
  }

  const x = Math.cos(theta) * Math.sin(phi)
  const y = Math.sin(theta) * Math.sin(phi)
  const z = Math.cos(phi)

  const scaledX = x * radius
  const scaledY = y * radius
  const scaledZ = z * radius

  const colors = [
    'hsl(220, 85%, 65%)', 'hsl(120, 75%, 60%)', 'hsl(350, 80%, 65%)', 'hsl(280, 75%, 65%)',
    'hsl(40, 85%, 65%)', 'hsl(180, 75%, 60%)', 'hsl(320, 80%, 65%)', 'hsl(90, 75%, 60%)',
    'hsl(260, 75%, 65%)', 'hsl(15, 85%, 65%)', 'hsl(150, 75%, 60%)', 'hsl(300, 80%, 65%)',
    'hsl(200, 75%, 65%)', 'hsl(60, 85%, 65%)', 'hsl(340, 75%, 60%)', 'hsl(240, 80%, 65%)',
    'hsl(100, 75%, 65%)', 'hsl(20, 85%, 65%)', 'hsl(270, 75%, 60%)', 'hsl(140, 80%, 65%)'
  ]

  const colorIndex = index % colors.length
  const dynamicColor = index >= colors.length
    ? `hsl(${(index * 18) % 360}, 75%, 60%)`
    : colors[colorIndex]

  const screenWidth = props.screenInfo.width || 750
  const sphereSize = Math.min(screenWidth * props.config.sphereSizePercent / 100, screenWidth * 2)

  const rotationRadForBounds = (currentRotation.value * Math.PI) / 180
  const rotatedXForBounds = scaledX * Math.cos(rotationRadForBounds) - scaledZ * Math.sin(rotationRadForBounds)

  // 1-3个用户时始终可见，4个以上用户遵循边界隐藏逻辑
  const isOutOfBounds = count >= 4 && (Math.abs(rotatedXForBounds) > sphereSize / 2 || Math.abs(scaledY) > sphereSize / 2)

  return {
    '--index': index,
    '--num-elements': count,
    '--radius': radius,
    '--phi': phi,
    '--theta': theta,
    '--x': x,
    '--y': y,
    '--z': z,
    '--scaled-x': scaledX,
    '--scaled-y': scaledY,
    '--scaled-z': scaledZ,
    '--color': dynamicColor,

    transform: (() => {
      let transform = `translate3d(${scaledX}rpx, ${scaledY}rpx, ${scaledZ}rpx)`

      // 1-3个用户时完全固定，不进行任何旋转
      if (count < 4) {
        // 1-3个用户时，用户点完全固定，脱离公转和自转
        // 保证正向面对用户，不进行任何旋转抵消
        transform += '' // 不添加任何旋转
      } else {
        // 3个以上用户使用正常的自转抵消逻辑
        if (props.config.enableMultiDirection && isCustomRotation.value) {
          const rotationRad = currentRotationAngle.value * Math.PI / 180
          const perpendicularAngle = rotationRad + Math.PI / 2
          const axisX = Math.cos(perpendicularAngle)
          const axisY = Math.sin(perpendicularAngle)
          const axisZ = 0
          const selfRotation = -currentRotation.value * rotationDirection.value
          transform += ` rotate3d(${axisX}, ${axisY}, ${axisZ}, ${selfRotation}deg)`
        } else {
          const selfRotation = -currentRotation.value
          transform += ` rotateY(${selfRotation}deg)`
        }
      }

      return `${transform} !important`
    })(),
    position: 'absolute !important',
    left: '50% !important',
    top: '50% !important',
    transformOrigin: 'center center !important',
    opacity: isOutOfBounds ? '0' : '1',
    pointerEvents: isOutOfBounds ? 'none' : 'auto'
  }
}

// 启动旋转动画
function startRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
  }

  rotationTimer.value = setInterval(() => {
    try {
      if (!isSliding.value && !isDragging.value && !props.isPaused && !isPausedForViewing.value && !isUserDetailOpen.value) {
        // 确保旋转速度不为0
        if (rotationSpeed.value === 0) {
          rotationSpeed.value = props.config.baseSpeed
        }

        // 1-2个用户时不更新公转角度，保持固定
        if (props.items.length >= 3) {
          // 3个以上用户时正常公转
          currentRotation.value += rotationSpeed.value * rotationDirection.value
        }
        // 1-2个用户时保持当前角度不变，实现固定效果

        if (!props.config.enableMultiDirection) {
          if (currentRotation.value >= 360) {
            currentRotation.value = 0
          } else if (currentRotation.value < 0) {
            currentRotation.value = 360
          }
        }

        if (props.config.enableMultiDirection && isCustomRotation.value) {
          const angleDiff = targetRotationAngle.value - currentRotationAngle.value
          if (Math.abs(angleDiff) > 1) {
            currentRotationAngle.value += angleDiff * 0.1
          }
        }
      }
    } catch (error) {
      console.error('❌ 旋转动画出错:', error)
      isPausedForViewing.value = false
      isSliding.value = false
      isDragging.value = false
      isUserDetailOpen.value = false
    }
  }, 16)
}

// 停止旋转
function stopRotation() {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}

// 手势控制
function onTouchStart(event) {
  event.stopPropagation()
  const touch = event.touches[0]

  const screenWidth = props.screenInfo.width || 750
  const sphereSize = Math.min(screenWidth * props.config.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (props.screenInfo.height || 1334) / 2

  const touchDistance = Math.hypot(touch.clientX - centerX, touch.clientY - centerY)
  const maxDistance = sphereSize / 2

  if (touchDistance > maxDistance) {
    return
  }

  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
  touchStartTime.value = Date.now()
  isSliding.value = false

  isDragging.value = false
  dragStartTime.value = Date.now()
  dragVelocity.value = 0
  dragDirection.value = 1
  dragAngle.value = 0

  touchHoldDuration.value = 0
  isPausedForViewing.value = true

  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }

  if (props.isPaused) {
    checkItemClick(touch.clientX, touch.clientY).then(clickedItem => {
      if (clickedItem) {
        cachedRotationSpeed.value = rotationSpeed.value
        cachedRotationDirection.value = rotationDirection.value
        cachedRotationAngle.value = currentRotation.value
        emit('itemClick', clickedItem)
        isRestoringFromCache.value = true
        startAutoResumeTimer()
      } else {
        resumeFromCache()
      }
    }).catch(error => {
      console.error('❌ 检查项目点击失败:', error)
      resumeFromCache()
    })
    return
  }

  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }

  setTimeout(() => {
    if (isSliding.value) {
      return
    }
  }, 100)
}

function onTouchMove(event) {
  event.stopPropagation()

  const touch = event.touches[0]
  const currentX = touch.clientX
  const currentY = touch.clientY

  const screenWidth = props.screenInfo.width || 750
  const sphereSize = Math.min(screenWidth * props.config.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (props.screenInfo.height || 1334) / 2

  const touchDistance = Math.hypot(currentX - centerX, currentY - centerY)
  const maxDistance = sphereSize / 2

  if (touchDistance > maxDistance) {
    return
  }

  const deltaX = currentX - lastTouchX.value
  const deltaY = currentY - lastTouchY.value
  const deltaTime = Date.now() - touchStartTime.value

  touchHoldDuration.value = deltaTime

  const totalDelta = Math.hypot(deltaX, deltaY)

  if (totalDelta > moveThreshold) {
    isDragging.value = true
    isSliding.value = false

    if (isPausedForViewing.value) {
      isPausedForViewing.value = false
    }

    const slideAngle = Math.atan2(deltaY, deltaX)
    const angleDegrees = slideAngle * 180 / Math.PI

    let rotationDir = 1
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      rotationDir = deltaX > 0 ? 1 : -1
    } else {
      rotationDir = deltaY > 0 ? 1 : -1
    }

    dragAngle.value = angleDegrees
    dragDirection.value = rotationDir

    isCustomRotation.value = true
    currentRotationAngle.value = angleDegrees
    targetRotationAngle.value = angleDegrees

    rotationDirection.value = rotationDir

    const rotationIncrement = Math.min(totalDelta / 1000, 2)
    currentRotation.value += rotationIncrement * rotationDirection.value
  }

  lastTouchX.value = currentX
  lastTouchY.value = currentY
}

function onTouchEnd(event) {
  event.stopPropagation()

  const screenWidth = props.screenInfo.width || 750
  const sphereSize = Math.min(screenWidth * props.config.sphereSizePercent / 100, screenWidth * 2)
  const centerX = screenWidth / 2
  const centerY = (props.screenInfo.height || 1334) / 2

  const touchDistance = Math.hypot(lastTouchX.value - centerX, lastTouchY.value - centerY)
  const maxDistance = sphereSize / 2

  if (touchDistance > maxDistance) {
    return
  }

  if (isDragging.value) {
    isSliding.value = true
    isDragging.value = false

    rotationSpeed.value = props.config.maxSpeed
    rotationDirection.value = dragDirection.value
    currentRotationAngle.value = dragAngle.value
    targetRotationAngle.value = dragAngle.value

    cachedRotationSpeed.value = rotationSpeed.value
    cachedRotationDirection.value = rotationDirection.value
    cachedRotationAngle.value = currentRotation.value
    isRestoringFromCache.value = false

    startVelocityDecay()

  } else {
    checkItemClick(lastTouchX.value, lastTouchY.value).then(clickedItem => {
      if (clickedItem) {
        cachedRotationSpeed.value = rotationSpeed.value
        cachedRotationDirection.value = rotationDirection.value
        cachedRotationAngle.value = currentRotation.value

        emit('itemClick', clickedItem)
        isPausedForViewing.value = true
        isRestoringFromCache.value = true

        startAutoResumeTimer()

      } else {
        isPausedForViewing.value = false
        resumeFromCache()
      }
    }).catch(error => {
      console.error('❌ 检查项目点击失败:', error)
      resumeFromCache()
    })
  }

  isSliding.value = false
  isPausedForViewing.value = false
}

// 速度衰减机制
function startVelocityDecay() {
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
  }

  velocityDecayTimer.value = setInterval(() => {
    if (rotationSpeed.value > props.config.baseSpeed) {
      const decayRate = 0.95
      rotationSpeed.value = Math.max(
        rotationSpeed.value * decayRate,
        props.config.baseSpeed
      )
    } else {
      clearInterval(velocityDecayTimer.value)
      velocityDecayTimer.value = null

      isSliding.value = false
      isDragging.value = false
      isPausedForViewing.value = false

      // 所有用户数量都确保旋转速度不为0
      if (rotationSpeed.value === 0) {
        rotationSpeed.value = props.config.baseSpeed
      }
    }
  }, 100)
}

// 检查点击是否在项目点上
function checkItemClick(x, y) {
  try {
    return new Promise((resolve) => {
      const query = uni.createSelectorQuery()
      query.select('.planet-sphere-container').boundingClientRect((containerRect) => {
        if (!containerRect) {
          resolve(null)
          return
        }

        const centerX = containerRect.left + containerRect.width / 2
        const centerY = containerRect.top + containerRect.height / 2

        const offsetX = x - centerX
        const offsetY = y - centerY

        const distance = Math.hypot(offsetX, offsetY)
        const sphereRadius = actualRadius.value
        if (distance <= sphereRadius) {
          let closestItem = null
          let minDistance = Number.POSITIVE_INFINITY

          props.items.forEach((item, index) => {
            const itemStyle = getSphereItemStyle(index)
            const transform = itemStyle.transform
            const match = transform.match(/translate3d\(([^,]+),([^,]+),([^)]+)\)/)

            if (match) {
              const pixelRatio = props.screenInfo.pixelRatio || 1
              const itemX = Number.parseFloat(match[1]) / pixelRatio
              const itemY = Number.parseFloat(match[2]) / pixelRatio
              const itemZ = Number.parseFloat(match[3]) / pixelRatio

              const rotationRad = (currentRotation.value * Math.PI) / 180
              const rotatedX = itemX * Math.cos(rotationRad) - itemZ * Math.sin(rotationRad)
              const rotatedZ = itemX * Math.sin(rotationRad) + itemZ * Math.cos(rotationRad)

              const itemDistance = Math.hypot(offsetX - rotatedX, offsetY - itemY)

              const baseClickRadius = 10
              const depthFactor = Math.max(0.4, Math.min(1.2, 1 - Math.abs(rotatedZ) / sphereRadius))
              const clickRadius = baseClickRadius * depthFactor

              if (itemDistance <= clickRadius && itemDistance < minDistance) {
                minDistance = itemDistance
                closestItem = item
              }
            }
          })

          resolve(closestItem)
        } else {
          resolve(null)
        }
      }).exec()
    })
  } catch (error) {
    console.error('❌ 检查项目点击时出错:', error)
    return Promise.resolve(null)
  }
}

// 处理项目点点击
function handleItemDotClick(item) {
  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  isPausedForViewing.value = true
  isRestoringFromCache.value = true

  emit('itemClick', item)

  startAutoResumeTimer()
}

// 处理项目信息点击
function handleItemInfoClick(item) {
  cachedRotationSpeed.value = rotationSpeed.value
  cachedRotationDirection.value = rotationDirection.value
  cachedRotationAngle.value = currentRotation.value

  isPausedForViewing.value = true
  isRestoringFromCache.value = true

  emit('itemInfoClick', item)

  startAutoResumeTimer()
}

// 从缓存恢复公转状态
function resumeFromCache() {
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }

  if (!isUserDetailOpen.value) {
    isPausedForViewing.value = false

    rotationSpeed.value = props.config.maxSpeed
    rotationDirection.value = cachedRotationDirection.value
    currentRotation.value = cachedRotationAngle.value

    isRestoringFromCache.value = false

    startVelocityDecay()
  }
}

// 启动自动恢复定时器
function startAutoResumeTimer() {
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
  }

  autoResumeTimer.value = setTimeout(() => {
    if (!isUserDetailOpen.value) {
      resumeFromCache()
    }
  }, autoResumeDelay)
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    startRotation()

    cachedRotationSpeed.value = rotationSpeed.value
    cachedRotationDirection.value = rotationDirection.value
    cachedRotationAngle.value = currentRotation.value
  })
})

onUnmounted(() => {
  stopRotation()
  if (velocityDecayTimer.value) {
    clearInterval(velocityDecayTimer.value)
    velocityDecayTimer.value = null
  }
  if (dragDecayTimer.value) {
    clearInterval(dragDecayTimer.value)
    dragDecayTimer.value = null
  }
  if (autoResumeTimer.value) {
    clearTimeout(autoResumeTimer.value)
    autoResumeTimer.value = null
  }
})

// 暴露方法给父组件
defineExpose({
  startRotation,
  stopRotation,
  pause: () => {
    // 暂停由父组件控制
    emit('spherePause')
  },
  resume: () => {
    // 恢复由父组件控制
    emit('sphereResume')
  }
})
</script>

<style scoped>
.planet-sphere-container {
  perspective: none;
  transform-style: preserve-3d;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.sphere {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  z-index: 2;
  overflow: visible !important;
}

.sphere.paused {
  animation-play-state: paused;
}

.sphere-item {
  position: absolute;
  width: 30rpx;
  height: 30rpx;
  left: 50%;
  top: 50%;
  transform-style: preserve-3d;
  transform-origin: center center;
  z-index: 10;
}

.sphere-item>div {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  transition: opacity 0.3s;
  transform: none;
}

.item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transform-style: preserve-3d;
  transform: none;
  position: relative;
}

.item-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color);
  box-shadow: 0 0 20rpx var(--color), 0 0 40rpx var(--color);
  transition: all 0.3s ease;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
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
  padding: 2rpx 3rpx;
  border-radius: 8rpx;
  min-width: 50rpx;
  transform: none;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  z-index: 15;
  pointer-events: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4rpx;
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

.sphere-item {
  --color: var(--color, hsl(220, 85%, 65%));
}
</style>