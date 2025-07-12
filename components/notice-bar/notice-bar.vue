<template>
	<view class="custom-notice-bar" :style="{ backgroundColor: backgroundColor }">
		<view class="notice-content">
			<uni-icons 
				:type="getNoticeIcon(currentNotice?.type)" 
				size="16" 
				:color="getNoticeColor(currentNotice?.type)"
				class="notice-icon"
			/>
			<view class="notice-text-container">
				<text 
					class="notice-text" 
					:class="{ 'fade-out': isTransitioning }"
					:style="{ color: getNoticeColor(currentNotice?.type) }"
				>
					{{ currentNotice?.text || '' }}
				</text>
			</view>
			<text 
				class="notice-time" 
				:class="{ 'fade-out': isTransitioning }"
			>
				{{ formatRelativeTime(currentNotice?.timestamp) }}
			</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { getNoticeIcon, getNoticeColor } from '@/utils/notices'
import { formatRelativeTime } from '@/utils/tools'

const props = defineProps({
	notices: {
		type: Array,
		default: () => []
	},
	backgroundColor: {
		type: String,
		default: '#f8f9fa'
	},
	scrollSpeed: {
		type: Number,
		default: 60
	}
})

const emit = defineEmits(['click'])

const currentNoticeIndex = ref(0)
const switchTimer = ref(null)
const isTransitioning = ref(false)

const currentNotice = computed(() => {
	return props.notices[currentNoticeIndex.value] || null
})

// 切换到下一条消息
const switchToNextNotice = () => {
	if (isTransitioning.value) return
	
	isTransitioning.value = true
	
	// 先淡出当前消息
	setTimeout(() => {
		// 切换到下一条消息
		currentNoticeIndex.value = (currentNoticeIndex.value + 1) % props.notices.length
		
		// 重置过渡状态
		setTimeout(() => {
			isTransitioning.value = false
		}, 100)
	}, 300) // 等待淡出动画完成
}

// 开始定时切换
const startAutoSwitch = () => {
	if (props.notices.length <= 1) return
	
	// 每4秒切换一条消息
	switchTimer.value = setInterval(() => {
		switchToNextNotice()
	}, 4000)
}

// 监听消息变化
watch(() => props.notices, () => {
	if (props.notices.length > 0) {
		startAutoSwitch()
	}
}, { immediate: true })

// 点击事件
const handleClick = () => {
	emit('click', currentNotice.value)
}

onMounted(() => {
	if (props.notices.length > 0) {
		startAutoSwitch()
	}
})

onUnmounted(() => {
	if (switchTimer.value) {
		clearTimeout(switchTimer.value)
	}
})
</script>

<style scoped>
.custom-notice-bar {
	display: flex;
	align-items: center;
	padding: 12px 16px;
	border-radius: 8px;
	overflow: hidden;
	position: relative;
}

.notice-content {
	display: flex;
	align-items: center;
	width: 100%;
	gap: 8px;
}

.notice-icon {
	flex-shrink: 0;
}

.notice-text-container {
	flex: 1;
	overflow: hidden;
	position: relative;
	height: 20px; /* 固定高度，只显示一行 */
}

.notice-text {
	font-size: 14px;
	line-height: 20px;
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	width: 100%;
	transition: all 0.3s ease-in-out;
	transform: translateY(0);
	opacity: 1;
}

.notice-time {
	font-size: 12px;
	color: #999;
	white-space: nowrap;
	flex-shrink: 0;
	transition: all 0.3s ease-in-out;
	transform: translateY(0);
	opacity: 1;
}

.notice-text.fade-out,
.notice-time.fade-out {
	transform: translateY(-10px);
	opacity: 0;
}

/* 新消息从下方淡入的动画 */
.notice-text:not(.fade-out) {
	animation: slideInFromBottom 0.3s ease-in-out;
}

.notice-time:not(.fade-out) {
	animation: slideInFromBottom 0.3s ease-in-out;
}

@keyframes slideInFromBottom {
	from {
		transform: translateY(10px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}
</style> 