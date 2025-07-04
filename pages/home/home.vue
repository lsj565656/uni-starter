<template>
	<view class="home-container">
		<!-- #ifdef APP -->
		<statusBar></statusBar>
		<!-- #endif -->

		<!-- #ifdef MP-WEIXIN -->
		<!-- 微信 自定义导航栏 -->
		<view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				<view class="nav-title">首页</view>
			</view>
		</view>
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

				<!-- 宫格功能区 -->
		<view class="section">
			<!-- <uni-title type="h2" title="快捷功能" align="left" /> -->
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
		<view class="section" id="ingredients-section">
			<view class="section-header">
				<view class="section-title">
					<uni-icons type="shop" size="20" color="#007aff" />
					<text>新鲜食材</text>
				</view>
				<view class="section-actions">
					<text class="update-time">{{ ingredientsUpdateTime }}</text>
					<uni-icons type="refresh" size="16" color="#666" @click="refreshIngredients"></uni-icons>
				</view>
			</view>
			<scroll-view class="ingredients-scroll"
			:class="{ 'scrolled-left': isIngredientsScrolledLeft }"
			scroll-x show-scrollbar="false"
			@scroll="handleIngredientsScroll"
			>
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
		<view class="section" id="flour-process-section">
			<view class="section-header">
				<uni-icons type="gear" size="20" color="#007aff" />
				<text class="section-title">面食制作</text>
				<view class="timeline-mode-switch">
					<uni-icons
						custom-prefix="iconfont"
						type="icon-align-text-center"
						:color="flourTimelineMode === 'tree' ? '#007aff' : '#bbb'"
						size="22"
						@click="flourTimelineMode = 'tree'"
						class="mode-icon"
					/>
					<uni-icons
						custom-prefix="iconfont"
						type="icon-wenzijuzuo"
						:color="flourTimelineMode === 'vertical' ? '#007aff' : '#bbb'"
						size="22"
						@click="flourTimelineMode = 'vertical'"
						class="mode-icon"
					/>
				</view>
				<view class="section-actions">
					<text class="update-time">{{ processUpdateTime }}</text>
					<uni-icons
						type="refresh"
						size="16"
						color="#666"
						@click="refreshProcess"
					/>
				</view>
			</view>
			<timeline
				:steps="flourProcessSteps"
				:current-step="currentFlourStep"
				:process-data="flourProcess"
				:mode="flourTimelineMode"
				@image-click="handleFlourTimelineImageClick"
			/>
		</view>

		<!-- 卤肉制作流程 -->
		<view id="meat-process" class="section">
			<view class="section-header">
				<uni-icons type="fire" size="20" color="#007aff" />
				<text class="section-title">卤肉制作</text>
				<view class="timeline-mode-switch">
					<uni-icons
						custom-prefix="iconfont"
						type="icon-align-text-center"
						:color="meatTimelineMode === 'tree' ? '#007aff' : '#bbb'"
						size="22"
						@click="meatTimelineMode = 'tree'"
						class="mode-icon"
					/>
					<uni-icons
						custom-prefix="iconfont"
						type="icon-wenzijuzuo"
						:color="meatTimelineMode === 'vertical' ? '#007aff' : '#bbb'"
						size="22"
						@click="meatTimelineMode = 'vertical'"
						class="mode-icon"
					/>
				</view>
				<view class="section-actions">
					<text class="update-time">{{ processUpdateTime }}</text>
					<uni-icons
						type="refresh"
						size="16"
						color="#666"
						@click="refreshProcess"
					/>
				</view>
			</view>
			<timeline
				:steps="meatProcessSteps"
				:current-step="currentMeatStep"
				:process-data="meatProcess"
				:mode="meatTimelineMode"
				@image-click="handleMeatTimelineImageClick"
			/>
		</view>
	</view>
	
	<!-- 食材详情弹窗 -->
	<uni-popup
		ref="ingredientPopup"
		type="center"
		:animation="true"
		:is-mask-click="true"
		@change="onIngredientPopupChange"
	>
		<view class="ingredient-popup">
			<view class="ingredient-popup-header">
				<text class="ingredient-popup-title">{{ currentIngredient?.name }}</text>
			</view>
			<view class="ingredient-popup-content">
				<!-- 图片轮播 -->
				<view class="ingredient-images">
					<swiper
						class="ingredient-swiper"
						:indicator-dots="ingredientImages.length > 1"
						:autoplay="false"
						indicator-color="rgba(255,255,255,0.3)"
						indicator-active-color="#fff"
						@change="onImageSwiperChange"
					>
						<swiper-item v-for="(image, index) in ingredientImages" :key="index">
							<image
								class="ingredient-image"
								:src="image"
								mode="aspectFill"
								@click="previewImage(index)"
							/>
						</swiper-item>
					</swiper>
					<!-- 图片计数器 -->
					<view class="image-counter" v-if="ingredientImages.length > 1">
						<text>{{ currentImageIndex + 1 }} / {{ ingredientImages.length }}</text>
					</view>
				</view>
				<!-- 食材描述 -->
				<view class="ingredient-description">
					<text>{{ currentIngredient?.description }}</text>
				</view>
			</view>
		</view>
	</uni-popup>
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
	const current = ref(0)
	const homeList = ref(['食材展示', '制作流程', '热门兑换', '我的订单', '用户评价', '管理后台'])
	const hasLogin = ref(false)

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

	// 食材弹窗相关变量
	const ingredientPopup = ref(null)
	const currentIngredient = ref(null)
	const ingredientImages = ref([])
	const currentImageIndex = ref(0)
	const savedScrollTop = ref(0)

	// 时间线模式切换
	const flourTimelineMode = ref('tree')
	const meatTimelineMode = ref('tree')

	const onIngredientPopupChange = (e) => {
		if (e.type === 'hide') {
			isIngredientPopupOpen.value = false
			showNavFab.value = false
			
			// 恢复页面滚动状态
			// #ifdef H5
			if (typeof document !== 'undefined') {
				document.body.style.overflow = ''
				document.body.style.position = ''
				document.body.style.width = ''
				document.body.style.top = ''
			}
			// #endif
			
			// 使用更可靠的方式恢复滚动位置
			nextTick(() => {
				if (savedScrollTop.value > 0) {
					// 使用 requestAnimationFrame 确保在下一帧执行
					requestAnimationFrame(() => {
						uni.pageScrollTo({
							scrollTop: savedScrollTop.value,
							duration: 0
						})
					})
				}
			})
		} else if (e.type === 'show') {
			// 弹窗显示时的逻辑已经在 showIngredientDetail 中处理
		}
	}

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
				uni.showToast({ title: '食材已更新', icon: 'success' })
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
	function callPhone() {
        uni.makePhoneCall({
            phoneNumber: phone.value,
            success: () => { console.log('拨打电话成功') },
            fail: (err) => {
                console.error('拨打电话失败：', err)
                uni.showToast({ title: '拨打电话失败', icon: 'none' })
            }
        })
    }
	function showIngredientDetail(ingredient) {
		currentIngredient.value = ingredient;
		const allImages = [ingredient.image];
		if (ingredient.additionalImages && ingredient.additionalImages.length > 0) {
			allImages.push(...ingredient.additionalImages);
		}
		ingredientImages.value = allImages;
		currentImageIndex.value = 0;
		nextTick(() => {
			if (ingredientPopup.value) ingredientPopup.value.open();
		});
	}
	function onImageSwiperChange(e) {
		currentImageIndex.value = e.detail.current
	}
	function previewImage(index) {
		uni.previewImage({ current: index, urls: ingredientImages.value })
	}
	function handleFlourTimelineImageClick({ allImages, currentIndex }) {
		console.log('点击了面图片', allImages, currentIndex)
        uni.previewImage({
		current: currentIndex,
		urls: allImages
	})
	}
	function handleMeatTimelineImageClick({ allImages, currentIndex }) {
		console.log('点击了肉图片', allImages, currentIndex)
        uni.previewImage({
		current: currentIndex,
		urls: allImages
	})
	}

	// Banner相关方法
	function changeSwiper(e) {
		current.value = e.detail.current
	}

	function clickBannerItem(item) {
		console.log('点击了banner:', item)
		// 可以在这里添加banner点击逻辑
	}

	// 宫格功能相关方法
	function change(e) {
		const index = e.detail.index
		const item = homeList.value[index]
		if (index === 0) {
			// 食材展示
			// #ifdef H5
			if (typeof document !== 'undefined') {
				const el = document.getElementById('ingredients-section')
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', block: 'start' })
				}
			}
			// #endif
			// #ifndef H5
			uni.pageScrollTo({
				selector: '#ingredients-section',
				duration: 300
			})
			// #endif
			return
		}
		if (index === 1) {
			// 制作流程
			// #ifdef H5
			if (typeof document !== 'undefined') {
				const el = document.getElementById('flour-process-section')
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', block: 'start' })
				}
			}
			// #endif
			// #ifndef H5
			uni.pageScrollTo({
				selector: '#flour-process-section',
				duration: 300
			})
			// #endif
			return
		}
		if (index === 2) {
			// 热门兑换
			uni.switchTab({
				url: '/pages/list/list',
				success() {
					uni.setStorageSync('listTabCategory', '娱乐')
				}
			})
			return
		}
		// 其它功能...
		uni.showToast({ title: item + '功能', icon: 'none' })
	}

	const isIngredientsScrolledLeft = ref(false)
	const processUpdateTime = ref('12-01 14:30')

	function refreshProcess() {
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
				processUpdateTime.value = `${month}-${day} ${hour}:${minute}`
				uni.showToast({ title: '流程已更新', icon: 'success' })
			} else {
				uni.showToast({ title: '已是最新', icon: 'none' })
			}
		}, 1000)
	}
