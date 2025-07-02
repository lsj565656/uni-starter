<template>
	<view class="pages">
		<!-- #ifndef H5 -->
		<statusBar></statusBar>
		<!-- #endif -->

		<!-- 粘性搜索+分类栏（uni-segmented-control实现） -->
		<view class="sticky-bar">
			<view class="search-row">
				<uni-segmented-control
					:current="currentCategory"
					:values="categoryNames"
					@clickItem="onCategoryChange"
					styleType="text"
					activeColor="#1976d2"
					class="custom-segmented-control"
					scrollable
					:style="{ flex: 1 }"
				/>
				<view class="search-icon-btn" @click="goToSearch">
					<uni-icons type="search" size="22" color="#4c82ff" />
				</view>
			</view>
		</view>

		<unicloud-db ref='udb' v-slot:default="{data, pagination, hasMore, loading, error, options}" @error="onqueryerror"
			collection="kl-food-products"
			:where="where"
			field="image,name,description,like_count,category,stock,price,isActive"
			:page-size="10"
			:getcount="true">
			<template v-if="setDataList(data)"></template>
			<view class="masonry-scroll">
				<view class="masonry-row">
					<view class="masonry-col" v-for="(col, colIdx) in columnsFiltered" :key="colIdx">
						<uni-card
							v-for="item in col"
							:key="item._id"
							padding="0"
							spacing="0"
							class="masonry-card"
						>
							<template v-slot:cover>
								<view class="custom-cover">
									<image class="cover-image" mode="aspectFill" :src="item.image"></image>
									<view class="cover-content">
										<text class="uni-subtitle uni-white">{{ item.name }}</text>
									</view>
								</view>
							</template>
							<uni-list>
								<uni-list-item :title="item.description || item.name || '暂无描述'" showArrow></uni-list-item>
							</uni-list>
							<view slot="actions" class="card-actions no-border">
								<view class="card-actions-item">
									<uni-icons type="shop" size="18" color="#999"></uni-icons>
									<text class="card-actions-item-text">库存: {{ item.stock ?? 0 }}</text>
								</view>
								<view class="card-actions-item" @click="actionsClick('点赞', item)">
									<uni-icons type="heart" size="18" color="#999"></uni-icons>
									<text class="card-actions-item-text">点赞</text>
								</view>
								<view class="card-actions-item" @click="actionsClick('评论', item)">
									<uni-icons type="chatbubble" size="18" color="#999"></uni-icons>
									<text class="card-actions-item-text">评论</text>
								</view>
							</view>
						</uni-card>
					</view>
				</view>
				<!-- 空状态 -->
				<view v-if="!filteredData || filteredData.length === 0" class="empty-state">
					<text>暂无数据</text>
				</view>
				<!-- 加载更多/无更多/异常 -->
				<uni-load-state
					class="load-state"
					:state="{data,pagination,hasMore,loading,error}"
					@loadMore="loadMore"
					@networkResume="refresh"
					noMoreText="没有更多了"
				/>
			</view>
		</unicloud-db>
	</view>
</template>

