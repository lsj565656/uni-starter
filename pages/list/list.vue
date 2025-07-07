<template>
	<view class="pages">
		<!-- #ifndef H5 -->
		<statusBar></statusBar>
		<!-- #endif -->

		<!-- 自定义头部导航 -->
		<view class="custom-navbar">
					<!-- #ifdef MP-WEIXIN -->
		<view class="navbar-placeholder"></view>
		<view class="navbar-search-mp">
			<view style="position: relative; width: 90%;">
				<uni-search-bar
					v-model="keyword"
					ref="searchBar"
					radius="100"
					cancelButton="auto"
					clearButton="none"
					disabled
					:placeholder="inputPlaceholder"
					@clear="resetKeyword"
				/>
				<view
					class="search-click-area"
					@click="goToSearch"
					style="position: absolute; left: 0; top: 0; bottom: 0; right: 10%; z-index: 2;"
				></view>
			</view>
		</view>
		<!-- #endif -->
					<!-- #ifndef MP-WEIXIN -->
		<view class="navbar-search-app">
			<view style="position: relative; width: 90%;">
				<uni-search-bar
					v-model="keyword"
					ref="searchBar"
					radius="100"
					cancelButton="auto"
					clearButton="none"
					disabled
					:placeholder="inputPlaceholder"
					@clear="resetKeyword"
				/>
				<view
					class="search-click-area"
					@click="goToSearch"
					style="position: absolute; left: 0; top: 0; bottom: 0; right: 10%; z-index: 2;"
				></view>
			</view>
		</view>
		<!-- #endif -->
		</view>

		<!-- 分类栏 -->
		<view class="sticky-bar">
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
			<view class="filter-icon-btn" @click.stop="toggleFilterDrawer">
				<uni-badge :text="activeFilterCount" :absolute="true" :offset="[0, 0]" :is-dot="false" v-if="activeFilterCount > 0">
					<uni-icons type="tune" size="26" color="#4c82ff" />
				</uni-badge>
				<uni-icons v-else type="tune" size="26" color="#4c82ff" />
			</view>
		</view>

		<!-- 筛选抽屉 -->
		<uni-drawer ref="filterDrawer" mode="right" :mask="true" :mask-click="false" :width="300" @close="onFilterDrawerClose" @open="onFilterDrawerOpen">
			<view class="filter-drawer-content" @click.stop>
				<view class="filter-header">
					<text class="filter-title">筛选条件</text>
					<text class="filter-desc">排序方式：价格、点赞数、库存三选一</text>
				</view>
				
				<!-- 当前筛选条件展示 -->
				<view v-if="activeFilterCount > 0" class="current-filters">
					<text class="current-filters-label">当前筛选：</text>
					<text class="current-filters-text">{{ currentFilterText }}</text>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">价格范围</text>
					<uni-data-select
						v-model="selectedPriceRange"
						:localdata="priceRangeOptions"
						placeholder="选择价格范围"
						:clear="true"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">价格排序</text>
					<uni-data-select
						v-model="selectedPriceSort"
						:localdata="priceSortOptions"
						placeholder="不排序"
						:clear="true"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">点赞数排序</text>
					<uni-data-select
						v-model="selectedLikeSort"
						:localdata="likeSortOptions"
						placeholder="不排序"
						:clear="true"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">库存排序</text>
					<uni-data-select
						v-model="selectedStockSort"
						:localdata="stockSortOptions"
						placeholder="不排序"
						:clear="true"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-actions">
					<button 
						class="filter-btn filter-btn-reset" 
						:class="{ 'filter-btn-disabled': !hasActiveFilters }"
						:disabled="!hasActiveFilters"
						@click.stop="resetFilter"
					>
						清空筛选
					</button>
				</view>
				<view class="filter-actions">
					<button 
						class="filter-btn filter-btn-reset" 
						@click.stop="onDrawerContentClick"
					>
						取消
					</button>
				</view>
			</view>
		</uni-drawer>

		<unicloud-db ref='udb' v-slot:default="{data, pagination, hasMore, loading, error, options}" @error="onqueryerror"
			:collection="colList"
			:options="{
				join: {
					0: {
						leftKey: 'user_id',
						rightKey: '_id',
						from: 1,
						as: 'userInfo',
						type: 'left'
					}
				}
			}"
			:page-size="10"
			:getcount="true"
			@data-change="onUdbDataChange">
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
								<view class="user-info">
									<image class="user-avatar" :src="item.user_id[0]?.avatar_file?.url || '/static/logo.png'" />
									<text class="user-nickname">{{ item.user_id[0]?.nickname || '匿名用户' }}</text>
								</view>
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
	const gps = new Gps();

	export default {
		components: {
			statusBar
		},
		data() {
			return {
				where: 'isActive == true',
				orderBy: 'price asc',
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
				],
				showFilterDrawer: false,
				// 筛选相关数据
				selectedPriceRange: '',
				selectedPriceSort: '',
				selectedLikeSort: '',
				selectedStockSort: '',
				
				// 筛选状态跟踪
				originalFilters: {
					priceRange: '',
					priceSort: '',
					likeSort: '',
					stockSort: ''
				},
				
				// 价格范围选项
				priceRangeOptions: [
					{ value: '', text: '全部价格' },
					{ value: '0-50', text: '0-50元' },
					{ value: '50-100', text: '50-100元' },
					{ value: '100-200', text: '100-200元' },
					{ value: '200-500', text: '200-500元' },
					{ value: '500+', text: '500元以上' }
				],
				
				// 价格排序选项
				priceSortOptions: [
					{ value: 'asc', text: '价格升序' },
					{ value: 'desc', text: '价格降序' }
				],
				
				// 点赞数排序选项
				likeSortOptions: [
					{ value: 'asc', text: '点赞数升序' },
					{ value: 'desc', text: '点赞数降序' }
				],
				
				// 库存排序选项
				stockSortOptions: [
					{ value: 'asc', text: '库存升序' },
					{ value: 'desc', text: '库存降序' }
				]
			}
		},
		computed: {
			colList() {
				const db = uniCloud.database();
				const result = [
					db.collection('kl-food-products')
						.where(this.where)
						.field('image,name,description,like_count,category,stock,price,isActive,user_id,_id')
						.orderBy(this.orderBy)
						.getTemp(),
					db.collection('uni-id-users')
						.field('_id,nickname,avatar_file')
						.getTemp()
				];
				return result;
			},
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
			},
			activeFilterCount() {
				let count = 0;
				if (this.selectedPriceRange && this.selectedPriceRange !== '') count++;
				if (this.selectedPriceSort) count++;
				if (this.selectedLikeSort) count++;
				if (this.selectedStockSort) count++;
				return count;
			},
			currentFilterText() {
				const filters = [];
				
				if (this.selectedPriceRange) {
					const priceOption = this.priceRangeOptions.find(option => option.value === this.selectedPriceRange);
					if (priceOption && priceOption.value !== '') {
						filters.push(priceOption.text);
					}
				}
				
				if (this.selectedPriceSort) {
					const priceSortOption = this.priceSortOptions.find(option => option.value === this.selectedPriceSort);
					if (priceSortOption) {
						filters.push(priceSortOption.text);
					}
				}
				
				if (this.selectedLikeSort) {
					const likeSortOption = this.likeSortOptions.find(option => option.value === this.selectedLikeSort);
					if (likeSortOption) {
						filters.push(likeSortOption.text);
					}
				}
				
				if (this.selectedStockSort) {
					const stockSortOption = this.stockSortOptions.find(option => option.value === this.selectedStockSort);
					if (stockSortOption) {
						filters.push(stockSortOption.text);
					}
				}
				
				return filters.join(', ');
			},
			hasActiveFilters() {
				return this.activeFilterCount > 0;
			}
		},
		watch: {
			keyword(keyword, oldValue) {
				this.applyRealTimeFilter(); // 使用统一的筛选方法
			},
			// 实时筛选监听
			selectedPriceRange() {
				this.applyRealTimeFilter();
			},
			selectedPriceSort(newValue) {
				// 如果选择了价格排序，清空其他排序
				if (newValue) {
					this.selectedLikeSort = '';
					this.selectedStockSort = '';
				}
				this.applyRealTimeFilter();
			},
			selectedLikeSort(newValue) {
				// 如果选择了点赞数排序，清空其他排序
				if (newValue) {
					this.selectedPriceSort = '';
					this.selectedStockSort = '';
				}
				this.applyRealTimeFilter();
			},
			selectedStockSort(newValue) {
				// 如果选择了库存排序，清空其他排序
				if (newValue) {
					this.selectedPriceSort = '';
					this.selectedLikeSort = '';
				}
				this.applyRealTimeFilter();
			}
		},
		methods: {
			goToSearch() {
				uni.hideKeyboard();
				uni.navigateTo({ url: '/pages/list/search/search?keyword=' + encodeURIComponent(this.keyword),animationType: 'fade-in'})
			},
			onCategoryChange(e) {
				this.currentCategory = e.currentIndex;
				this.applyRealTimeFilter();
			},
			retry() { this.refresh() },
			refresh() {
				if (this.$refs.udb) {
					this.$refs.udb.loadData({ clear: true }, () => {
						uni.stopPullDownRefresh()
						this.showRefresh = false
						uni.showToast({ title: '已刷新', icon: 'success', duration: 2000 })
					})
				}
			},
			loadMore() {
				if (this.$refs.udb) this.$refs.udb.loadMore();
			},
			onqueryerror(e) {
				console.error('[onqueryerror] 类型:', typeof e);
			},
			actionsClick(type, item) {
				uni.showToast({ title: `${type}功能开发中`, icon: 'none' });
			},
			setDataList(data) {
				if (Array.isArray(data)) {
					this.dataList = data;
					console.log('setDataList:',data);
				} else {
					console.log('setDataList: data is not an array:', typeof data);
				}
				return true;
			},
			toggleFilterDrawer() {
				if (this.showFilterDrawer) {
					if (this.$refs.filterDrawer) this.$refs.filterDrawer.close();
					this.showFilterDrawer = false;
				} else {
					if (this.$refs.filterDrawer) this.$refs.filterDrawer.open();
					this.showFilterDrawer = true;
				}
			},
			openFilterDrawer() {
				if (this.$refs.filterDrawer) {
					// 保存当前筛选状态作为原始状态
					this.originalFilters = {
						priceRange: this.selectedPriceRange,
						priceSort: this.selectedPriceSort,
						likeSort: this.selectedLikeSort,
						stockSort: this.selectedStockSort
					};
					this.$refs.filterDrawer.open();
				}
			},
			closeFilterDrawer() {
				if (this.$refs.filterDrawer) {
					this.$refs.filterDrawer.close();
				}
			},
			onFilterDrawerOpen() {
				this.showFilterDrawer = true;
			},
			onFilterDrawerClose() {
				this.showFilterDrawer = false;
				// 抽屉关闭时恢复筛选状态
				this.selectedPriceRange = this.originalFilters.priceRange;
				this.selectedPriceSort = this.originalFilters.priceSort;
				this.selectedLikeSort = this.originalFilters.likeSort;
				this.selectedStockSort = this.originalFilters.stockSort;
			},
			onDrawerContentClick() {
				if (this.$refs.filterDrawer) {
					this.$refs.filterDrawer.close();
					this.showFilterDrawer = false;
				}
			},
			applyRealTimeFilter() {
				// 构建筛选条件
				let where = 'isActive == true';
				
				// 分类筛选
				if (this.currentCategory !== 0) {
					where += ` && category == ${this.categories[this.currentCategory].id}`;
				}
				
				// 关键词搜索
				if (this.keyword && this.keyword.trim()) {
					where += ` && /${this.keyword.trim()}/.test(name)`;
				}
				
				// 价格范围筛选
				if (this.selectedPriceRange && this.selectedPriceRange !== '') {
					const [min, max] = this.selectedPriceRange.split('-');
					if (max === '+') {
						where += ` && price >= ${min}`;
					} else {
						where += ` && price >= ${min} && price <= ${max}`;
					}
				}
				
				
				// 更新查询条件
				this.where = where;
				
				// 处理排序逻辑 - 优先级：价格 > 点赞数 > 库存
				let orderBy = '';
				if (this.selectedPriceSort) {
					orderBy = `price ${this.selectedPriceSort}`;
				} else if (this.selectedLikeSort) {
					orderBy = `like_count ${this.selectedLikeSort}`;
				} else if (this.selectedStockSort) {
					orderBy = `stock ${this.selectedStockSort}`;
				} else {
					orderBy = 'price asc'; // 默认排序
				}
				
				this.orderBy = orderBy;
				
				// 清空数据并刷新
				this.dataList = [];
				this.$nextTick(() => {
					this.refresh();
				});
			},
			resetFilter() {
				// 重置所有筛选条件
				this.selectedPriceRange = '';
				this.selectedPriceSort = '';
				this.selectedLikeSort = '';
				this.selectedStockSort = '';
				
				// 重置查询条件，但保留当前分类和关键词
				let where = 'isActive == true';
				if (this.currentCategory !== 0) {
					where += ` && category == ${this.categories[this.currentCategory].id}`;
				}
				if (this.keyword && this.keyword.trim()) {
					where += ` && /${this.keyword.trim()}/.test(name)`;
				}
				this.where = where;
				this.orderBy = 'price asc';
				
				// 更新原始状态
				this.originalFilters = {
					priceRange: '',
					priceSort: '',
					likeSort: '',
					stockSort: ''
				};
				
				// 清空数据并刷新
				this.dataList = [];
				this.showFilterDrawer = false;
				this.closeFilterDrawer();
				this.$nextTick(() => {
					this.refresh();
				});
			},
			onUdbDataChange(data) {
				this.setDataList(data);
			},
			resetKeyword() {
				this.keyword = '';
				this.applyRealTimeFilter();
			},
			onSearchFocus() {
				// 跳转到搜索页并带上当前 keyword
				uni.navigateTo({
					url: '/pages/list/search/search?keyword=' + encodeURIComponent(this.keyword)
				});
			}
		},
		mounted() {
			cdbRef = this.$refs.udb;
			this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
		},
		onReachBottom() {
			this.loadMore();
		},
		onReady() {
			// #ifdef APP-NVUE
			/* 可用窗口高度 - 搜索框高 - 状态栏高 */
			this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 + 'px';
			// #endif
			// #ifndef APP-NVUE
			this.listHight = 'auto'
			// #endif
		},
		onShow() {
			this.keyword = getApp().globalData.searchText
			getApp().globalData.searchText = ''
			// 新增：处理外部跳转指定分类
			const tabCategory = uni.getStorageSync('listTabCategory')
			if (tabCategory) {
				const idx = this.categories.findIndex(c => c.name === tabCategory)
				if (idx !== -1) {
					this.currentCategory = idx
					this.applyRealTimeFilter()
				}
				uni.removeStorageSync('listTabCategory')
			}
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
	.custom-navbar {
		width: 100%;
		background: #fff;
		padding-top: var(--status-bar-height, 0px);
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 60px;
		position: fixed;
		top: 0;
		z-index: 1000;
		border-bottom: 1px solid #f0f0f0;
	}
	.navbar-placeholder {
		width: 100%;
		height: 100%;
		display: inline-block;
	}
	.navbar-search-mp {
		flex: 1;
		display: flex;
		align-items: center;
		height: 100%;
		position: relative;
	}
	.navbar-search-app {
		width: 100%;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}
	.navbar-search-app .uni-searchbar {
		width: 100%;	
	}
	.search-click-area {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		cursor: pointer;
	}
	.sticky-bar {
		position: sticky;
		top: 60px;
		left: 0;
		background: #fff;
		z-index: 1001;
		height: 50px;
		width: 100%;
		padding-right: 10%;
		display: flex;
		align-items: center;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}
	.filter-icon-btn {
		position: fixed;
		top: 60px;
		right: 0px;
		background: #ffffff46;
		height: 50px;
		width: 10%;
		z-index: 1002;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.uni-badge--x {
		right: 4px;
	}
	.search-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		flex-direction: row;
	}
	.custom-segmented-control {
		height: 50px;
		width: 100%;
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
	}
	.masonry-col {
		width: 49%;
		margin: 0 auto;
		margin-top: 50px;
		box-sizing: border-box;
	}
	.masonry-card {
		margin-bottom: 12px;
		max-height: 340px;
		overflow: hidden;
		margin: 4px 1px !important;
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
	/* 筛选抽屉样式 */
	.filter-drawer-content {
		padding: 20px 10px;
		background: #fff;
		min-height: 400px;
		position: relative;
		z-index: 1004;
		top: 110px !important;
	}
	
	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.filter-title {
		font-size: 18px;
		font-weight: 600;
		color: #333;
	}
	.filter-desc {
		font-size: 14px;
		color: #999;
	}
	
	.filter-section {
		margin-bottom: 20px;
	}
	
	.filter-label {
		display: block;
		font-size: 14px;
		color: #666;
		margin-bottom: 8px;
		font-weight: 500;
	}
	
	.filter-select {
		width: 100%;
	}
	
	.current-filters {
		margin-bottom: 6px;
		padding: 2px;
		background-color: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #1976d2;
	}
	
	.current-filters-label {
		font-size: 14px;
		color: #666;
		font-weight: 500;
		margin-right: 8px;
	}
	
	.current-filters-text {
		font-size: 14px;
		color: #333;
		line-height: 1.4;
	}
	
	.filter-actions {
		margin-top: 10px;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
	
	.filter-btn {
		width: 60%;
		height: 44px;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.filter-btn-reset {
		background-color: #f5f5f5;
		color: #666;
	}
	
	.filter-btn-reset:active {
		background-color: #e0e0e0;
	}
	
	.filter-btn-confirm {
		background-color: #1976d2;
		color: #fff;
	}
	
	.filter-btn-confirm:active {
		background-color: #1565c0;
	}
	
	.filter-btn-disabled {
		background-color: #f0f0f0 !important;
		color: #ccc !important;
		cursor: not-allowed !important;
		opacity: 0.6;
	}
	
	.filter-btn-disabled:active {
		background-color: #f0f0f0 !important;
	}
	.user-info {
		display: flex;
		align-items: center;
		flex-direction: row;
		padding: 2px 8px;
		border-top: 1px solid #f0f0f0;
	}
	.user-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		margin-right: 8px;
	}
	.user-nickname {
		max-width: 40vw !important;
		font-size: 13px;
		color: #666;
	}
</style>
