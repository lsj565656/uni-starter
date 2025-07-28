<template>
  <view class="evaluated-card" :class="{ 'evaluated-card--active': isActive }" @click="handleClick"
    @touchstart="handleTouchStart" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
    <view class="evaluated-card__image-wrapper" :style="{ transform: `scale(${imageScale})` }">
      <image class="evaluated-card__image" :src="coverImage" mode="aspectFill" lazy-load></image>
      <view class="evaluated-card__cover-content">
        <text class="evaluated-card__title-on-image">{{ evaluated.title }}</text>
      </view>
      <view class="evaluated-card__overlay" v-if="isActive">
        <uni-icons type="eye" size="20" color="#fff"></uni-icons>
      </view>
    </view>
    <view class="evaluated-card__content">
      <view class="evaluated-card__header">
        <text class="evaluated-card__category" v-if="evaluated.category">{{
          evaluated.category
        }}</text>
      </view>
      <text class="evaluated-card__description">{{ evaluated.description }}</text>
      <view class="evaluated-card__tag" v-if="evaluated.tags && evaluated.tags.length > 0">
        <uni-badge v-for="(tag, idx) in displayTags" :key="tag" :text="tag" type="primary" size="small"
          :inverted="true" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const properties = defineProps({
  evaluated: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])
const imageScale = ref(1)
const isActive = computed(() => properties.active)

const handleClick = () => {
  emit('click', properties.evaluated)
}
const handleTouchStart = () => {
  imageScale.value = 0.95
}
const handleTouchEnd = () => {
  imageScale.value = 1
}

// 封面图片优先取评论图片
const coverImage = computed(() => {
  const comments = properties.evaluated.comments || []
  for (const c of comments) {
    if (c.images && c.images.length > 0) return c.images[0]
  }
  // 如无评论图片可用发布人头像或默认图
  return properties.evaluated.publisher?.avatar || '/static/logo.png'
})

// 标签展示逻辑
const displayTags = computed(() => (properties.evaluated.tags || []).slice(0, 3))
const tagsOverflow = computed(() => {
  const length_ = (properties.evaluated.tags || []).length
  return length_ > 3 ? length_ - 3 : 0
})
</script>

<style lang="scss" scoped>
.evaluated-card {
  width: 320rpx;
  min-width: 320rpx;
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
  flex-shrink: 0;

  &:active {
    transform: none;
  }

  &--active {
    box-shadow: var(--shadow-lg);
    border: 2px solid var(--primary-color);
  }

  &__image-wrapper {
    position: relative;
    width: 100%;
    height: 180rpx;
    overflow: hidden;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  &__image {
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
    transition: none;
    border-radius: 0;
  }

  &__cover-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.48);
    padding: 12rpx 18rpx 10rpx 18rpx;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    min-height: 40rpx;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  &__title-on-image {
    color: #fff;
    font-size: 28rpx;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    line-height: 1.3;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(44, 62, 80, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }

  &__content {
    padding: 18rpx 16rpx 14rpx 16rpx;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 4rpx;
  }

  &__category {
    font-size: 20rpx;
    color: #1976d2;
    background: #e3f2fd;
    border-radius: 6rpx;
    padding: 2rpx 8rpx;
    margin-right: 6rpx;
    font-weight: 600;
  }

  &__description {
    display: block;
    font-size: 24rpx;
    color: var(--text-secondary);
    margin-bottom: 12rpx;
    white-space: normal;
    line-height: 1.4;
  }

  @supports (-webkit-line-clamp: 2) {
    &__description {
      -webkit-line-clamp: 2;
      line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 10rpx;
    width: fit-content;
    margin-top: 4rpx;
  }
}
</style>
