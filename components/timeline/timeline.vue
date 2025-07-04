<template>
	<view class="timeline">
		<!-- 模式切换按钮 -->
		<view class="timeline-mode-switch">
			<uni-icons
				type="icon-align-text-center"
				:color="displayMode === 'tree' ? '#007aff' : '#bbb'"
				size="22"
				@click="switchMode('tree')"
				class="mode-icon"
			/>
			<uni-icons
				type="icon-align-text-left"
				:color="displayMode === 'vertical' ? '#007aff' : '#bbb'"
				size="22"
				@click="switchMode('vertical')"
				class="mode-icon"
			/>
		</view>
		
		<!-- 时间线内容 -->
		<view 
			class="timeline-container"
			:class="{ 'timeline-container--zigzag': displayMode === 'tree' }"
		>
			<view 
				v-for="(step, index) in steps" 
				:key="index"
				class="timeline-item"
				:class="{ 
					'timeline-item--completed': getStepStatus(index) === 'completed',
					'timeline-item--in-progress': getStepStatus(index) === 'in-progress',
					'timeline-item--pending': getStepStatus(index) === 'pending',
					'timeline-item--zigzag': displayMode === 'tree',
					'timeline-item--zigzag-left': displayMode === 'tree' && (index + 1) % 2 === 1,
					'timeline-item--zigzag-right': displayMode === 'tree' && (index + 1) % 2 === 0
				}"
			>
				<!-- 节点（在轴线上） -->
				<view 
					class="timeline-item__dot"
					:class="{
						'timeline-item__dot--completed': getStepStatus(index) === 'completed',
						'timeline-item__dot--in-progress': getStepStatus(index) === 'in-progress',
						'timeline-item__dot--pending': getStepStatus(index) === 'pending'
					}"
				>
					<uni-icons 
						custom-prefix="iconfont"
						:type="step.icon" 
						size="14" 
						:color="getIconColor(index)"
					></uni-icons>
				</view>
				
				<!-- 只在树形模式且不是最后一个节点时渲染主线段 -->
				<view
					v-if="displayMode === 'tree' && index < steps.length - 1"
					class="timeline-item__mainline"
					:style="getZigzagMainlineStyle(index)"
				></view>
				
				<!-- 轴线内容（图标、标题、时间） -->
				<view 
					class="timeline-item__axis-content" 
					v-if="displayMode === 'tree'"
				>
					<text class="timeline-item__title">{{ step.name }}</text>
					<text class="timeline-item__time">{{ step.time }}</text>
				</view>
				
				<!-- 树形模式：图片左右交错 -->
				<view v-if="displayMode === 'tree' && processData && processData[index]">
					<view
						:class="['timeline-item__image-stack', (index + 1) % 2 === 1 ? 'timeline-item__image-stack--left' : 'timeline-item__image-stack--right']"
					>
						<view
							v-for="(img, imgIdx) in getStepImages(index)"
							:key="imgIdx"
							class="stacked-image"
							:class="{ 'stacked-image--active': imgIdx === (currentImageIndexes[index] || 0) }"
							:style="getStackedImageStyle(imgIdx, currentImageIndexes[index] || 0, (index + 1) % 2 === 1 ? 'left' : 'right')"
						>
							<image
								:src="img"
								@click="handlePreviewImage(index)"
								class="stacked-image-content"
								mode="aspectFill"
							/>
							<view
								v-if="imgIdx === (currentImageIndexes[index] || 0) && getStepImages(index).length > 1"
								class="image-index-indicator"
								@click.stop="handleImageIndexClick(index)"
							>
								{{ (currentImageIndexes[index] || 0) + 1 }}/{{ getStepImages(index).length }}
							</view>
						</view>
						<template v-if="getStepImages(index).length === 0">
							<image
								:src="getCurrentImage(index)"
								@click="handlePreviewImage(index)"
								class="timeline-image timeline-image--fix"
								mode="aspectFill"
							/>
						</template>
					</view>
				</view>
				
				<!-- 垂直模式：内容在节点右侧，图片在下方 -->
				<view 
					class="timeline-item__content timeline-item__content--vertical" 
					v-if="displayMode === 'vertical'"
				>
					<text class="timeline-item__title">{{ step.name }}</text>
					<text class="timeline-item__time">{{ step.time }}</text>
					<view v-if="processData && processData[index]">
						<view class="timeline-image-wrapper" style="position: relative; width: 120px; height: 80px;">
							<view
								v-for="(img, imgIdx) in getStepImages(index)"
								:key="imgIdx"
								class="stacked-image"
								:class="{ 'stacked-image--active': imgIdx === (currentImageIndexes[index] || 0) }"
								:style="getVerticalStackedImageStyle(imgIdx, currentImageIndexes[index] || 0)"
							>
								<image
									:src="img"
									@click="handlePreviewImage(index)"
									class="stacked-image-content"
									mode="aspectFill"
								/>
								<view
									v-if="imgIdx === (currentImageIndexes[index] || 0) && getStepImages(index).length > 1"
									class="image-index-indicator"
									@click.stop="handleImageIndexClick(index)"
								>
									{{ (currentImageIndexes[index] || 0) + 1 }}/{{ getStepImages(index).length }}
								</view>
							</view>
							<image
								v-if="getStepImages(index).length === 0"
								:src="getCurrentImage(index)"
								@click="handlePreviewImage(index)"
								class="timeline-image timeline-image--fix"
								mode="aspectFill"
							/>
						</view>
					</view>
				</view>
				
				<!-- 垂直模式的连接线：只在index < steps.length - 1时渲染 -->
				<view 
					v-if="displayMode === 'vertical' && index < steps.length - 1"
					class="timeline-item__line timeline-item__line--vertical"
				></view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// 定义props
