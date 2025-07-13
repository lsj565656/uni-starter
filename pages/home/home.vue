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
		<swiper class="swiper-box" @change="changeSwiper" :current="current" indicator-dots>
			<swiper-item v-for="(item, index) in imageDatas" :key="item.id">
				<image class="banner-image" :src="item.image" mode="aspectFill" @click="clickBannerItem(item)"
					:draggable="false" />
			</swiper-item>
		</swiper>

		<!-- 通告消息栏 -->
		<view class="notice-section">
			<NoticeBar :notices="noticeList" background-color="#f8f9fa" @click="handleNoticeClick" />
		</view>

		<!-- 宫格功能区 -->
		<view class="section grid-section">
			<uni-swiper-dot :info="gridPages" :current="gridSwiperCurrent" mode="round" :dotsStyles="{
					backgroundColor: '#e0e6ed',
					selectedBackgroundColor: '#1976d2',
					width: 8,
					height: 8,
					selectedWidth: 24,
					border: 'none',
					selectedBorder: 'none',
					bottom: 0
				}" style="margin-top: -1px;">
				<swiper class="grid-swiper" :style="{ height: gridSwiperHeight }" :indicator-dots="false"
					:current="gridSwiperCurrent" @change="handleGridChange" circular :autoplay="false" :duration="300">
					<swiper-item v-for="(page, pageIdx) in gridPages" :key="pageIdx">
						<view class="grid-page">
							<view class="grid-row" v-for="row in currentGridRows" :key="row">
								<view class="grid-col" v-for="col in gridColumn" :key="col">
									<template v-if="page[(row-1)*gridColumn + (col-1)]">
										<view class="grid-item"
											@click="handleGridItemClick(page[(row-1)*gridColumn + (col-1)])">
											<image class="grid-item-icon"
												:src="page[(row-1)*gridColumn + (col-1)].icon || '/static/logo.png'"
												mode="aspectFit" />
											<text
												class="grid-item-text">{{ page[(row-1)*gridColumn + (col-1)].text }}</text>
										</view>
									</template>
								</view>
							</view>
						</view>
					</swiper-item>
				</swiper>
			</uni-swiper-dot>
		</view>

		<!-- 店铺信息卡片 -->
		<!-- <shop-info-card
			:store-name="storeName"
			:business-status-text="businessStatusText"
			:business-status-class="businessStatusClass"
			:business-status-icon="businessStatusIcon"
			:business-hours="businessHours"
			:address="address"
			:phone="phone"
			@address-click="openMap"
			@phone-click="makePhoneCall"
		/> -->

		<!-- 热门任务瀑布流区块 -->
		<view class="section hot-tasks-section">
			<view class="section-header">
				<uni-icons type="fire" size="20" color="#007aff" />
				<text class="section-title">热门任务</text>
			</view>
			<unicloud-db collection="kl-tasks" :where="'isActive == true && isHot == true'"
				field="image,name,description,like_count,category,category_name,mode,score,price,joined_count,max_participants,isActive,user_id,_id,create_date,is_liked"
				:options="{ join: { 0: { leftKey: 'user_id', rightKey: '_id', from: 1, as: 'user_id', type: 'left' } } }"
				orderby="create_date desc" :page-size="5" v-slot:default="{data, loading, error}">
				<view class="masonry-scroll">
					<view class="masonry-row">
						<template v-if="!loading && data && data.length > 0">
							<view class="masonry-col" v-for="(col, colIdx) in homeHotColumnsWithMoreCard(data)"
								:key="colIdx">
								<template v-for="item in col">
									<task-card v-if="!item._isMoreCard" :key="item._id" :task="item"
										:user="getUserObj(item.user_id)" :showActions="false" @like="handleLikeTask" />
									<uni-card v-else class="masonry-card more-card"
										:style="{ minHeight: '80px', maxHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }"
										@click="goToListPage">
										<view class="more-card-content">
											<text class="more-card-text">查看更多</text>
											<uni-icons type="arrowright" color="#1976d2" style="margin-bottom: 8px;" />
										</view>
									</uni-card>
								</template>
							</view>
						</template>
						<template v-else>
							<view class="masonry-col" v-for="(col, colIdx) in homeHotColumns(data)" :key="colIdx">
								<task-card v-for="item in col" :key="item._id" :task="item"
									:user="getUserObj(item.user_id)" :showActions="false" @like="handleLikeTask" />
							</view>
						</template>
					</view>
				</view>
			</unicloud-db>
		</view>
	</view>
	<!-- 优质案例 -->
	<view class="section" id="ingredients-section">
		<view class="section-header">
			<view class="section-title">
				<uni-icons type="shop" size="20" color="#007aff" />
				<text>优质案例</text>
			</view>
			<view class="section-actions">
				<text class="update-time">{{ ingredientsUpdateTime }}</text>
				<uni-icons type="refresh" size="16" color="#666" @click="refreshIngredients"></uni-icons>
			</view>
		</view>
		<scroll-view class="ingredients-scroll" :class="{ 'scrolled-left': isIngredientsScrolledLeft }" scroll-x
			show-scrollbar="false" @scroll="handleIngredientsScroll">
			<view class="ingredients-container">
				<ingredient-card v-for="ingredient in ingredients" :key="ingredient.id" :ingredient="ingredient"
					@click="showIngredientDetail(ingredient)" />
			</view>
		</scroll-view>
	</view>

	<!-- 优质案例弹窗 -->
	<uni-popup ref="ingredientPopup" type="center" :animation="true" :is-mask-click="true"
		@change="onIngredientPopupChange">
		<view class="ingredient-popup">
			<view class="ingredient-popup-header">
				<text class="ingredient-popup-title">{{ currentIngredient?.title }}</text>
			</view>
			<view class="ingredient-popup-publisher" v-if="currentIngredient?.publisher">
				<image class="publisher-avatar" :src="currentIngredient.publisher.avatar" />
				<text class="publisher-name">{{ currentIngredient.publisher.name }}</text>
			</view>
			<view class="ingredient-popup-content">
				<!-- 图片轮播 -->
				<view class="ingredient-images">
					<swiper class="ingredient-swiper" :indicator-dots="ingredientImages.length > 1" :autoplay="false"
						indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#fff"
						@change="onImageSwiperChange">
						<swiper-item v-for="(image, index) in ingredientImages" :key="index">
							<image class="ingredient-image-fixed" :src="image" mode="aspectFill"
								@click="previewImage(index)" />
						</swiper-item>
					</swiper>
					<!-- 图片计数器 -->
					<view class="image-counter" v-if="ingredientImages.length >= 1">
						<text>{{ currentImageIndex + 1 }} / {{ ingredientImages.length }}</text>
					</view>
				</view>
				<!-- 任务描述 -->
				<view class="ingredient-description">
					<text>{{ currentIngredient?.description }}</text>
				</view>
				<!-- 评论区 -->
				<view class="ingredient-comment" v-if="currentComment">
					<view class="comment-user">
						<image class="comment-avatar" :src="currentComment.user.avatar" />
						<text class="comment-username">{{ currentComment.user.name }}</text>
					</view>
					<view class="comment-content">{{ currentComment.content }}</view>
					<view class="comment-tags">
						<uni-badge v-for="tag in currentComment.tags" :key="tag" :text="tag" type="primary" size="small"
							:inverted="true" />
					</view>
				</view>
			</view>
		</view>
	</uni-popup>
	<!-- 玩法技巧 -->
	<view class="section" id="flour-process-section">
		<view class="section-header">
			<uni-icons type="gear" size="20" color="#007aff" />
			<text class="section-title">玩法技巧</text>
			<view class="timeline-mode-switch">
				<uni-icons custom-prefix="iconfont" type="icon-align-text-center"
					:color="flourTimelineMode === 'tree' ? '#007aff' : '#bbb'" size="22"
					@click="flourTimelineMode = 'tree'" class="mode-icon" />
				<uni-icons custom-prefix="iconfont" type="icon-wenzijuzuo"
					:color="flourTimelineMode === 'vertical' ? '#007aff' : '#bbb'" size="22"
					@click="flourTimelineMode = 'vertical'" class="mode-icon" />
			</view>
			<view class="section-actions">
				<text class="update-time">{{ processUpdateTime }}</text>
				<uni-icons type="refresh" size="16" color="#666" @click="refreshProcess" />
			</view>
		</view>
		<timeline :process-data="flourProcess" :mode="flourTimelineMode" @image-click="handleFlourTimelineImageClick" />
	</view>
	<!-- 悬浮发布按钮和返回顶部按钮（均用uni-fab） -->
	<uni-fab
		:pattern="fabPattern"
		:content="fabContent"
		:horizontal="'right'"
		:vertical="'bottom'"
		:popMenu="true"
		:direction="'horizontal'"
		@trigger="onFabMenuClick"
	/>
