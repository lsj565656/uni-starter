<template>
  <view class="planet-sphere-container">
    <!-- 星空背景 -->
    <view class="stars-bg">
      <view v-for="i in 50" :key="i" class="star" :style="getStarStyle(i)"></view>
    </view>

    <!-- 3D球体 -->
    <view class="planet-sphere" :style="sphereStyle" @touchstart="onTouchStart" @touchmove="onTouchMove"
      @touchend="onTouchEnd">
      <!-- 球体表面的标签 -->
      <view v-for="(item, index) in items" :key="index" class="sphere-item" :class="getItemClass(item)"
        :style="getItemStyle(item, index)" @click="onItemClick(item)">
        <text class="item-text">{{ item.text }}</text>
        <view class="item-glow"></view>
      </view>
    </view>

    <!-- 中央的"我" -->
    <view class="center-me" @click="onCenterClick">
      <view class="me-avatar">
        <image :src="centerAvatar" mode="aspectFill" />
        <view class="me-status">我</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  centerAvatar: {
    type: String,
    default: '/static/default-avatar.png'
  },
  autoRotate: {
    type: Boolean,
    default: true
  },
  rotationSpeed: {
    type: Number,
    default: 0.5
  }
})

// Emits
const emit = defineEmits(['itemClick', 'centerClick'])

// 响应式数据
const rotationX = ref(0)
const rotationY = ref(0)
const isDragging = ref(false)
const lastTouchX = ref(0)
const lastTouchY = ref(0)
const autoRotateTimer = ref(null)

// 计算属性
const sphereStyle = computed(() => ({
  transform: `rotateX(${rotationX.value}deg) rotateY(${rotationY.value}deg)`
}))

// 生成星星样式
function getStarStyle(index) {
  const size = Math.random() * 3 + 1
  const x = Math.random() * 100
  const y = Math.random() * 100
  const delay = Math.random() * 3

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`
  }
}

// 获取球体表面元素样式
function getItemStyle(item, index) {
  // 计算球体表面的位置
  const radius = 200 // 球体半径
  const totalItems = props.items.length

  // 使用黄金螺旋算法分布点
  const phi = Math.acos(-1 + (2 * index) / totalItems)
  const theta = Math.sqrt(totalItems * Math.PI) * phi

  // 转换为3D坐标
  const x = radius * Math.cos(theta) * Math.sin(phi)
  const y = radius * Math.sin(theta) * Math.sin(phi)
  const z = radius * Math.cos(phi)

  // 根据item的权重调整大小
  const scale = item.weight ? 0.8 + item.weight * 0.4 : 1

  return {
    transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`
  }
}

// 获取元素样式类
function getItemClass(item) {
  const classes = ['sphere-item']

  // 根据类型添加颜色类
  if (item.type) {
    classes.push(`item-${item.type}`)
  }

  // 根据权重添加大小类
  if (item.weight) {
    if (item.weight > 0.7) classes.push('item-large')
    else if (item.weight > 0.4) classes.push('item-medium')
    else classes.push('item-small')
  }

  return classes.join(' ')
}

// 触摸事件处理
function onTouchStart(e) {
  isDragging.value = true
  const touch = e.touches[0]
  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY

  // 停止自动旋转
  if (props.autoRotate) {
    stopAutoRotate()
  }
}

function onTouchMove(e) {
  if (!isDragging.value) return

  e.preventDefault()
  const touch = e.touches[0]
  const deltaX = touch.clientX - lastTouchX.value
  const deltaY = touch.clientY - lastTouchY.value

  // 更新旋转角度
  rotationY.value += deltaX * 0.5
  rotationX.value -= deltaY * 0.5

  // 限制垂直旋转范围
  rotationX.value = Math.max(-60, Math.min(60, rotationX.value))

  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
}

function onTouchEnd() {
  isDragging.value = false

  // 恢复自动旋转
  if (props.autoRotate) {
    startAutoRotate()
  }
}

// 自动旋转
function startAutoRotate() {
  if (autoRotateTimer.value) return

  autoRotateTimer.value = setInterval(() => {
    if (!isDragging.value) {
      rotationY.value += props.rotationSpeed
    }
  }, 16) // 60fps
}

function stopAutoRotate() {
  if (autoRotateTimer.value) {
    clearInterval(autoRotateTimer.value)
    autoRotateTimer.value = null
  }
}

// 点击事件
function onItemClick(item) {
  emit('itemClick', item)
}

function onCenterClick() {
  emit('centerClick')
}

// 生命周期
onMounted(() => {
  if (props.autoRotate) {
    startAutoRotate()
  }
})

onUnmounted(() => {
  stopAutoRotate()
})
</script>

<style scoped>
.planet-sphere-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
}

/* 星空背景 */
.stars-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s infinite ease-in-out;
}

@keyframes twinkle {

  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 3D球体 */
.planet-sphere {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  transform-style: preserve-3d;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease-out;
  z-index: 2;
}

/* 球体表面元素 */
.sphere-item {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sphere-item:hover {
  transform: scale(1.1) !important;
  z-index: 10;
}

.item-text {
  display: block;
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  color: #fff;
  font-size: 24rpx;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

.item-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.sphere-item:hover .item-glow {
  opacity: 1;
}

/* 元素类型样式 */
.item-primary .item-text {
  background: rgba(0, 122, 255, 0.2);
  border-color: rgba(0, 122, 255, 0.4);
}

.item-success .item-text {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.4);
}

.item-warning .item-text {
  background: rgba(255, 149, 0, 0.2);
  border-color: rgba(255, 149, 0, 0.4);
}

.item-danger .item-text {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.4);
}

/* 元素大小样式 */
.item-small .item-text {
  font-size: 20rpx;
  padding: 6rpx 12rpx;
}

.item-medium .item-text {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
}

.item-large .item-text {
  font-size: 28rpx;
  padding: 10rpx 20rpx;
  font-weight: bold;
}

/* 中央的"我" */
.center-me {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.me-avatar {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 30rpx rgba(255, 255, 255, 0.3);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.me-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 0 40rpx rgba(255, 255, 255, 0.5);
}

.me-avatar image {
  width: 100%;
  height: 100%;
}

.me-status {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(45deg, #007aff, #5856d6);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .planet-sphere {
    width: 300px;
    height: 300px;
  }

  .item-text {
    font-size: 20rpx;
    padding: 6rpx 12rpx;
  }

  .me-avatar {
    width: 100rpx;
    height: 100rpx;
  }
}
</style>