const props = defineProps({
	steps: {
		type: Array,
		required: true,
		default: () => []
	},
	currentStep: {
		type: Number,
		default: 0
	},
	processData: {
		type: Array,
		default: () => []
	},
	mode: {
		type: String,
		default: 'tree'
	}
})

// 定义emits
const emit = defineEmits(['image-click'])

// 计算属性
const getIconColor = (index) => {
	const status = getStepStatus(index)
	if (status === 'completed') {
		return '#fff' // 绿色背景，白色图标
	} else if (status === 'in-progress') {
		return '#fff' // 橙色背景，白色图标
	} else {
		return '#495057' // 灰色背景，深灰色图标，更明显
	}
}

// 获取步骤状态
const getStepStatus = (index) => {
	if (props.processData && props.processData[index]) {
		return props.processData[index].status || 'pending'
	}
	// 如果没有processData，则使用currentStep逻辑
	if (index < props.currentStep) {
		return 'completed'
	} else if (index === props.currentStep) {
		return 'in-progress'
	} else {
		return 'pending'
	}
}

// 获取每个节点的图片数组
const getStepImages = (index) => {
	const step = props.processData[index]
	if (!step) return []
	if (Array.isArray(step.images)) return step.images
	if (step.image) return [step.image]
	return []
}

// 获取所有节点所有图片的全局数组
const getAllImages = () => {
	let arr = []
	for (let i = 0; i < props.processData.length; i++) {
		arr = arr.concat(getStepImages(i))
	}
	return arr
}

// 计算当前节点当前图片在全局图片数组中的索引
const getGlobalImageIndex = (nodeIndex) => {
	let idx = 0
	for (let i = 0; i < props.processData.length; i++) {
		const images = getStepImages(i)
		if (i < nodeIndex) {
			idx += images.length
		} else if (i === nodeIndex) {
			idx += currentImageIndexes.value[i] || 0
			break
		}
	}
	return idx
}

// 每个节点的图片索引
const currentImageIndexes = ref([])
watch(() => props.processData, (val) => {
	currentImageIndexes.value = val.map(() => 0)
}, { immediate: true })

// 切换图片
const handleImageIndexClick = (index) => {
	const images = getStepImages(index)
	if (images.length > 1) {
		currentImageIndexes.value[index] = (currentImageIndexes.value[index] + 1) % images.length
	}
}

// 预览图片
const handlePreviewImage = (index) => {
	const allImages = getAllImages()
	const currentIndex = getGlobalImageIndex(index)
	emit('image-click', {
		currentImage: allImages[currentIndex],
		allImages,
		currentIndex
	})
}