<script>
	let cdbRef;
	import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";
	import Gps from '@/uni_modules/json-gps/js_sdk/gps.js';
	const gps = new Gps(),db = uniCloud.database();

	export default {
		components: {
			statusBar
		},
		data() {
			return {
				where: 'isActive == true',
				keyword: "",
				showRefresh: false,
				listHight: 0,
				dataList: [],
				statusBarHeight: 0,
				currentCategory: 0,
				categories: [
					{ id: 0, name: '全部' },
					{ id: 1, name: '美食' },
					{ id: 2, name: '饮品' },
					{ id: 3, name: '电子' },
					{ id: 4, name: '服务' },
					{ id: 5, name: '娱乐' },
					{ id: 6, name: '其他' }
				]
			}
		},
		computed: {
			inputPlaceholder(e) {
				if (uni.getStorageSync('CURRENT_LANG') == "en") {
					return 'Please enter the search content'
				} else {
					return '请输入搜索内容'
				}
			},
			categoryNames() {
				return this.categories.map(c => c.name)
			},
			filteredData() {
				return this.dataList;
			},
			columnsFiltered() {
				// 分列：对filteredData分两列
				const cols = [[], []];
				(this.filteredData || []).forEach((item, idx) => {
					cols[idx % 2].push(item);
				});
				return cols;
			}
		},
		watch: {
			keyword(keyword, oldValue) {
				let where = 'isActive == true '
				if (keyword) {
					this.where = where + `&& /${keyword}/.test(name)`;
				} else {
					this.where = where;
				}
			}
		},
		methods: {
			goToSearch() {
				uni.navigateTo({ url: '/pages/list/search/search' })
			},
			onCategoryChange(e) {
				this.currentCategory = e.currentIndex;
				let where = 'isActive == true';
				if (this.currentCategory !== 0) {
					where += ` && category == ${this.categories[this.currentCategory].id}`;
				}
				this.where = where;
				this.dataList = []; // 清空旧数据，防止闪现
				this.$nextTick(() => {
					this.refresh();
				});
			},
			retry() { this.refresh() },
			refresh() {
				if (cdbRef) {
					cdbRef.loadData({ clear: true }, () => {
						uni.stopPullDownRefresh()
						this.showRefresh = false
						uni.showToast({ title: '已刷新', icon: 'success', duration: 2000 })
					})
				}
			},
			loadMore() {
				if (cdbRef) cdbRef.loadMore();
			},
			onqueryerror(e) {
				console.error('[onqueryerror] 类型:', typeof e);
			},
			onpullingdown(e) {
				this.showRefresh = true
				if(e.pullingDistance>100){ this.refresh() }
			},
			actionsClick(type, item) {
				uni.showToast({ title: `${type}功能开发中`, icon: 'none' });
			},
			setDataList(data) {
				if (Array.isArray(data)) {
					this.dataList = data;
				}
				return true;
			}
		},
		mounted() {
			cdbRef = this.$refs.udb;
			this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
		},
		onReachBottom() {
			console.log('[onReachBottom] called');
			if (cdbRef) cdbRef.loadMore();
		},
		async onReady() {
			// #ifdef APP-NVUE
			/* 可用窗口高度 - 搜索框高 - 状态栏高 */
			this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 + 'px';
			// #endif
			// #ifndef APP-NVUE
			this.listHight = 'auto'
			// #endif
		},
		async onShow() {
			this.keyword = getApp().globalData.searchText
			getApp().globalData.searchText = ''
			// 定位相关逻辑略
		},
		onPullDownRefresh() {
			this.refresh();
		}
	}
</script>

<style scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}
	/* #endif */
	.pages {
		background-color: #FFFFFF;
	}
	.avatar {
		width: 200rpx;
		height: 200rpx;
		margin-right: 10rpx;
	}
	.main {
		justify-content: space-between;
		flex: 1;
	}
	.title {
		font-size: 16px;
	}
	.info {
		flex-direction: row;
		justify-content: space-between;
	}
	.author,
	.last_modify_date {
		font-size: 14px;
		color: #999999;
	}
	.sticky-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: #fff;
		z-index: 999;
		height: 50px;
		display: flex;
		align-items: center;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}
	.search-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		flex-direction: row;
	}
	.search-icon-btn {
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.custom-segmented-control {
		height: 50px;
		width: calc(100% - 50px);
		flex: 1;
		min-width: 50px;
	}
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
		padding: 10px 0;
		box-sizing: border-box;
		margin: 10px 0;
	}
	.masonry-col {
		width: 48%;
		margin: 0 auto;
		box-sizing: border-box;
	}
	.masonry-card {
		margin-bottom: 12px;
		max-height: 340px;
		overflow: hidden;
		margin: 4px 2px !important;
	}
	.custom-cover { position: relative; }
	.cover-image { width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0; }
	.cover-content { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); padding: 4px 8px; }
	.uni-subtitle.uni-white { color: #fff; font-size: 14px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.card-actions { display: flex; flex-direction: row; justify-content: space-around; padding: 8px 0; }
	.card-actions-item { display: flex; align-items: center; }
	.card-actions-item-text { margin-left: 4px; font-size: 13px; color: #666; }
	.empty-state { padding: 60px 20px; text-align: center; color: #999; font-size: 14px; }
	.load-state{
		margin: 0 auto 16px auto;
		width: 90%;
	}
</style>