</script>

<style>
	.custom-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
	}

	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 40rpx;
		height: 88rpx;
	}

	.nav-content .logo {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
	}

	.nav-content .nav-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		flex: 1;
		text-align: center;
		margin: 0 20rpx;
	}
	
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
		padding-bottom: 10rpx;
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
		margin: 10px 0;
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

	.timeline-mode-switch {
		display: flex;
		align-items: center;
		margin-left: 12px;
		.mode-icon {
			margin-left: 8px;
			cursor: pointer;
			transition: color 0.2s;
		}
	}

	/* 食材详情弹窗样式 */
	.ingredient-popup {
		background-color: #fff;
		border-radius: 20rpx;
		width: 90vw;
		max-width: 600rpx;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
	}

	.ingredient-popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 40rpx 20rpx 40rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.ingredient-popup-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
	}

	.close-icon {
		padding: 10rpx;
		cursor: pointer;
		transition: opacity 0.2s;
		
		&:active {
			opacity: 0.6;
		}
	}

	.ingredient-popup-content {
		padding: 0 40rpx 40rpx 40rpx;
	}

	.ingredient-images {
		width: 100%;
		margin-bottom: 30rpx;
		position: relative;
	}

	.ingredient-swiper {
		width: 100%;
		height: 400rpx;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	}

	.ingredient-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 16rpx;
		transition: transform 0.3s ease;
		
		&:active {
			transform: scale(0.98);
		}
	}

	.image-counter {
		position: absolute;
		bottom: 20rpx;
		right: 20rpx;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		backdrop-filter: blur(10rpx);
	}

	.ingredient-description {
		text-align: left;
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		padding: 20rpx 0;
	}

	/* 弹窗打开时锁定页面滚动 */
	.popup-open {
		overflow: hidden !important;
		touch-action: none !important;
		overscroll-behavior: none !important;
	}
	.popup-open .content-wrapper {
		overflow: hidden !important;
		touch-action: none !important;
		overscroll-behavior: none !important;
	}
</style> 