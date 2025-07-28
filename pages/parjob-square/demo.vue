<template>
  <view class="demo-container">
    <planet-sphere :items="demoItems" :center-avatar="centerAvatar" :auto-rotate="true" :rotation-speed="0.5"
      @item-click="onItemClick" @center-click="onCenterClick" />

    <!-- 控制面板 -->
    <view class="control-panel">
      <view class="control-item">
        <text class="control-label">自动旋转</text>
        <switch :checked="autoRotate" @change="toggleAutoRotate" color="#007aff" />
      </view>
      <view class="control-item">
        <text class="control-label">旋转速度</text>
        <slider :value="rotationSpeed * 100" @change="onSpeedChange" min="10" max="100" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import PlanetSphere from '@/components/3d-planet-sphere/3d-planet-sphere.vue'

const autoRotate = ref(true)
const rotationSpeed = ref(0.5)
const centerAvatar = ref('/static/default-avatar.png')

// 演示数据
const demoItems = ref([
  { id: 1, text: '前端开发', type: 'primary', weight: 0.8 },
  { id: 2, text: 'UI设计', type: 'success', weight: 0.6 },
  { id: 3, text: '产品经理', type: 'warning', weight: 0.7 },
  { id: 4, text: '数据分析', type: 'danger', weight: 0.5 },
  { id: 5, text: '摄影', type: 'primary', weight: 0.4 },
  { id: 6, text: '烹饪', type: 'success', weight: 0.3 },
  { id: 7, text: '健身', type: 'warning', weight: 0.6 },
  { id: 8, text: '音乐', type: 'danger', weight: 0.5 },
  { id: 9, text: '翻译', type: 'primary', weight: 0.4 },
  { id: 10, text: '写作', type: 'success', weight: 0.3 },
  { id: 11, text: '绘画', type: 'warning', weight: 0.5 },
  { id: 12, text: '编程', type: 'danger', weight: 0.8 },
  { id: 13, text: '设计', type: 'primary', weight: 0.7 },
  { id: 14, text: '营销', type: 'success', weight: 0.6 },
  { id: 15, text: '运营', type: 'warning', weight: 0.5 },
  { id: 16, text: '客服', type: 'danger', weight: 0.4 },
  { id: 17, text: '销售', type: 'primary', weight: 0.6 },
  { id: 18, text: '财务', type: 'success', weight: 0.5 },
  { id: 19, text: '法律', type: 'warning', weight: 0.7 },
  { id: 20, text: '医疗', type: 'danger', weight: 0.8 }
])

function onItemClick(item) {
  uni.showToast({
    title: `点击了: ${item.text}`,
    icon: 'none'
  })
}

function onCenterClick() {
  uni.showToast({
    title: '点击了中央头像',
    icon: 'none'
  })
}

function toggleAutoRotate(e) {
  autoRotate.value = e.detail.value
}

function onSpeedChange(e) {
  rotationSpeed.value = e.detail.value / 100
}
</script>

<style scoped>
.demo-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.control-panel {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12rpx;
  padding: 20rpx;
  z-index: 1000;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.control-item:last-child {
  margin-bottom: 0;
}

.control-label {
  font-size: 24rpx;
  color: #333;
  min-width: 120rpx;
}
</style>