// 由 props.mode 控制展示模式
const displayMode = computed(() => props.mode)
// 模式切换按钮仅在组件内部演示用，实际由父组件 props.mode 控制
const switchMode = (newMode) => {
	// emit('update:mode', newMode) // 如果需要支持 v-model:mode
}

// 图片堆叠相关
const selectedImageIndex = ref(0)
const currentStepIndex = ref(-1)

const getCurrentImage = (index) => {
	const images = getStepImages(index)
	return images[currentImageIndexes.value[index] || 0] || ''
}

const handleImageStackClick = (index) => {
	if (currentStepIndex.value === index) {
		// 如果点击的是当前步骤，切换到下一张图片
		const images = getStepImages(index)
		if (images.length > 1) {
			selectedImageIndex.value = (selectedImageIndex.value + 1) % images.length
		}
	} else {
		// 如果点击的是新步骤，重置图片索引
		currentStepIndex.value = index
		selectedImageIndex.value = 0
	}
}

// 新增：树形模式主线分段颜色
const getZigzagMainlineStyle = (index) => {
	if (displayMode.value !== 'tree') return {};
	const status = getStepStatus(index)
	let color = 'var(--border-color)'
	if (status === 'completed') {
		color = 'var(--success-color)'
	} else if (status === 'in-progress') {
		color = 'var(--warning-color)'
	}
	return {
		left: '50%',
		width: '2px',
		height: '50%',
		background: color,
		position: 'absolute',
		transform: 'translateX(-50%)',
		borderRadius: '1px',
		zIndex: 1,
		transition: 'background 0.3s'
	}
}

const getStackedImageStyle = (imgIdx, activeIdx, direction = 'left') => {
	const offset = Math.min(imgIdx, 3);
	const isActive = imgIdx === activeIdx;
	// 左侧往左上，右侧往右下
	const sign = direction === 'left' ? -1 : 1;
	return {
		position: 'absolute',
		top: `${sign * offset * 1}px`,
		left: `${sign * offset * 4}px`,
		zIndex: isActive ? 10 : 10 - offset,
		boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
		transform: isActive ? 'scale(1.08)' : `scale(${1 - offset * 0.01})`,
		transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
	}
}

const getVerticalStackedImageStyle = (imgIdx, activeIdx) => {
	const offset = Math.min(imgIdx, 3);
	const isActive = imgIdx === activeIdx;
	return {
		position: 'absolute',
		top: '0px',
		left: `${offset * 6}px`, // 仅向右堆叠
		zIndex: isActive ? 10 : 10 - offset,
		boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
		transform: isActive ? 'scale(1.08)' : `scale(${1 - offset * 0.02})`,
		transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
	}
}
</script>

<style lang="scss" scoped>
$zigzag-item-height: 140px;
.timeline {
	display: flex;
	flex-direction: column;
	position: relative;
}

// 时间线连线主线样式
.timeline-item__mainline {
	height: $zigzag-item-height !important;
	top: 40%;
}

// 模式切换按钮
.timeline-mode-switch {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	margin-bottom: 16px;
	.mode-icon {
		cursor: pointer;
		transition: color 0.2s;
	}
}

// 时间线容器
.timeline-container {
	display: flex;
	flex-direction: column;
	gap: 0;
	position: relative;
	
	&--zigzag {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 20px;
	}
}

