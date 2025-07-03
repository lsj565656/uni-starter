<template>
	<uni-card 
		:title="storeName"
		:extra="businessStatusText"
		:is-shadow="true"
		:is-full="false"
		class="shop-info-card"
		:class="cardClass"
	>
		<view class="shop-info-card__content">
			<uni-list>
				<uni-list-item 
					title="营业时间"
					:note="businessHours"
					:clickable="true"
				>
					<template #header>
						<view class="icon-container">
							<uni-icons custom-prefix="iconfont" type="icon-time" size="18" color="#2C3E50"></uni-icons>
						</view>
					</template>
				</uni-list-item>
				
				<uni-list-item 
					title="店铺地址"
					:note="address"
					:clickable="true"
					@click="handleAddressClick"
				>
					<template #header>
						<view class="icon-container">
							<uni-icons type="location" size="18" color="#2C3E50"></uni-icons>
						</view>
					</template>
				</uni-list-item>
				
				<uni-list-item 
					title="联系电话"
					:note="phone"
					:clickable="true"
					@click="handlePhoneClick"
				>
					<template #header>
						<view class="icon-container">
							<uni-icons type="phone" size="18" color="#2C3E50"></uni-icons>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
		</view>
	</uni-card>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
	storeName: {
		type: String,
		default: 'xx餐饮店'
	},
	businessStatusText: {
		type: String,
		default: '营业中'
	},
	businessStatusClass: {
		type: String,
		default: 'status-open'
	},
	businessStatusIcon: {
		type: String,
		default: 'checkmarkempty'
	},
	businessHours: {
		type: String,
		default: '08:00-22:00'
	},
	address: {
		type: String,
		default: '北京市朝阳区建国路88号'
	},
	phone: {
		type: String,
		default: '18236562550'
	}
})

// 定义emits
const emit = defineEmits(['address-click', 'phone-click'])

// 计算属性
const cardClass = computed(() => {
	return {
		'shop-info-card--open': props.businessStatusClass === 'status-open',
		'shop-info-card--closed': props.businessStatusClass === 'status-closed'
	}
})

// 方法
const handleAddressClick = () => {
	emit('address-click')
}

const handlePhoneClick = () => {
	emit('phone-click')
}
</script>

<style lang="scss" scoped>
.shop-info-card {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, box-shadow;
	
	&__content {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
		
		&:active {
			transform: scale(0.98);
		}
	}
	
	&__status {
		display: flex;
		justify-content: center;
	}
	
	&__badge {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		border-radius: var(--radius-full);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		background-color: var(--error-color);
		color: var(--text-light);
		transition: all 0.3s ease;
		
		&.status-open {
			background-color: #28a7464b;
			color: #fff;
			box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
		}
		
		&.status-closed {
			background-color: #6c757d;
			color: #fff;
			box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
		}
		
		&-text {
			margin-left: var(--spacing-xs);
		}
	}
	
	&__icon {
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, var(--bg-secondary) 0%, #f8f9fa 100%);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: var(--spacing-md);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform, background;
		
		&:hover {
			background: linear-gradient(135deg, var(--primary-color) 0%, #0056b3 100%);
			transform: scale(1.1);
		}
		
		&:active {
			transform: scale(0.95);
		}
	}
	
	&__announcement {
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
		}
	}
}
// 自定义uni-card样式
:deep(.uni-card) {
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, box-shadow;
}

.uni-list-item__container {
	padding: 0 !important;
	display: flex;
	align-items: center;
	justify-content: center;
}

:deep(.uni-card__header) {
	border-bottom: 1px solid var(--border-color);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	
	.uni-card__header-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--text-primary);
	}
	
	.uni-card__header-extra {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full);
		background-color: #28a7467a;
		color: #fff;
		box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
		
		&.status-closed {
			background-color: #6c757d;
			color: #fff;
			box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
		}
	}
}

:deep(.uni-card__content) {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	
	&:active {
		transform: scale(0.98);
	}
}

// 自定义uni-list样式
:deep(.uni-list-item) {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, background-color;
	padding: 0;
	
	&:active {
		background-color: var(--bg-secondary);
		transform: scale(0.98);
	}
	
	&:not(:last-child) {
		border-bottom: 1px solid var(--border-color);
	}
	
	// 确保列表项内容区域正确显示
	.uni-list-item__container {
		padding: 0;
		display: flex;
		align-items: center;
		width: 100%;
	}
}

// 统一的图标容器样式
.icon-container {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	margin-right: 12px;
	flex-shrink: 0;
	position: relative;
	
	// 确保图标垂直居中
	:deep(.uni-icons) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
}

:deep(.uni-list-item__content) {
	display: flex;
	align-items: center;
	padding: 16px 0;
}

:deep(.uni-list-item__content-title) {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-medium);
	margin-bottom: 4px;
}

:deep(.uni-list-item__content-note) {
	font-size: var(--font-size-sm);
	color: var(--text-primary);
	font-weight: var(--font-weight-medium);
}

:deep(.uni-list-item__content-arrow) {
	color: var(--text-secondary);
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(1.2);
	}
}

// 自定义uni-notice-bar样式
:deep(.uni-notice-bar) {
	border-radius: var(--radius-md);
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	
	&:active {
		transform: scale(0.98);
	}
}

// 响应式设计
@media (max-width: 768px) {
	.shop-info-card {
		
		&__badge {
			font-size: var(--font-size-xs);
		}
		
		&__icon {
			width: 32px;
			height: 32px;
			margin-right: var(--spacing-sm);
		}
	}
	
	// 移动端图标容器优化
	.icon-container {
		width: 20px;
		height: 20px;
		margin-right: 10px;
	}
	
	:deep(.uni-card__header) {
		
		.uni-card__header-title {
			font-size: var(--font-size-md);
		}
		
		.uni-card__header-extra {
			font-size: var(--font-size-xs);
		}
	}
	
	:deep(.uni-list-item__content) {
		padding: 12px 0;
	}
	
	:deep(.uni-list-item__content-title) {
		font-size: var(--font-size-xs);
	}
	
	:deep(.uni-list-item__content-note) {
		font-size: var(--font-size-xs);
	}
}

// 营业状态样式类
.shop-info-card {
	&--open {
		:deep(.uni-card__header-extra) {
			background-color: #28a74644 !important;
			color: #fff !important;
		}
	}
	
	&--closed {
		:deep(.uni-card__header-extra) {
			background-color: #6c757d6b !important;
			color: #fff !important;
		}
	}
}


// 优化图标颜色
:deep(.uni-icons) {
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(1.1);
	}
}

// 优化列表项点击效果
:deep(.uni-list-item) {
	&:active {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, #e9ecef 100%);
		transform: scale(0.98);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}
}
</style> 