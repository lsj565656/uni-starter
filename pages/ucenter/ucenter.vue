<template>
	<view class="center">
		<uni-sign-in ref="signIn"></uni-sign-in>
		<view class="userInfo" @click.capture="toUserInfo">
			<cloud-image width="150rpx" height="150rpx" v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url" :src="userInfo.avatar_file.url"></cloud-image>
			
			<view v-else class="defaultAvatarUrl">
				<uni-icons color="#ffffff" size="50" type="person-filled" />
			</view>
			
			<view class="logo-title">
				<text class="uer-name" v-if="hasLogin">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</text>
				<text class="uer-name" v-else>{{$t('mine.notLogged')}}</text>
			</view>
		</view>
		<uni-grid class="home" :column="4" :showBorder="false" :square="true">
			<uni-grid-item class="item" v-for="(item,index) in homeList" @click.native="tapHome(index)" :key="index">
				<uni-icons class="icon" color="#007AFF" :type="item.icon" size="26"></uni-icons>
				<text class="text">{{item.text}}</text>
			</uni-grid-item>
		</uni-grid>
		<uni-list class="center-list" v-for="(sublist , index) in ucenterList" :key="index">
			<uni-list-item v-for="(item,i) in sublist" :title="item.title" link :rightText="item.rightText" :key="i"
				:clickable="true" :to="item.to" @click="ucenterListClick(item)" :show-extra-icon="true"
				:extraIcon="{type:item.icon,color:'#999'}">
				<template v-slot:footer>
					<view v-if="item.showBadge" class="item-footer">
						<text class="item-footer-text">{{item.rightText}}</text>
						<view class="item-footer-badge"></view>
					</view>
				</template>
			</uni-list-item>
		</uni-list>
	</view>
</template>