.timeline-item {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-md);
	position: relative;
	padding: var(--spacing-lg) 0;
	transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	min-height: 100px;
	
	&__dot {
		width: 28px;
		height: 28px;
		background-color: rgba(245, 245, 245, 0.7);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		flex-shrink: 0;
		z-index: 3;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	&__axis-content {
		order: 2; /* 轴线内容与图片对齐 */
		position: absolute;
		left: calc(50% + 70px); /* 与右侧图片水平居中对齐，并向左偏移70px */
		transform: translateX(-50%); /* 相对于图片位置居中 */
		text-align: center;
		z-index: 3;
		background-color: rgba(255, 255, 255, 0.9);
		padding: 8px 12px; /* 增加内边距 */
		border-radius: var(--radius-sm);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: row; /* 水平排列，标题和时间在一行 */
		align-items: center;
		gap: 8px; /* 标题和时间之间的间距 */
		min-width: 120px; /* 设置最小宽度 */
		/* 去除移动效果，固定位置 */
	}
	
	&__title {
		font-size: var(--font-size-sm); /* 稍微减小字体 */
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
		transition: color 0.3s ease;
	}
	
	&__time {
		font-size: var(--font-size-xs); /* 减小时间字体 */
		color: var(--text-secondary);
	}
	
	&__image {
		transition: all 0.3s ease;
		z-index: 2; /* 图片层级高于轴线 */
		
		// 垂直模式图片
		&--vertical {
			margin-top: var(--spacing-xs); /* 减少图片间距 */
		}
		
		&-content {
			width: 100px; /* 减小图片尺寸 */
			height: 70px;
			border-radius: var(--radius-md);
			background-color: var(--bg-secondary);
			transition: all 0.3s ease;
			box-shadow: var(--shadow-sm);
			
			&:active {
				transform: scale(0.95);
				box-shadow: var(--shadow-md);
			}
		}
	}
	
	// 垂直模式连接线
	&__line--vertical {
		position: absolute;
		left: 13px;
		top: 42px;
		width: 2px;
		height: calc(100% - 28px);
		background-color: var(--border-color);
		z-index: 1;
		transition: background-color 0.3s ease;
	}
	
	// 之字形模式连接线
	&__line--zigzag {
		position: absolute;
		top: 28px; /* 调整连接线位置 */
		left: 50%;
		transform: translateX(-50%);
		z-index: 1; /* 连接线层级最低 */
		transition: all 0.3s ease;
		
		.zigzag-line-vertical {
			width: 2px;
			height: 30px; /* 减少垂直连接线高度 */
			background-color: var(--border-color);
			margin: 0 auto;
			transition: all 0.3s ease;
		}
	}
	
	// 之字形模式布局
	&--zigzag {
		width: 100%;
		position: relative;
		transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: $zigzag-item-height;
		padding: var(--spacing-md) 20px; /* 增大内边距 */
		
		// 左侧项目（单数序号）
		&.timeline-item--zigzag-left {
			.timeline-item__dot {
				/* 移动端节点图标也使用绝对定位居中 */
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				z-index: 5;
				/* 保持状态样式 */
				&.timeline-item__dot--completed {
					background-color: var(--success-color);
					transform: translateX(-50%) scale(1.1);
					box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
				}
				&.timeline-item__dot--in-progress {
					background-color: var(--warning-color);
					transform: translateX(-50%);
					animation: pulse 2s infinite;
				}
				&.timeline-item__dot--pending {
					background-color: var(--text-secondary);
					transform: translateX(-50%);
					opacity: 0.8; /* 增加透明度，让图标更明显 */
				}
			}
			
			.timeline-item__axis-content {
				order: 2; /* 轴线内容与图片对齐 */
				position: absolute;
				left: calc(50% + 100px); /* 右侧文本，距离中轴线 */
				transform: translateX(-50%); /* 相对于自身位置居中 */
				text-align: center;
				z-index: 3;
				padding: 0;
				background-color: rgba(255, 255, 255, 0.9);
				border-radius: var(--radius-sm);
				backdrop-filter: blur(4px);
				display: flex;
				flex-direction: row; /* 水平排列，标题和时间在一行 */
				align-items: center;
				justify-content: center;
				gap: 8px; /* 标题和时间之间的间距 */
			}
			
			.timeline-item__image-stack--left {
				order: 1; /* 左侧图片 */
				
				transform: translateX(-100px); /* 左侧图片，距离中轴线 */
			}
		}
		
		// 右侧项目（双数序号）
		&.timeline-item--zigzag-right {
			.timeline-item__dot {
				/* 移动端节点图标也使用绝对定位居中 */
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				z-index: 5;
				/* 保持状态样式 */
				&.timeline-item__dot--completed {
					background-color: var(--success-color);
					transform: translateX(-50%) scale(1.1);
					box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
				}
				&.timeline-item__dot--in-progress {
					background-color: var(--warning-color);
					transform: translateX(-50%);
					animation: pulse 2s infinite;
				}
				&.timeline-item__dot--pending {
					background-color: var(--text-secondary);
					transform: translateX(-50%);
					opacity: 0.8; /* 增加透明度，让图标更明显 */
				}
			}
			
			.timeline-item__axis-content {
				order: 2; /* 轴线内容与图片对齐 */
				position: absolute;
				left: calc(50% - 100px); /* 左侧文本，距离中轴线 */
				transform: translateX(-50%); /* 相对于自身位置居中 */
				text-align: center;
				z-index: 3;
				padding: 0;
				background-color: rgba(255, 255, 255, 0.9);
				border-radius: var(--radius-sm);
				backdrop-filter: blur(4px);
				display: flex;
				flex-direction: row; /* 水平排列，标题和时间在一行 */
				align-items: center;
				justify-content: center;
				gap: 8px; /* 标题和时间之间的间距 */
			}
			
			.timeline-item__image-stack--right {
				order: 3; /* 右侧图片 */
				
				transform: translateX(100px); /* 右侧图片，距离中轴线 */
			}
		}
	}
	
	// 状态样式
	&--completed {
		.timeline-item__dot {
			background-color: var(--success-color);
			transform: scale(1.1);
			box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
		}
		
		.timeline-item__title {
			color: var(--success-color);
		}
		
		.timeline-item__line {
			background-color: var(--success-color);
		}
	}
	
	&--in-progress {
		.timeline-item__dot {
			background-color: var(--warning-color);
			animation: pulse 2s infinite;
		}
		
		.timeline-item__title {
			color: var(--warning-color);
		}
		
		.timeline-item__line {
			background-color: var(--warning-color);
		}
	}
	
	&--pending {
		.timeline-item__dot {
			background-color: var(--text-secondary);
			opacity: 0.8; /* 增加透明度，让图标更明显 */
		}
		
		.timeline-item__title {
			color: var(--text-secondary);
		}
		
		.timeline-item__line {
			background-color: var(--border-color);
		}
	}
	
	&:hover {
		.timeline-item__dot {
			transform: scale(1.15);
			box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
		}
		
		.timeline-item__image-content {
			transform: scale(1.05);
			box-shadow: var(--shadow-lg);
		}
	}
}