</template>

<script setup>
	// #ifdef APP
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	// #endif
	import {
		ref,
		computed,
		nextTick,
		onMounted,
		onUnmounted
	} from 'vue'
	import {
		images
	} from '@/utils/images'
	import ingredientCard from '@/components/ingredient-card/ingredient-card.vue'
	import timeline from '@/components/timeline/timeline.vue'
	import shopInfoCard from '@/components/shop-info-card/shop-info-card.vue'
	import taskCard from '@/components/task-card/task-card.vue'
	import {
		ingredients
	} from '@/utils/ingredients'
	import {
		flourProcess as flourProcessData
	} from '@/utils/flourProcess'
	import {
		notices,
		getNoticeIcon,
		getNoticeColor,
		generateRandomNotice
	} from '@/utils/notices'
	import NoticeBar from '@/components/notice-bar/notice-bar.vue'
	import {
		categories
	} from '@/utils/categories'
	import uniFab from '@/uni_modules/uni-fab/components/uni-fab/uni-fab.vue'
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
	import {
		onPageScroll
	} from '@dcloudio/uni-app'

	const imageDatas = ref([{
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
	const ingredientsUpdateTime = ref('12-01 14:30')
	const flourProcess = ref(flourProcessData)

	// 通告消息相关
	const noticeList = ref([...notices])
	const currentFlourStep = ref(6)
	const currentMeatStep = ref(2)
	const storeName = ref('***餐饮店')
	const businessHours = ref('09:00-21:00')
	const address = ref('郑州市中原区煤机路与牛庄南街交叉口西120米')
	const phone = ref('13673989888')
	const current = ref(0)
	const homeList = ref(['优质案例', '玩法技巧', '热门兑换', '我的订单'])
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
	const currentComment = ref(null)
	const savedScrollTop = ref(0)

	// 时间线模式切换
	const flourTimelineMode = ref('tree')

	// 宫格分页逻辑
	const gridColumn = categories[0]?.grid_column || 3
	const gridRow = categories[0]?.grid_row || 3
	const gridPageSize = gridColumn * gridRow
	const homeGridItems = computed(() => categories.filter(c => c.use_home_grid))
	const gridPages = computed(() => {
		const pages = []
		for (let i = 0; i < homeGridItems.value.length; i += gridPageSize) {
			pages.push(homeGridItems.value.slice(i, i + gridPageSize))
		}
		return pages
	})
	const gridSwiperCurrent = ref(0)

	function handleGridChange(e) {
		gridSwiperCurrent.value = e.detail.current
	}

	function handleGridItemClick(item) {
		if (item.route) {
			uni.navigateTo({
				url: item.route
			})
		} else {
			uni.showToast({
				title: item.text,
				icon: 'none'
			})
		}
	}
	// 动态计算当前页实际行数
	const currentGridRows = computed(() => {
		const page = gridPages.value[gridSwiperCurrent.value] || []
		return Math.ceil(page.length / gridColumn)
	})
	const gridSwiperHeight = computed(() => `${currentGridRows.value * 180}rpx`)

	const onIngredientPopupChange = (e) => {
		if (e.type === 'hide') {
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

	// 刷新优质案例信息方法
	function refreshIngredients() {
		uni.showLoading({
			title: '刷新中...'
		})
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
				uni.showToast({
					title: '已更新',
					icon: 'success'
				})
			} else {
				uni.showToast({
					title: '已是最新',
					icon: 'none'
				})
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
		window.open(
			`https://uri.amap.com/marker?position=113.59211537161264,34.761829904749774&name=卤肉烧饼&address=${encodedAddress}`
			)
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
			success: () => {
				console.log('拨打电话成功')
			},
			fail: (err) => {
				console.error('拨打电话失败：', err)
				uni.showToast({
					title: '拨打电话失败',
					icon: 'none'
				})
			}
		})
	}

	function showIngredientDetail(ingredient) {
		currentIngredient.value = ingredient;
		// 图片和评论一一对应，取每条 afterComments 的第一张图片，没有则用默认图
		const imgs = (ingredient.afterComments || []).map(c => (c.images && c.images.length ? c.images[0] :
			'/static/logo.png'))
		ingredientImages.value = imgs.length ? imgs : ['/static/logo.png']
		currentImageIndex.value = 0
		currentComment.value = (ingredient.afterComments && ingredient.afterComments[0]) || null
		nextTick(() => {
			if (ingredientPopup.value) ingredientPopup.value.open();
		});
	}

	function onImageSwiperChange(e) {
		currentImageIndex.value = e.detail.current
		if (currentIngredient.value && currentIngredient.value.afterComments) {
			currentComment.value = currentIngredient.value.afterComments[currentImageIndex.value] || null
		}
	}

	function previewImage(index) {
		uni.previewImage({
			current: index,
			urls: ingredientImages.value
		})
	}

	function handleFlourTimelineImageClick({
		allImages,
		currentIndex
	}) {
		console.log('点击了面图片', allImages, currentIndex)
		uni.previewImage({
			current: currentIndex,
			urls: allImages
		})
	}

	// 通告消息相关方法
	function addRandomNotice() {
		const newNotice = generateRandomNotice()
		noticeList.value.unshift(newNotice)
		// 保持最多20条消息
		if (noticeList.value.length > 20) {
			noticeList.value = noticeList.value.slice(0, 20)
		}
	}

	function handleNoticeClick(notice) {
		if (notice) {
			uni.showToast({
				title: `点击了：${notice.text}`,
				icon: 'none',
				duration: 2000
			})
		}
	}

	// Banner相关方法
	function changeSwiper(e) {
		current.value = e.detail.current
	}

	function clickBannerItem(item) {
		console.log('点击了banner:', item)
		// 可以在这里添加banner点击逻辑
	}

	const isIngredientsScrolledLeft = ref(false)
	const processUpdateTime = ref('12-01 14:30')

	function refreshProcess() {
		uni.showLoading({
			title: '刷新中...'
		})
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
				uni.showToast({
					title: '流程已更新',
					icon: 'success'
				})
			} else {
				uni.showToast({
					title: '已是最新',
					icon: 'none'
				})
			}
		}, 1000)
	}

	function goToTaskDetail(id) {
		uni.navigateTo({
			url: `/pages/list/detail?id=${id}`
		})
	}

	function likeTask(id) {
		uni.showToast({
			title: '点赞功能开发中',
			icon: 'none'
		})
	}

	function goToListPage() {
		// #ifdef H5 || APP-PLUS
		uni.switchTab({
			url: '/pages/list/list'
		});
		// #endif
		// #ifdef MP-WEIXIN
		uni.switchTab({
			url: '/pages/list/list'
		});
		// #endif
	}

	// 处理任务点赞
	function handleLikeTask(task) {
		uni.showToast({
			title: '点赞功能开发中',
			icon: 'none'
		});
	}

	function homeHotColumnsWithMoreCard(data) {
		const columns = [
			[],
			[]
		];
		(data || []).forEach((item, idx) => {
			columns[idx % 2].push(item);
		});
		// 找到最短列
		const minIdx = columns[0].length <= columns[1].length ? 0 : 1;
		columns[minIdx].push({
			_isMoreCard: true
		});
		return columns;
	}

	function homeHotColumns(data) {
		const columns = [
			[],
			[]
		];
		(data || []).forEach((item, idx) => {
			columns[idx % 2].push(item);
		});
		return columns;
	}

	// 在 <script setup> 内部添加 getUserObj 方法
	function getUserObj(user_id) {
		// 如果是数组且有对象，返回第一个对象
		if (Array.isArray(user_id) && user_id.length && typeof user_id[0] === 'object') {
			return user_id[0];
		}
		// 不是对象，返回 null
		return null;
	}

	// 生命周期钩子
	let addNoticeTimer = null

	onMounted(() => {
		// 每60秒添加一条新的随机通告
		addNoticeTimer = setInterval(() => {
			const newNotice = generateRandomNotice()
			noticeList.value.unshift(newNotice)
			// 保持最多20条消息
			if (noticeList.value.length > 20) {
				noticeList.value = noticeList.value.slice(0, 20)
			}
		}, 60000)
	})

	onUnmounted(() => {
		if (addNoticeTimer) {
			clearInterval(addNoticeTimer)
		}
	})

	const showBackToTop = ref(false)

	function goToPublish() {
		uni.navigateTo({
			url: '/pages/publish/publish'
		})
	}

	function scrollToTop() {
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 300
		})
	}

	// 直接注册页面滚动钩子
	onPageScroll((e) => {
		showBackToTop.value = (e.scrollTop || 0) > 300
	})

	const showFab = ref(true)
	const isAtTop = ref(true)

	// 主按钮透明，菜单项不透明
	const fabPattern = {
		backgroundColor: 'rgba(255,255,255,0.6)', // 近乎全透明
		color: '#1296db',
		icon: 'plusempty',
		buttonColor: 'rgba(255,255,255,0.6)',
		iconColor: '#1976d2',
		boxShadow: 'none'
	}

	const fabContent = [
		{
			iconPath: '/static/icons/backTop.png',
			text: '置顶',
			active: false,
			disabled: isAtTop.value // 动态禁用
		},
		{
			iconPath: '/static/icons/publish.png',
			text: '发布',
			active: false,
			disabled: false
		}
	]

	function onFabMenuClick({ index, item }) {
		if (item.text === '发布') {
			uni.navigateTo({ url: '/pages/publish/publish' })
		} else if (item.text === '置顶' && !isAtTop.value) {
			uni.pageScrollTo({ scrollTop: 0, duration: 300 })
		}
	}

	onPageScroll((e) => {
		showFab.value = true
		isAtTop.value = (e.scrollTop || 0) <= 0
		// 动态更新置顶按钮禁用状态
		fabContent[0].disabled = isAtTop.value
	})
