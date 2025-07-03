<template>
	<view 
		class="ingredient-card"
		:class="{ 'ingredient-card--active': isActive }"
		@click="handleClick"
		@touchstart="handleTouchStart"
		@touchend="handleTouchEnd"
		@touchcancel="handleTouchEnd"
	>
		<view class="ingredient-card__image-wrapper">
			<image 
				class="ingredient-card__image" 
				:src="ingredient.image" 
				mode="aspectFill"
				lazy-load
				:style="{ transform: `scale(${imageScale})` }"
			></image>
			<view class="ingredient-card__overlay" v-if="isActive">
				<uni-icons type="eye" size="20" color="#fff"></uni-icons>
			</view>
		</view>
		<view class="ingredient-card__content">
			<text class="ingredient-card__name">{{ ingredient.name }}</text>
			<text class="ingredient-card__description">{{ ingredient.description }}</text>
			<view class="ingredient-card__tag">
				<uni-badge 
					text="新鲜"
					type="success"
					size="small"
					:inverted="true"
				></uni-badge>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

// 定义props
const props = defineProps({
	ingredient: {
		type: Object,
		required: true
	},
	active: {
		type: Boolean,
		default: false
	}
})

// 定义emits
const emit = defineEmits(['click'])

// 响应式数据
const imageScale = ref(1)

// 计算属性
const isActive = computed(() => props.active)

// 方法
const handleClick = () => {
	emit('click', props.ingredient)
}

const handleTouchStart = () => {
	imageScale.value = 0.95
}

const handleTouchEnd = () => {
	imageScale.value = 1
}
</script>

<style lang="scss" scoped>
.ingredient-card {
	width: 200rpx;
	min-width: 200rpx;
	background-color: var(--bg-primary);
	border-radius: var(--radius-lg);
	overflow: hidden;
	box-shadow: var(--shadow-sm);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, box-shadow;
	flex-shrink: 0;
	
	&:active {
		transform: scale(0.95);
		box-shadow: var(--shadow-md);
	}
	
	&--active {
		box-shadow: var(--shadow-lg);
		border: 2px solid var(--primary-color);
	}
	
	&__image-wrapper {
		position: relative;
		width: 100%;
		height: 120rpx;
		overflow: hidden;
	}
	
	&__image {
		width: 100%;
		height: 100%;
		background-color: var(--bg-secondary);
		transition: transform 0.3s ease;
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
		padding: 16rpx;
	}
	
	&__name {
		display: block;
		font-size: 28rpx;
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
		margin-bottom: 8rpx;
		white-space: normal;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	&__description {
		display: block;
		font-size: 24rpx;
		color: var(--text-secondary);
		margin-bottom: 12rpx;
		white-space: normal;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	
	&__tag {
		display: flex;
		align-items: center;
		gap: 8rpx;
		width: fit-content;
	}
}
</style> 