<script>
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
	import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';
	// #ifdef APP
	import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
	const uniShare = new UniShare()
	// #endif
	const db = uniCloud.database();
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		// #ifdef APP
		onBackPress({from}) {
			if(from=='backbutton'){
				this.$nextTick(function(){
					uniShare.hide()
				})
				return uniShare.isShow;
			}
		},
		// #endif
		data() {
			return {
				homeList: [{
						"text": this.$t('mine.showText'),
						"icon": "chat"
					},
					{
						"text": this.$t('mine.showText'),
						"icon": "cloud-upload"
					},
					{
						"text": this.$t('mine.showText'),
						"icon": "contact"
					},
					{
						"text": this.$t('mine.showText'),
						"icon": "download"
					}
				],
				ucenterList: [
					[
						// #ifdef APP-PLUS
						{
							"title": this.$t('mine.signInByAd'),
							"event": 'signInByAd',
							"icon": "compose"
						},
						// #endif
						{
							"title": this.$t('mine.signIn'),
							"event": 'signIn',
							"icon": "compose"
						},
						// #ifdef APP-PLUS
						{
							"title": this.$t('mine.toEvaluate'),
							"event": 'gotoMarket',
							"icon": "star"
						},
						//#endif
						{
							"title":this.$t('mine.readArticles'),
							"to": '/pages/ucenter/read-news-log/read-news-log',
							"icon": "flag"
						},
						{
							"title": this.$t('mine.myScore'),
							"to": '',
							"event": 'getScore',
							"icon": "paperplane"
						}
						// #ifdef APP
						, {
							"title": this.$t('mine.invite'),
							"event": 'share',
							"icon": "redo"
						}
						// #endif
					],
					[{
						"title": this.$t('mine.feedback'),
						"to": '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback',
						"icon": "help"
					}, {
						"title": this.$t('mine.settings'),
						"to": '/pages/ucenter/settings/settings',
						"icon": "gear"
					}],
					// #ifdef APP
					[{
						"title": this.$t('mine.about'),
						"to": '/pages/ucenter/about/about',
						"icon": "info"
					}]
					// #endif
				],
				listStyles: {
					"height": "150rpx", // 边框高度
					"width": "150rpx", // 边框宽度
					"border": { // 如果为 Boolean 值，可以控制边框显示与否
						"color": "#eee", // 边框颜色
						"width": "1px", // 边框宽度
						"style": "solid", // 边框样式
						"radius": "100%" // 边框圆角，支持百分比
					}
				}
			}
		},
		onLoad() {
			//#ifdef APP-PLUS
			this.ucenterList[this.ucenterList.length - 2].unshift({
				title:this.$t('mine.checkUpdate'),// this.this.$t('mine.checkUpdate')"检查更新"
				rightText: this.appVersion.version + '-' + this.appVersion.versionCode,
				event: 'checkVersion',
				icon: 'loop',
				showBadge: this.appVersion.hasNew
			})
			//#endif
		},
		onShow() {},
		computed: {
			userInfo() {
				return store.userInfo
			},
			hasLogin(){
				return store.hasLogin
			},
			// #ifdef APP-PLUS
			appVersion() {
				return getApp().appVersion
			},
			// #endif
			appConfig() {
				return getApp().globalData.config
			}
		},
		methods: {
			toSettings() {
				uni.navigateTo({
					url: "/pages/ucenter/settings/settings"
				})
			},
			signIn() { //普通签到
				this.$refs.signIn.open()
			},
			signInByAd(){ //看激励视频广告签到
				this.$refs.signIn.showRewardedVideoAd()
			},
			/**
			 * 个人中心项目列表点击事件
			 */
			ucenterListClick(item) {
				if (!item.to && item.event) {
					this[item.event]();
				}
			},
			async checkVersion() {
				let res = await callCheckVersion()
				console.log(res);
				if (res.result.code > 0) {
					checkUpdate()
				} else {
					uni.showToast({
						title: res.result.message,
						icon: 'none'
					});
				}
			},
			toUserInfo() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
				})
			},
			tapHome(index) {
				uni.showToast({
					// title: '你点击了，第' + (index + 1) + '个',
					title: this.$t('mine.clicked') + " " + (index + 1) ,
					icon: 'none'
				});
			},
			/**
			 * 去应用市场评分
			 */
			gotoMarket() {
				// #ifdef APP-PLUS
				if (uni.getSystemInfoSync().platform == "ios") {
					// 这里填写appstore应用id
					let appstoreid = this.appConfig.marketId.ios; // 'id1417078253';
					console.log({appstoreid});
					plus.runtime.openURL("itms-apps://" + 'itunes.apple.com/cn/app/wechat/' + appstoreid + '?mt=8',err=>{
						console.log('plus.runtime.openURL err:' + JSON.stringify(err));
					});
				}
				if (uni.getSystemInfoSync().platform == "android") {
					var Uri = plus.android.importClass("android.net.Uri");
					var uri = Uri.parse("market://details?id=" + this.appConfig.marketId.android);
					var Intent = plus.android.importClass('android.content.Intent');
					var intent = new Intent(Intent.ACTION_VIEW, uri);
					var main = plus.android.runtimeMainActivity();
					main.startActivity(intent);
				}
				// #endif
			},
			/**
			 * 获取积分信息
			 */
			getScore() {
				if (!this.userInfo) return uni.showToast({
					title: this.$t('mine.checkScore'),
					icon: 'none'
				});
				uni.showLoading({
					mask: true
				})
				db.collection("uni-id-scores")
					.where('"user_id" == $env.uid')
					.field('score,balance')
					.orderBy("create_date", "desc")
					.limit(1)
					.get()
					.then((res) => {
						console.log(res);
						const data = res.result.data[0];
						let msg = '';
						msg = data ? (this.$t('mine.currentScore')+ data.balance) : this.$t('mine.noScore');
						uni.showToast({
							title: msg,
							icon: 'none'
						});
					}).finally(()=>{
						uni.hideLoading()
					})
			},
			async share() {
				let {result} = await db.collection('uni-id-users').where("'_id' == $cloudEnv_uid").field('my_invite_code').get()
				let myInviteCode = result.data[0].my_invite_code
				if(!myInviteCode){
					return uni.showToast({
						title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
						icon: 'none'
					});
				}
				console.log({myInviteCode});
				let {
					appName,
					logo,
					company,
					slogan
				} = this.appConfig.about
				// #ifdef APP
				uniShare.show({
					content: { //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
						type: 0,
						href: this.appConfig.h5.url +
							`/#/pages/ucenter/invite/invite?code=uniInvitationCode:${myInviteCode}`,
						title: appName,
						summary: slogan,
						imageUrl: logo +
							'?x-oss-process=image/resize,m_fill,h_100,w_100' //压缩图片解决，在ios端分享图过大导致的图片失效问题
					},
					menus: [{
							"img": "/static/app/sharemenu/wechatfriend.png",
							"text": this.$t('common.wechatFriends'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneSession"
							}
						},
						{
							"img": "/static/app/sharemenu/wechatmoments.png",
							"text": this.$t('common.wechatBbs'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneTimeline"
							}
						},
						{
							"img": "/static/app/sharemenu/weibo.png",
							"text": this.$t('common.weibo'),
							"share": {
								"provider": "sinaweibo"
							}
						},
						{
							"img": "/static/app/sharemenu/qq.png",
							"text": "QQ",
							"share": {
								"provider": "qq"
							}
						},
						{
							"img": "/static/app/sharemenu/copyurl.png",
							"text": this.$t('common.copy'),
							"share": "copyurl"
						},
						{
							"img": "/static/app/sharemenu/more.png",
							"text": this.$t('common.more'),
							"share": "shareSystem"
						}
					],
					cancelText: this.$t('common.cancelShare'),
				}, e => { //callback
					console.log(e);
				})
				// #endif
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	page {
		background-color: #f8f8f8;
	}
	/* #endif*/
	
	.center {
		flex: 1;
		flex-direction: column;
		background-color: #f8f8f8;
	}

	.userInfo {
		padding-top: 60px;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAADICAIAAACRe4S/AAABPGlDQ1BVMzJKNTl4AAAoz2NgYBJILCjIYWFgYMjNKykKcndSiIiMUmB/ysDKwMXAz6DMoJKYXFzgGBDgA1TCAKNRwbdrDIwg+rIuyKxzl+t6+57Yb85J9Vxm3+gxlQE/4EpJLU4G0n+AOCm5oKiEgYExAchWLi8pALFbgGyRIqCjgOwZIHY6hL0GxE6CsA+A1YQEOQPZV4BsgeSMxBQg+wmQrZOEJJ6OxIbaCwIcocZGXqaWFQzUBiWpFSUg2jm/oLIoMz2jRMERGEKpCp55yXo6CkYGRoYMDKDwhqj+fAMcjoxiHAixlikMDNZvgQxbhJhXLAPDZl4GBp6FCDH1pwwMgmwMDMf8ChKLEuEOYPzGUpxmbARhc29nYGCd9v//53AGBnZNBoa/1////739//+/yxgYmG8xMBz4BgA7el7ZKsa31QAAAAlwSFlzAAALiQAAC4kBN8nLrQAACiVpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ4IDc5LjE2NDAzNiwgMjAxOS8wOC8xMy0wMTowNjo1NyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMS0wNS0xMFQxNTo0MDoxNSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjMtMDEtMjlUMTk6MzI6MjYrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDEtMjlUMTk6MzI6MjYrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iVTMySjU5eCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmOWQ1ODk4ZC04ZThlLTc3NDgtOTVhZS0zZjQ3NmQ1NTFhMjgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo5YjQ3MDdmOC1kZDgwLWExNGMtOTQxMy1kYmM4MDk5ODNhZWMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0NDMwZGIxOS0xNTg1LTQzOTktOWViMy1jZWY1MTJlNDIyMmMiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6OWI0NzA3ZjgtZGQ4MC1hMTRjLTk0MTMtZGJjODA5OTgzYWVjPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NDQzMGRiMTktMTU4NS00Mzk5LTllYjMtY2VmNTEyZTQyMjJjIiBzdEV2dDp3aGVuPSIyMDIxLTA1LTEwVDE1OjQwOjE1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjlkOTIxM2MtYjYyNi00MWNlLTlkMDctYjI0Y2JhOTllYzkwIiBzdEV2dDp3aGVuPSIyMDIxLTA1LTEwVDE1OjQzOjE0KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NTMzYTIwOWUtOTA4MS00Nzk2LTk4NmMtNTE4NWZlNjMyMzIwIiBzdEV2dDp3aGVuPSIyMDIxLTA1LTEwVDE1OjQzOjE0KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZjlkNTg5OGQtOGU4ZS03NzQ4LTk1YWUtM2Y0NzZkNTUxYTI4IiBzdEV2dDp3aGVuPSIyMDIzLTAxLTI5VDE5OjMyOjI2KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rv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');
		flex-direction: column;
		align-items: center;
	}
	.defaultAvatarUrl{
		width: 150rpx;
		height: 150rpx;
		background-color: #007aff;
		border-radius: 100%;
		justify-content: center;
		align-items: center;
	}

	.logo-title {
		flex: 1;
		align-items: center;
		justify-content: space-between;
		flex-direction: row;
	}

	.uer-name {
		height: 100rpx;
		line-height: 100rpx;
		font-size: 38rpx;
		color: #FFFFFF;
	}

	.center-list {
		margin-bottom: 30rpx;
		background-color: #f9f9f9;
	}

	.center-list-cell {
		width: 750rpx;
		background-color: #007AFF;
		height: 40rpx;
	}

	.home {
		background-color: #FFFFFF;
		margin-bottom: 6px;
	}

	.uni-grid .text {
		font-size: 16px;
		height: 25px;
		line-height: 25px;
		color: #817f82;
	}

	.uni-grid .item ::v-deep .uni-grid-item__box {
		justify-content: center;
		align-items: center;
	}


	/*修改边线粗细示例*/
	/* #ifndef APP-NVUE */
	.center-list ::v-deep .uni-list--border:after {
		-webkit-transform: scaleY(0.2);
		transform: scaleY(0.2);
		margin-left: 80rpx;
	}

	.center-list ::v-deep .uni-list--border-top,
	.center-list ::v-deep .uni-list--border-bottom {
		display: none;
	}

	/* #endif */
	.item-footer {
		flex-direction: row;
		align-items: center;
	}

	.item-footer-text {
		color: #999;
		font-size: 24rpx;
		padding-right: 10rpx;
	}

	.item-footer-badge {
		width: 20rpx;
		height: 20rpx;
		/* #ifndef APP-NVUE */
		border-radius: 50%;
		/* #endif */
		/* #ifdef APP-NVUE */
		border-radius: 10rpx;
		/* #endif */
		background-color: #DD524D;
	}
</style>
