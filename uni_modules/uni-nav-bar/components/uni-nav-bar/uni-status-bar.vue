<template>
	<view :style="{ height: statusBarHeight }" class="uni-status-bar">
		<slot />
	</view>
</template>

<script>
	export default {
		name: 'UniStatusBar',
		data() {
			return {
				statusBarHeight: this.getStatusBarHeight()
			}
		},
		methods: {
			getStatusBarHeight() {
				// #ifdef MP-WEIXIN
				// 微信小程序使用新API
				try {
					if (typeof wx !== 'undefined' && wx.getWindowInfo) {
						const windowInfo = wx.getWindowInfo()
						if (windowInfo && typeof windowInfo.statusBarHeight === 'number') {
							return windowInfo.statusBarHeight + 'px'
						}
					}
					// 降级到旧API
					const systemInfo = uni.getSystemInfoSync()
					return (systemInfo.statusBarHeight || 0) + 'px'
				} catch (error) {
					console.warn('微信小程序获取状态栏高度失败:', error)
					return '0px'
				}
				// #endif
				
				// #ifndef MP-WEIXIN
				// App端和其他平台使用旧API
				try {
					const systemInfo = uni.getSystemInfoSync()
					return (systemInfo.statusBarHeight || 0) + 'px'
				} catch (error) {
					console.warn('获取状态栏高度失败:', error)
					return '0px'
				}
				// #endif
			}
		}
	}
</script>

<style lang="scss" >
	.uni-status-bar {
		// width: 750rpx;
		height: 20px;
		// height: var(--status-bar-height);
	}
</style>