@keyframes pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
	}
	70% {
		box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
	}
	100% {
		box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
	}
}

// 响应式设计
@media (max-width: 768px) {
	.timeline-mode-switch {
		.mode-icon {
			font-size: 18px;
		}
	}
	
	.timeline-item {
		gap: var(--spacing-sm);
		
		&__dot {
			width: 28px;
			height: 28px;
		}
		
		&__title {
			font-size: var(--font-size-sm);
		}
		
		&__time {
			font-size: var(--font-size-xs);
		}
		
		&__image-content {
			width: 100px;
			height: 70px;
		}
		
		&__line--vertical {
			left: 13px;
			top: 56px;
		}
		
		// 移动端之字形模式优化
		&--zigzag {
			min-height: 100px; /* 移动端最下高度 */
			max-height: $zigzag-item-height; /* 移动端最大高度 */
			padding: 2px; /* 移动端适当增大内边距 */
			
			.timeline-item__dot {
				/* 移动端节点图标也使用绝对定位居中 */
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				z-index: 5;
				/* 保持状态样式 */
				&.timeline-item__dot--completed {
					background-color: var(--success-color);
					transform: translateX(-50%) scale(1.1);
					box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
				}
				&.timeline-item__dot--in-progress {
					background-color: var(--warning-color);
					transform: translateX(-50%);
					animation: pulse 2s infinite;
				}
				&.timeline-item__dot--pending {
					background-color: var(--text-secondary);
					transform: translateX(-50%);
					opacity: 0.8; /* 增加透明度，让图标更明显 */
				}
			}
			
			.timeline-item__axis-content {
				font-size: var(--font-size-xs); /* 移动端减小字体 */
				flex-direction: row; /* 移动端也使用水平排列 */
			}
			
			/* 移动端奇偶数位置偏移调整 */
			&.timeline-item--zigzag-left {
				.timeline-item__image-stack--left {
					transform: translateX(-100px); /* 移动端左侧图片，距离中轴线 */
				}
				
				.timeline-item__axis-content {
					left: calc(50% + 100px); /* 移动端右侧文本，距离中轴线 */
					transform: translateX(-50%);
				}
			}
			
			&.timeline-item--zigzag-right {
				.timeline-item__image-stack--right {
					transform: translateX(100px); /* 移动端右侧图片，距离中轴线 */
				}
				
				.timeline-item__axis-content {
					left: calc(50% - 100px); /* 移动端左侧文本，距离中轴线 */
					transform: translateX(-50%);
				}
			}
		}
	}
	
	.timeline-container--zigzag {
		padding: 0 10px;
	}
	
	// 移动端图片堆叠优化
	.image-stack-container {
		@media (max-width: 768px) {
			width: 80px; /* 移动端进一步减小 */
			height: 60px;
		}
	}
	
	.stacked-image {
		@media (max-width: 768px) {
			&--active {
				transform: scale(1.05) !important;
			}
		}
	}
	
	.image-count-badge {
		@media (max-width: 768px) {
			width: 16px;
			height: 16px;
			font-size: 8px;
			top: -1px;
			right: -2px;
		}
	}
}

