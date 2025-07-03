<template>
	<view class="home-container">
		<!-- #ifdef APP -->
		<statusBar></statusBar>
		<!-- #endif -->
		
		<!-- banner -->
		<!-- <unicloud-db ref="bannerdb" v-slot:default="{data, loading, error, options}" collection="opendb-banner"
			field="_id,bannerfile,open_url,title" @load="onqueryload" >
			<image v-if="!(loading||data.length)" class="banner-image" src="/static/uni-center/headers.png" mode="aspectFill" :draggable="false" />
			
			<swiper v-else class="swiper-box"  @change="changeSwiper" :current="current" indicator-dots>
				<swiper-item v-for="(item, index) in data" :key="item._id">
					<image class="banner-image" :src="item.bannerfile.url" mode="aspectFill" @click="clickBannerItem(item)" :draggable="false" />
				</swiper-item>
			</swiper>
		</unicloud-db> -->
        <swiper class="swiper-box"  @change="changeSwiper" :current="current" indicator-dots>
            <swiper-item v-for="(item, index) in imageDatas" :key="item.id">
                <image class="banner-image" :src="item.image" mode="aspectFill" @click="clickBannerItem(item)" :draggable="false" />
            </swiper-item>
        </swiper>

		<!-- 店铺信息卡片 -->
		<shop-info-card
			:store-name="storeName"
			:business-status-text="businessStatusText"
			:business-status-class="businessStatusClass"
			:business-status-icon="businessStatusIcon"
			:business-hours="businessHours"
			:address="address"
			:phone="phone"
			@address-click="openMap"
			@phone-click="makePhoneCall"
		/>

		<!-- 食材区 -->
		<view class="section">
			<view class="section-header">
				<uni-icons type="shop" size="20" color="#007aff" />
				<text class="section-title">新鲜食材</text>
				<text class="update-time">{{ ingredientsUpdateTime }}</text>
			</view>
			<scroll-view class="ingredients-scroll" scroll-x show-scrollbar="false">
				<view class="ingredients-container">
					<ingredient-card
						v-for="ingredient in ingredients"
						:key="ingredient.id"
						:ingredient="ingredient"
						@click="showIngredientDetail(ingredient)"
					/>
				</view>
			</scroll-view>
		</view>

		<!-- 面食制作流程 -->
		<view class="section">
			<view class="section-header">
				<uni-icons type="gear" size="20" color="#007aff" />
				<text class="section-title">面食制作</text>
			</view>
			<timeline
				:steps="flourProcessSteps"
				:current-step="currentFlourStep"
				:process-data="flourProcess"
				mode="tree"
				@image-click="handleFlourTimelineImageClick"
			/>
		</view>

		<!-- 卤肉制作流程 -->
		<view class="section">
			<view class="section-header">
				<uni-icons type="fire" size="20" color="#007aff" />
				<text class="section-title">卤肉制作</text>
			</view>
			<timeline
				:steps="meatProcessSteps"
				:current-step="currentMeatStep"
				:process-data="meatProcess"
				mode="tree"
				@image-click="handleMeatTimelineImageClick"
			/>
		</view>

		<!-- 宫格功能区 -->
		<view class="section">
			<uni-title type="h2" title="快捷功能" align="left" />
			<uni-grid :column="3" :highlight="true" @change="change">
				<template v-for="(item,i) in homeList">
					<uni-grid-item :index="i" :key="i"
						v-if="i<3 || i>2&&i<6&&hasLogin || i>5&&uniIDHasRole('admin')"
					>
						<view class="grid-item-box" style="background-color: #fff;">
							<text class="big-number">{{i+1}}</text>
							<text class="text">{{item}}</text>
						</view>
					</uni-grid-item>
				</template>
			</uni-grid>
		</view>
	</view>
</template>

