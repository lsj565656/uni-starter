<template>
	<!--
	 本页面模板教程：https://ext.dcloud.net.cn/plugin?id=2717
	 uni-list 文档：https://ext.dcloud.net.cn/plugin?id=24
	 uniCloud 文档：https://uniapp.dcloud.io/uniCloud/README
	 unicloud-db 组件文档：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db-component
	 DB Schema 规范：https://uniapp.dcloud.net.cn/uniCloud/schema
	 -->
	<view class="detail-container">
		<!-- #ifdef APP-PLUS -->
		<uni-nav-bar :statusBar="true" :border="false"></uni-nav-bar>
		<!-- #endif -->
		
		<unicloud-db v-slot:default="{data, loading, error, options}" :options="formData" :collection="colList"
			:getone="true" :manual="true" ref="detail"
			foreignKey="opendb-news-articles.user_id" @load="loadData">
			<template v-if="!loading && data">
				<!-- 商品图片轮播 -->
				<swiper
					class="product-swiper"
					:indicator-dots="true"
					:autoplay="true"
					:interval="3000"
					:duration="500"
					circular
				>
					<swiper-item>
						<image
							class="swiper-image"
							:src="data.avatar"
							mode="aspectFill"
							:lazy-load="true"
						></image>
					</swiper-item>
				</swiper>

				<!-- 商品信息 -->
				<view class="product-info card">
					<view class="product-header">
						<text class="product-name">{{ data.title }}</text>
						<text class="product-price">¥{{ data.price || 0 }}</text>
					</view>
					<view class="product-meta">
						<view class="meta-item">
							<uni-icons type="shop" size="14" color="#6C757D"></uni-icons>
							<text class="meta-text">库存: {{ data.stock || 0 }}</text>
						</view>
						<view class="meta-item">
							<uni-icons type="eye" size="14" color="#6C757D"></uni-icons>
							<text class="meta-text">月售: {{ data.monthlySales || 0 }}</text>
						</view>
					</view>
					<view class="product-desc">
						<text class="desc-title">商品描述</text>
						<text class="desc-content">{{ data.description || data.excerpt || '暂无描述' }}</text>
					</view>
					<view class="product-points-info">
						<uni-icons type="star-filled" size="18" color="#ff9800" />
						<text class="points-text">兑换需要 {{ (data.price || 0) * 10 }} 积分</text>
					</view>
				</view>

				<!-- 商品详情 -->
				<view class="product-detail card">
					<view class="detail-header">
						<text class="detail-title">商品详情</text>
					</view>
					<view class="detail-content">
						<view class="detail-item">
							<text class="item-label">商品名称</text>
							<text class="item-value">{{ data.title }}</text>
						</view>
						<view class="detail-item">
							<text class="item-label">商品规格</text>
							<text class="item-value">1份</text>
						</view>
						<view class="detail-item">
							<text class="item-label">保质期</text>
							<text class="item-value">现做现卖，建议2小时内食用</text>
						</view>
						<view class="detail-item">
							<text class="item-label">储存方式</text>
							<text class="item-value">常温保存</text>
						</view>
						<view class="detail-item">
							<text class="item-label">更新时间</text>
							<text class="item-value">
								<uni-dateformat :date="data.last_modify_date" format="yyyy-MM-dd hh:mm"
									:threshold="[60000, 2592000000]" />
							</text>
						</view>
					</view>
				</view>

				<!-- 文章内容 -->
				<view class="article-content card" v-if="data.content">
					<view class="content-header">
						<text class="content-title">详细内容</text>
					</view>
					<rich-text :nodes="data.content"></rich-text>
				</view>
			</template>
		</unicloud-db>

		<!-- 底部操作栏 -->
		<view class="action-bar">
			<view class="action-left">
				<view class="action-item" @click="navigateTo('/pages/messages/messages')">
					<uni-icons type="chat" size="24" color="#6C757D"></uni-icons>
					<text class="action-text">咨询</text>
				</view>
				<view class="action-item" @click="toggleFavorite">
					<uni-icons
						:type="isFavorite ? 'heart-filled' : 'heart'"
						size="24"
						:color="isFavorite ? '#FFD700' : '#6C757D'"
					></uni-icons>
					<text class="action-text">收藏</text>
				</view>
			</view>
			<view class="action-right">
				<button
					class="action-button"
					:class="{ 'button-disabled': (data && data.stock <= 0) || !data }"
					:disabled="(data && data.stock <= 0) || !data"
					@click="openRedeemPopup"
				>
					{{ data && data.stock > 0 ? '立即兑换' : '暂时缺货' }}
				</button>
			</view>
		</view>

		<!-- 兑换弹窗 -->
		<uni-popup ref="redeemPopupRef" type="center">
			<view class="redeem-popup">
				<view class="popup-header">
					<text class="popup-title">积分兑换</text>
					<uni-icons type="closeempty" size="22" color="#888" class="popup-close" @click="closeRedeemPopup" />
				</view>
				<template v-if="redeemStatus === ''">
					<text>确认使用 {{ (data && data.price ? data.price * 10 : 0) }} 积分兑换「{{ data ? data.title : '' }}」？</text>
					<view class="popup-actions">
						<button class="popup-btn cancel" @click="closeRedeemPopup">取消</button>
						<button class="popup-btn confirm-btn" @click="confirmRedeem">确认兑换</button>
					</view>
				</template>
				<template v-else-if="redeemStatus === 'success'">
					<text>兑换成功！</text>
					<view class="popup-actions">
						<button class="popup-btn confirm-btn" @click="closeRedeemPopup">关闭</button>
					</view>
				</template>
				<template v-else-if="redeemStatus === 'fail'">
					<text>兑换失败，请稍后再试。</text>
					<view class="popup-actions">
						<button class="popup-btn confirm-btn" @click="closeRedeemPopup">关闭</button>
					</view>
				</template>
				<template v-else-if="redeemStatus === 'insufficient'">
					<text>积分不足，无法兑换。</text>
					<view class="popup-actions">
						<button class="popup-btn confirm-btn" @click="closeRedeemPopup">关闭</button>
					</view>
				</template>
				<template v-else-if="redeemStatus === 'limit'">
					<text>今日已兑换过该商品，请明天再来！</text>
					<view class="popup-actions">
						<button class="popup-btn confirm-btn" @click="closeRedeemPopup">关闭</button>
					</view>
				</template>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	// #ifdef APP-PLUS
	import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
	import uniNavBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue';
	const uniShare = new UniShare()
	// #endif
	const db = uniCloud.database();
	const readNewsLog = db.collection('read-news-log')
	export default {
		// #ifdef APP-PLUS
		components:{
			"uni-nav-bar":uniNavBar
		},
		onBackPress({from}) {
			if(from == 'backbutton'){
				if(uniShare.isShow){
					this.$nextTick(function(){
						console.log(uniShare);
						uniShare.hide()
					})
				}
				return uniShare.isShow;
			}
		},
		// #endif
		data() {
			return {
				// 当前显示 _id
				id: "",
				title: 'title',
				// 数据表名
				// 查询字段，多个字段用 , 分割
				// field: 'user_id.nickname,user_id._id,avatar,excerpt,last_modify_date,comment_count,like_count,title,content,price,stock,description',
				formData: {
					noData: '<p style="text-align:center;color:#666">详情加载中...</p>'
				},
				// 收藏状态
				isFavorite: false,
				// 兑换相关
				redeemStatus: '', // '', 'success', 'fail', 'insufficient', 'limit'
				userPoints: 1000
			}
		},
		computed: {
			uniStarterConfig() {
				return getApp().globalData.config
			},
			where(){
				//拼接where条件 查询条件 ,更多详见 ：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db?id=jsquery
				return `_id =="${this.id}"`
			},
			colList(){
				return [
					db.collection('opendb-news-articles').where(this.where).field('user_id,_id,avatar,excerpt,last_modify_date,comment_count,like_count,title,content,price,stock,description').getTemp(),
					db.collection('uni-id-users').field('_id,nickname').getTemp()
				]
			}
		},
		onLoad(event) {
			//获取真实新闻id，通常 id 来自上一个页面
			if (event.id) {
				this.id = event.id
			}
			//若上一页传递了标题过来，则设置导航栏标题
			if (event.title) {
				this.title = event.title
				uni.setNavigationBarTitle({
					title: event.title
				})
			}
			
			// 初始化用户积分
			this.userPoints = this.getUserPoints()
		},
		onReady() {
			// 开始加载数据，修改 where 条件后才开始去加载 clinetDB 的数据 ，需要等组件渲染完毕后才开始执行 loadData，所以不能再 onLoad 中执行
			if (this.id) { // ID 不为空，则发起查询
				this.$refs.detail.loadData()
			} else {
				uni.showToast({
					icon: 'none',
					title: this.$t('listDetail.newsErr')
				})
			}
		},
		onNavigationBarButtonTap(event) {
			if (event.type == 'share') {
				this.shareClick();
			}
		},
		methods: {
			$log(...args){
				console.log('args',...args,this.id)
			},
			setReadNewsLog(){
				let item = {
					"article_id":this.id,
					"last_time":Date.now()
				},
				readNewsLog = uni.getStorageSync('readNewsLog')||[],
				index = -1;
				readNewsLog.forEach(({article_id},i)=>{
					if(article_id == item.article_id){
						index = i
					}
				})
				if(index === -1){
					readNewsLog.push(item)
				}else{
					readNewsLog.splice(index,1,item)
				}
				uni.setStorageSync('readNewsLog',readNewsLog)
				console.log(readNewsLog);
			},
			setFavorite() {
				if ( uniCloud.getCurrentUserInfo().tokenExpired < Date.now() ){
					return console.log('未登录用户');
				}
				let article_id = this.id,
					last_time = Date.now();
					console.log({article_id,last_time});
					readNewsLog.where(`"article_id" == "${article_id}" && "user_id"==$env.uid`)
						.update({last_time})
						.then(({result:{updated}}) => {
							console.log('updated',updated);
							if (!updated) {
								readNewsLog.add({article_id}).then(e=>{
									console.log(e);
								}).catch(err => {
									console.log(err);
								})
							}
						}).catch(err => {
							console.log(err);
						})
			},
			loadData(data) {
				//如果上一页未传递标题过来（如搜索直达详情），则从新闻详情中读取标题
				if (this.title == '' && data[0].title) {
					this.title = data[0].title
					uni.setNavigationBarTitle({
						title: data[0].title
					});

				}
				this.setReadNewsLog();
			},
			/**
			 * followClick
			 * 点击关注
			 */
			followClick() {
				uni.showToast({
					title:this.$t('listDetail.follow'),
					icon: 'none'
				});
			},
			/**
			 * shareClick
			 * 分享
			 */
			shareClick() {
				// #ifdef APP-PLUS
				uniShare.show({
					provider: "weixin",
					scene: "WXSceneSession",
					type: 0,
					href: "https://uniapp.dcloud.io/",
					title: this.title,
					summary: "uni-app 是一个使用 Vue.js 开发所有前端应用的框架",
					imageUrl: "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/36f68bf5-4c2c-4c2c-8b0c-4c2c4c2c4c2c.jpg",
					success: function (res) {
						console.log("success:" + JSON.stringify(res));
					},
					fail: function (err) {
						console.log("fail:" + JSON.stringify(err));
					}
				})
				// #endif
			},
			// 切换收藏状态
			toggleFavorite() {
				this.isFavorite = !this.isFavorite
				uni.showToast({
					title: this.isFavorite ? '已收藏' : '已取消收藏',
					icon: 'none'
				})
			},
			// 页面导航
			navigateTo(url) {
				uni.navigateTo({ url })
			},
			// 积分相关方法
			getUserPoints() {
				return parseInt(uni.getStorageSync('userPoints') || '1000', 10)
			},
			setUserPoints(points) {
				this.userPoints = points
				uni.setStorageSync('userPoints', points)
			},
			getRedemptionRecords() {
				const data = uni.getStorageSync('redemptionRecords')
				return data ? JSON.parse(data) : {}
			},
			setRedemptionRecords(records) {
				uni.setStorageSync('redemptionRecords', JSON.stringify(records))
			},
			todayStr() {
				const d = new Date()
				return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
			},
			openRedeemPopup() {
				this.redeemStatus = ''
				this.$nextTick(() => {
					if (this.$refs.redeemPopupRef) {
						this.$refs.redeemPopupRef.open()
					} else {
						console.log('redeemPopupRef is null')
					}
				})
			},
			closeRedeemPopup() {
				if (this.$refs.redeemPopupRef) {
					this.$refs.redeemPopupRef.close()
				}
				this.redeemStatus = ''
			},
			confirmRedeem() {
				const data = this.$refs.detail.dataList[0]
				if (!data) return
				const needPoints = (data.price || 0) * 10
				if (this.userPoints < needPoints) {
					this.redeemStatus = 'insufficient'
					return
				}
				const records = this.getRedemptionRecords()
				const today = this.todayStr()
				if (!records[today]) records[today] = {}
				if (records[today][data._id]) {
					this.redeemStatus = 'limit'
					return
				}
				// 0.8概率成功
				if (Math.random() < 0.8) {
					this.setUserPoints(this.userPoints - needPoints)
					records[today][data._id] = true
					this.setRedemptionRecords(records)
					this.redeemStatus = 'success'
					uni.showToast({
						title: '兑换成功！',
						icon: 'success'
					})
					// 可在此生成mock订单
				} else {
					this.redeemStatus = 'fail'
				}
			}
		}
	}