</script>

<style scoped>
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

	.section-box {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 20rpx;
	}

	.decoration {
		width: 4px;
		height: 12px;
		border-radius: 10px;
		background-color: #2979ff;
	}

	.section-text {
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

	.big-number {
		font-size: 50rpx;
		font-weight: 700;
		font-stretch: condensed;
		font-style: oblique;
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

	/* 通告消息栏样式 */
	.notice-section {
		margin: 10px 16px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.section {
		margin: 10px 0;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
		width: 92vw;
		max-width: 600rpx;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
	}

	.ingredient-popup-header {
		display: flex;
		align-items: flex-end;
		padding: 30rpx 40rpx 0 40rpx;
		border-bottom: none;
	}

	.ingredient-popup-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
	}

	.ingredient-popup-publisher {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 40rpx 0 40rpx;
		margin-bottom: 8rpx;
	}

	.publisher-avatar {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		object-fit: cover;
	}

	.publisher-name {
		font-size: 24rpx;
		color: #666;
	}

	.ingredient-popup-content {
		padding: 0 40rpx 40rpx 40rpx;
	}

	.ingredient-image-fixed {
		width: 100%;
		height: 400rpx;
		object-fit: cover;
		border-radius: 12rpx;
		background: #f5f5f5;
	}

	.ingredient-description {
		text-align: left;
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		padding: 20rpx 0 0 0;
		margin-bottom: 10rpx;
	}

	.ingredient-comment {
		background: #f8f9fa;
		border-radius: 14rpx;
		margin: 18rpx 0 0 0;
		padding: 18rpx 18rpx 12rpx 18rpx;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.comment-user {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 4rpx;
	}

	.comment-avatar {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		object-fit: cover;
		background: #eee;
	}

	.comment-username {
		font-size: 26rpx;
		color: #1976d2;
		font-weight: 600;
	}

	.comment-content {
		font-size: 24rpx;
		color: #333;
		margin-bottom: 4rpx;
		line-height: 1.5;
		word-break: break-all;
	}

	.comment-tags {
		display: flex;
		gap: 8rpx;
		flex-wrap: wrap;
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

	.hot-tasks-section {
		margin-bottom: 16px;
	}

	.hot-tasks-scroll {
		width: 100%;
		white-space: nowrap;
		padding-bottom: 8px;
	}

	.hot-tasks-container {
		display: flex;
		flex-direction: row;
		gap: 12px;
	}

	.hot-task-item {
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		padding: 10px;
		min-width: 180px;
		max-width: 200px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.hot-task-image {
		width: 100%;
		height: 80px;
		object-fit: cover;
		border-radius: 8px;
		margin-bottom: 6px;
	}

	.hot-task-info {
		width: 100%;
	}

	.hot-task-title {
		font-size: 15px;
		font-weight: bold;
		color: #333;
		margin-bottom: 2px;
	}

	.hot-task-desc {
		font-size: 13px;
		color: #666;
		margin-bottom: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hot-task-meta {
		font-size: 12px;
		color: #f56c6c;
		margin-bottom: 4px;
	}

	.hot-task-actions {
		display: flex;
		gap: 8px;
	}

	.hot-task-btn {
		background: #f5f5f5;
		color: #1976d2;
		border: none;
		border-radius: 6px;
		padding: 2px 10px;
		font-size: 13px;
		cursor: pointer;
	}

	/* Masonry 布局样式 */
	.masonry-scroll {
		width: 100%;
		background: #f8f8f8;
	}

	.masonry-row {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-start;
		overflow-x: hidden;
		padding: 2px 0;
		box-sizing: border-box;
	}

	.masonry-col {
		width: 49%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.more-card {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		min-height: 80px !important;
		max-height: 160px !important;
		max-width: 200px;
		background: #f5f7fa;
		cursor: pointer;
	}

	.more-card-content {
		display: flex;
		flex-direction: row;
		justify-content: center;
	}

	.more-card-content .uni-icons {
		margin-bottom: 0 !important;
	}

	.more-card-text {
		font-size: 16px;
		color: #1976d2;
		font-weight: 600;
	}

	/* 宫格功能区样式补充 */
	.grid-item-box {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 15px 0;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		margin: 4px;
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

	.grid-section {
		padding: 0;
		background: transparent;
		box-shadow: none;
		margin: 10px 0 0 0;
	}

	.grid-swiper {
		width: 100%;
		/* height 由style绑定动态控制 */
		background: transparent;
	}

	.grid-page {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: transparent;
	}

	.grid-row {
		display: flex;
		flex-direction: row;
		width: 100%;
		justify-content: space-around;
		margin-bottom: 0;
	}

	.grid-col {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.grid-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		margin: 0 4px;
		background: none;
		border-radius: 12px;
		box-shadow: none;
		transition: background 0.2s;
		cursor: pointer;
	}

	.grid-item:active {
		background: #f5f5f5;
	}

	.grid-item-icon {
		width: 40px;
		height: 40px;
		margin-bottom: 6px;
		border-radius: 8px;
		background: #f8f8f8;
	}

	.grid-item-text {
		font-size: 14px;
		color: #333;
		margin-top: 2px;
		text-align: center;
	}

	/* 优化uni-swiper-dot横杠切换动画 */
	:deep(.uni-swiper__dots-long) {
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s;
	}

	/* 不再需要 .back-to-top-btn 样式，uni-fab自带圆角和阴影 */
	/* 可选：让主fab按钮点击区域也透明 */
	::v-deep .uni-fab__circle {
		background: rgba(255,255,255,0.6) !important;
		box-shadow: none !important;
	}
</style>