<script setup>
	// #ifdef APP
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	// #endif
	import { ref, computed, nextTick } from 'vue'
	import { images } from '@/utils/images'
	import ingredientCard from '@/components/ingredient-card/ingredient-card.vue'
	import timeline from '@/components/timeline/timeline.vue'
	import shopInfoCard from '@/components/shop-info-card/shop-info-card.vue'

    const imageDatas = ref([
        {
            id: 1,
            name: 'banner1',
            image: images.ingredients.wuhuarou,
        },
        {
            id: 2,
            name: 'banner2',
            image: images.ingredients.shucai,
        },
        {
            id: 3,
            name: 'banner3',
            image: images.ingredients.mianfen,
        }
    ])
	const ingredients = ref([
		{
			id: 1,
			name: '精选五花肉',
			description: '新鲜猪肉，肥瘦均匀，肉质鲜嫩，口感醇厚。采用传统工艺精心挑选，确保每一块肉都达到最佳品质。',
			image: images.ingredients.wuhuarou,
			additionalImages: [
				images.ingredients.wuhuarou,
				'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg',
				'https://s3.bmp.ovh/imgs/2025/06/10/74a9c32cd547c77f.jpg'
			]
		},
		{
			id: 2,
			name: '新鲜蔬菜',
			description: '当季时令蔬菜，绿色健康，营养丰富。每日新鲜采购，保证蔬菜的新鲜度和营养价值。',
			image: images.ingredients.shucai,
			additionalImages: [
				images.ingredients.shucai,
				'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg'
			]
		},
		{
			id: 3,
			name: '优质面粉',
			description: '高筋面粉，口感筋道，制作出的面食更加有嚼劲。选用优质小麦，经过精细加工而成。',
			image: images.ingredients.mianfen,
			additionalImages: [
				images.ingredients.mianfen,
				'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg'
			]
		},
		{
			id: 4,
			name: '秘制调料',
			description: '传统配方，味道醇厚，经过多年传承和改良。独特的调味工艺，让每一道菜都充满家的味道。',
			image: images.ingredients.wuhuarou,
			additionalImages: [
				images.ingredients.wuhuarou,
				'https://s3.bmp.ovh/imgs/2025/06/10/74a9c32cd547c77f.jpg',
				'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg'
			]
		}
	])
	const ingredientsUpdateTime = ref('12-01 14:30')
	const flourProcessSteps = ref([
		{ name: '称重', icon: 'icon-chengzhong', time: '08:00' },
		{ name: '和面', icon: 'icon-miantuan', time: '08:15' },
		{ name: '面剂', icon: 'icon-ganmianzhang', time: '08:30' },
		{ name: '入炉', icon: 'icon-jiarezhizuo', time: '08:45' },
		{ name: '出炉', icon: 'icon-wanjie', time: '09:00' }
	])
	const flourProcess = ref([
		{
			id: 1,
			name: '称重',
			time: '08:00',
			image: images.process.mianfen,
			images: [
				images.process.mianfen,
				'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg',
				'https://s3.bmp.ovh/imgs/2025/06/10/74a9c32cd547c77f.jpg'
			],
			status: 'completed'
		},
		{
			id: 2,
			name: '和面',
			time: '08:15',
			image: images.process.hemianguo,
			images: [
				images.process.hemianguo,
				'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg',
				'https://s3.bmp.ovh/imgs/2025/06/10/5d34a2e16e7fed35.jpg',
				'https://s3.bmp.ovh/imgs/2025/06/10/7f8698b08ed0a131.jpg'
			],
			status: 'completed'
		},
		{
			id: 3,
			name: '面剂',
			time: '08:30',
			image: images.process.baozhi_1,
			status: 'completed'
		},
		{
			id: 4,
			name: '入炉',
			time: '08:45',
			image: images.process.baozhi_2,
			status: 'in-progress'
		},
		{
			id: 5,
			name: '出炉',
			time: '09:00',
			image: images.process.shaobing,
			status: 'pending'
		}
	])
	const meatProcessSteps = ref([
		{ name: '清洗', icon: 'icon-qingxi', time: '07:00' },
		{ name: '入锅', icon: 'icon-jiatiaoliao', time: '07:30' },
		{ name: '加料', icon: 'icon-jiatiaoliao', time: '07:45' },
		{ name: '卤制', icon: 'icon-jiarezhizuo', time: '08:00' },
		{ name: '出锅', icon: 'icon-wanjie', time: '08:30' }
	])
	const meatProcess = ref([
		{
			id: 1,
			name: '五花肉清洗',
			time: '07:00',
			image: images.process.lurou_1,
			status: 'completed'
		},
		{
			id: 2,
			name: '加入卤料',
			time: '07:30',
			image: images.process.lurou_2,
			status: 'in-progress'
		},
		{
			id: 3,
			name: '卤制过程',
			time: '07:45',
			image: images.process.lurou_3,
			status: 'pending'
		},
		{
			id: 4,
			name: '调味收汁',
			time: '08:00',
			image: images.process.lurou_4,
			status: 'pending'
		},
		{
			id: 5,
			name: '卤肉出锅',
			time: '08:30',
			image: images.process.hemian_1,
			status: 'pending'
		}
	])
	const currentFlourStep = ref(3)
	const currentMeatStep = ref(2)
	const storeName = ref('***餐饮店')
	const businessHours = ref('09:00-21:00')
	const address = ref('郑州市中原区煤机路与牛庄南街交叉口西120米')
	const phone = ref('13673989888')

	const businessStatus = computed(() => {
		const now = new Date()
		const [open, close] = businessHours.value.split('-')
		const [openH, openM] = open.split(':').map(Number)
		const [closeH, closeM] = close.split(':').map(Number)
		const nowMins = now.getHours() * 60 + now.getMinutes()
		const openMins = openH * 60 + openM
		const closeMins = closeH * 60 + closeM
		if (nowMins >= openMins && nowMins < closeMins) {
			return {
				text: '营业中',
				class: 'status-open',
				icon: 'checkmarkempty'
			}
		} else {
			return {
				text: '休息中',
				class: 'status-closed',
				icon: 'closeempty'
			}
		}
	})
	const businessStatusText = computed(() => businessStatus.value.text)
	const businessStatusClass = computed(() => businessStatus.value.class)
	const businessStatusIcon = computed(() => businessStatus.value.icon)

	// 刷新食材信息方法
	function refreshIngredients() {
		uni.showLoading({ title: '刷新中...' })
		setTimeout(() => {
			uni.hideLoading()
			const hasUpdate = Math.random() > 0.5
			if (hasUpdate) {
				const now = new Date()
				const month = String(now.getMonth() + 1).padStart(2, '0')
				const day = String(now.getDate()).padStart(2, '0')
				const hour = String(now.getHours()).padStart(2, '0')
				const minute = String(now.getMinutes()).padStart(2, '0')
				ingredientsUpdateTime.value = `${month}-${day} ${hour}:${minute}`
				uni.showToast({ title: '更新成功', icon: 'success' })
			} else {
				uni.showToast({ title: '已是最新', icon: 'none' })
			}
		}, 1000)
	}

	// 其它交互方法
	function openMap() {
		// #ifdef APP-PLUS
        // APP端调用地图
        uni.openLocation({
            latitude: 34.761829904749774,
            longitude: 113.59211537161264,
            name: 'xx餐饮店',
            address: address.value,
            scale: 18
        })
        // #endif
        
        // #ifdef H5
        // H5端跳转到高德地图
        const encodedAddress = encodeURIComponent(address.value)
        window.open(`https://uri.amap.com/marker?position=113.59211537161264,34.761829904749774&name=卤肉烧饼&address=${encodedAddress}`)
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序调用地图
        uni.openLocation({
            latitude: 34.761829904749774,
            longitude: 113.59211537161264,
            name: 'xx餐饮店',
            address: address.value,
            scale: 18
        })
        // #endif
	}
	function makePhoneCall() {
        // 检查拨打电话权限
        // #ifdef APP-PLUS
        uni.authorize({
            scope: 'scope.phoneCall',
            success: () => {
                // 权限获取成功，拨打电话
                callPhone()
            },
            fail: () => {
                // 权限获取失败，引导用户手动开启
                uni.showModal({
                    title: '需要拨打电话权限',
                    content: '请在设置中开启拨打电话权限，或手动拨打：' + phone.value,
                    confirmText: '去设置',
                    cancelText: '取消',
                    success: (res) => {
                        if (res.confirm) {
                            // 打开应用设置页面
                            uni.openSetting({
                                success: (settingRes) => {
                                    if (settingRes.authSetting['scope.phoneCall']) {
                                        callPhone()
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
        // #endif
        
        // #ifdef H5
        // H5端直接拨打电话
        callPhone()
        // #endif
        
        // #ifdef MP-WEIXIN
        // 微信小程序直接拨打电话
        callPhone()
        // #endif
	}
	function showIngredientDetail(ingredient) {
			// 立即设置弹窗状态，阻止页面滚动
	isIngredientPopupOpen.value = true
	
	// 保存当前滚动位置（在页面重新布局之前）
	const query = uni.createSelectorQuery()
	query.select('.content-wrapper').scrollOffset()
	query.exec((res) => {
		if (res[0]) {
			savedScrollTop.value = res[0].scrollTop || 0
		}
	})
	
	currentIngredient.value = ingredient
	// 将主图片和额外图片合并为轮播数组
	const allImages = [ingredient.image]
	if (ingredient.additionalImages && ingredient.additionalImages.length > 0) {
		allImages.push(...ingredient.additionalImages)
	}
	ingredientImages.value = allImages
	currentImageIndex.value = 0
	
	// 立即阻止页面滚动（在弹窗打开之前）
	// #ifdef H5
	if (typeof document !== 'undefined') {
		document.body.style.overflow = 'hidden'
		document.body.style.position = 'fixed'
		document.body.style.width = '100%'
		document.body.style.top = `-${savedScrollTop.value}px`
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 微信小程序使用页面级别的滚动控制
	uni.pageScrollTo({
		scrollTop: savedScrollTop.value,
		duration: 0
	})
	// #endif
	
	// 延迟打开弹窗，确保状态已更新
	nextTick(() => {
		// 再次确认滚动位置（防止在 nextTick 期间发生变化）
		const query2 = uni.createSelectorQuery()
		query2.select('.content-wrapper').scrollOffset()
		query2.exec((res2) => {
			if (res2[0] && !savedScrollTop.value) {
				savedScrollTop.value = res2[0].scrollTop || 0
			}
			ingredientPopup.value.open()
		})
	})
	}
	function handleFlourTimelineImageClick({ allImages, currentIndex }) {
        uni.previewImage({
		current: currentIndex,
		urls: allImages
	})
	}
	function handleMeatTimelineImageClick({ allImages, currentIndex }) {
        uni.previewImage({
		current: currentIndex,
		urls: allImages
	})
	}
</script>

<style>
	/* #ifndef APP-NVUE */
	page {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		background-color: #fff;
		min-height: 100%;
		height: auto;
	}
	view {
		font-size: 14px;
		line-height: inherit;
	}
	.example-body {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0;
		font-size: 14px;
		background-color: #ffffff;
	}
	/* #endif */
	
	.section-box{
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 20rpx;
	}
	.decoration{
		width: 4px;
		height: 12px;
		border-radius: 10px;
		background-color: #2979ff;
	}
	.section-text{
		color: #333;
		margin-left: 15rpx;
	}

	/* #ifdef APP-NVUE */
	.warp {
		background-color: #fff;
	}
	/* #endif */

	.example-body {
		flex-direction: column;
		padding: 15px;
		background-color: #ffffff;
	}

	.image {
		width: 50rpx;
		height: 50rpx;
	}
	
	.big-number{
		font-size: 50rpx;
		font-weight: 700;
		font-stretch: condensed;
		font-style:oblique;
	}
	
	.text {
		text-align: center;
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.example-body {
		/* #ifndef APP-NVUE */
		display: block;
		/* #endif */
	}

	.grid-item-box {
		flex: 1;
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
	}

	.banner-image {
		width: 100%;
		height: 400rpx;
	}

	.swiper-box {
		height: 400rpx;
	}

	.search-icons {
		padding: 16rpx;
	}

	.search-container-bar {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: center;
		align-items: center;
		position: fixed;
		left: 0;
		right: 0;
		z-index: 10;
		background-color: #fff;
	}

	/* #ifndef APP-NVUE || VUE3*/
	::v-deep
	/* #endif */
	.uni-searchbar__box {
		border-width: 0;
	}

	/* #ifndef APP-NVUE || VUE3 */
	::v-deep
	/* #endif */
	.uni-input-placeholder {
		font-size: 28rpx;
	}

	.home-container {
		background: #f8f9fa;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}
	.banner-image {
		width: 100%;
		height: 180px;
		border-radius: 12px;
		margin-bottom: 16px;
	}
	.swiper-box {
		height: 180px;
		border-radius: 12px;
		overflow: hidden;
	}
	.section {
		margin: 16px 0;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		padding: 16px;
	}
	.section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}
	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: #333;
	}
	.update-time {
		margin-left: auto;
		font-size: 12px;
		color: #999;
	}
	.ingredients-scroll {
		width: 100%;
		overflow-x: auto;
		white-space: nowrap;
	}
	.ingredients-container {
		display: flex;
		gap: 12px;
	}
	.grid-item-box {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
	}
	.big-number {
		font-size: 32px;
		font-weight: 700;
		color: #007aff;
	}
	.text {
		text-align: center;
		font-size: 16px;
		margin-top: 6px;
	}
</style> 