</script>

<style lang="scss">
.detail-container {
	min-height: 100vh;
	background-color: #f8f9fa;
	padding-bottom: calc(60px + env(safe-area-inset-bottom));
}

.product-swiper {
	width: 100%;
	height: 400px;
	
	.swiper-image {
		width: 100%;
		height: 100%;
	}
}

.card {
	background-color: #fff;
	margin: 12px;
	border-radius: 8px;
	padding: 16px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-info {
	.product-header {
		margin-bottom: 16px;
		
		.product-name {
			font-size: 20px;
			font-weight: 600;
			color: #333;
			margin-bottom: 8px;
		}
		
		.product-price {
			font-size: 24px;
			font-weight: 600;
			color: #ff6b6b;
		}
	}
	
	.product-meta {
		display: flex;
		margin-bottom: 16px;
		
		.meta-item {
			display: flex;
			align-items: center;
			margin-right: 24px;
			
			.meta-text {
				margin-left: 4px;
				font-size: 14px;
				color: #666;
			}
		}
	}
	
	.product-desc {
		margin-bottom: 16px;
		
		.desc-title {
			font-size: 16px;
			font-weight: 500;
			color: #333;
			margin-bottom: 8px;
		}
		
		.desc-content {
			font-size: 14px;
			color: #666;
			line-height: 1.6;
		}
	}
	
	.product-points-info {
		display: flex;
		align-items: center;
		gap: 8px;
		
		.points-text {
			color: #ff9800;
			font-size: 16px;
			font-weight: 600;
		}
	}
}

.product-detail {
	.detail-header {
		margin-bottom: 16px;
		
		.detail-title {
			font-size: 18px;
			font-weight: 500;
			color: #333;
		}
	}
	
	.detail-content {
		.detail-item {
			display: flex;
			padding: 12px 0;
			border-bottom: 1px solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.item-label {
				width: 80px;
				font-size: 14px;
				color: #666;
			}
			
			.item-value {
				flex: 1;
				font-size: 14px;
				color: #333;
			}
		}
	}
}

.article-content {
	.content-header {
		margin-bottom: 16px;
		
		.content-title {
			font-size: 18px;
			font-weight: 500;
			color: #333;
		}
	}
}

.action-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 50px;
	background-color: #fff;
	display: flex;
	align-items: center;
	padding: 0 16px;
	padding-bottom: env(safe-area-inset-bottom);
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
	
	.action-left {
		display: flex;
		margin-right: 16px;
		
		.action-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-right: 24px;
			
			.action-text {
				font-size: 12px;
				color: #666;
				margin-top: 2px;
			}
		}
	}
	
	.action-right {
		flex: 1;
		
		.action-button {
			width: 100%;
			height: 40px;
			background: linear-gradient(90deg, #ff9800, #ffc107);
			color: #fff;
			font-size: 16px;
			font-weight: 500;
			border-radius: 20px;
			display: flex;
			align-items: center;
			justify-content: center;
			border: none;
			
			&.button-disabled {
				background: #ccc;
				opacity: 0.5;
			}
		}
	}
}

.redeem-popup {
	padding: 32px 24px 24px 24px;
	background: #fff;
	border-radius: 16px;
	text-align: center;
	min-width: 260px;
	max-width: 90vw;
	
	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
		
		.popup-title {
			font-size: 18px;
			font-weight: 600;
			color: #333;
		}
		
		.popup-close {
			margin-left: 8px;
			font-size: 22px;
			cursor: pointer;
			opacity: 0.7;
			transition: opacity 0.2s;
			
			&:active {
				opacity: 0.4;
			}
		}
	}
	
	.popup-actions {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-top: 22px;
		
		.popup-btn {
			min-width: 72px;
			height: 32px;
			border-radius: 16px;
			font-size: 14px;
			font-weight: 500;
			border: none;
			outline: none;
			transition: background 0.2s;
			
			&.cancel {
				background: #f5f5f5;
				color: #888;
			}
			
			&.confirm-btn {
				background: linear-gradient(90deg, #ff9800, #ffc107);
				color: #fff;
			}
			
			&:active {
				opacity: 0.7;
			}
		}
	}
}
</style>