// 图片堆叠样式
.timeline-item__image-stack {
	position: relative;
	width: 120px;
	height: 80px;
	min-width: 120px;
	min-height: 80px;
	.stacked-image {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 10px;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		z-index: 1;
		&--active {
			z-index: 20;
			box-shadow: 0 4px 16px rgba(0,0,0,0.18);
			transform: scale(1.08);
		}
	}
	.stacked-image-content {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 10px;
	}
}

// 图片堆叠容器
.image-stack-container {
	position: relative;
	width: 100px; /* 减小容器尺寸 */
	height: 70px;
	cursor: pointer;
	transition: all 0.3s ease;
	z-index: 10; /* 增加z-index */
	
	&:hover {
		transform: scale(1.05);
	}
	
	&:active {
		transform: scale(0.95);
	}
}

// 堆叠图片
.stacked-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: var(--radius-md);
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: var(--shadow-sm);
	z-index: 10; /* 增加z-index */
	
	&--active {
		transform: scale(1.1) !important;
		box-shadow: var(--shadow-lg);
		z-index: 15 !important; /* 增加激活状态的z-index */
	}
	
	&--front {
		box-shadow: var(--shadow-md);
	}
	
	.stacked-image-content {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-md);
		transition: all 0.3s ease;
	}
}

// 图片数量指示器
.image-count-badge {
	position: absolute;
	top: -6px; /* 调整位置 */
	right: -6px;
	width: 20px; /* 减小尺寸 */
	height: 20px;
	background-color: var(--primary-color);
	color: white;
	border-radius: var(--radius-full);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 10px; /* 减小字体 */
	font-weight: var(--font-weight-bold);
	z-index: 20; /* 增加z-index，确保在最上层 */
	box-shadow: var(--shadow-sm);
}

.timeline-image-wrapper {
	position: relative;
	display: inline-block;
	top: 10px;
    left: 10px;
}

.timeline-image {
	width: 100px;
	height: 70px;
	border-radius: 8px;
	background: #f8f9fa;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.timeline-image--fix {
	width: 120px;
	height: 80px;
	border-radius: 10px;
	object-fit: cover;
	box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}

.image-index-indicator {
	position: absolute;
	top: -1px;
	right: -2px;
	background: rgba(0,0,0,0.3);
	color: #fff;
	font-size: 13px;
	border-radius: 12px;
	padding: 0 8px;
	line-height: 22px;
	height: 22px;
	min-width: 32px;
	text-align: center;
	z-index: 99;
	box-shadow: 0 2px 8px rgba(0,0,0,0.12);
	cursor: pointer;
	user-select: none;
	transition: box-shadow 0.2s;
	&:active {
		box-shadow: 0 4px 16px rgba(0,0,0,0.18);
		background: rgba(0,0,0,0.85);
	}
}
</style> 