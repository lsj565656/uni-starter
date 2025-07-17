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
			<!-- 左侧返回全部按钮 -->
			<view 
				v-if="showBackToAllBtn" 
				class="back-to-all-btn" 
				@click.stop="backToAll"
			>
				<uni-icons type="left" size="20" color="#4c82ff" />
			</view>
			
			<scroll-view
				class="category-scroll"
				scroll-x
				scroll-with-animation
				:scroll-left="categoryScrollLeft"
				ref="categoryScroll"
				style="white-space: nowrap;"
			>
				<view
					v-for="(item, index) in categoryNames"
					:key="index"
					:id="'cat-' + index"
					class="seg-item"
					:class="{ active: currentCategory === index }"
					:style="categoryItemStyle"
					@click="onCategoryChange({ currentIndex: index })"
				>
					{{ item }}
					<view v-if="currentCategory === index" class="seg-underline"></view>
				</view>
				<!-- 虚拟留白 - 确保最后一个分类项能完整显示 -->
				<view
					:style="{
					display: 'inline-block',
					width: '16px',
					height: '1px'
					}"
				></view>
			</scroll-view>
			<!-- 筛选按钮 -->
			<view class="filter-icon-btn" @click.stop="toggleFilterDrawer">
				<uni-badge :text="activeFilterCount" :absolute="'true'" :offset="[0, 0]" :is-dot="false" v-if="activeFilterCount > 0">
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
				</view>
				
				<!-- 当前筛选条件展示 -->
				<view v-if="activeFilterCount > 0" class="current-filters">
					<text class="current-filters-label">当前筛选：</text>
					<text class="current-filters-text">{{ currentFilterText }}</text>
				</view>
				
				<!-- 仅看类型按钮并排，无文本 -->
				<view class="filter-section mode-switch-row">
					<button :class="['mode-switch-btn', mode === 'score' ? 'active' : '']" :disabled="isFiltering" @click="onModeSwitch('score')">仅看积分</button>
					<button :class="['mode-switch-btn', mode === 'price' ? 'active' : '']" :disabled="isFiltering" @click="onModeSwitch('price')">仅看价格</button>
				</view>
				
				<view class="filter-section" v-if="mode === 'score' || mode === 'price'">
					<text class="filter-label">{{ mode === 'score' ? '积分排序' : '价格排序' }}</text>
					<uni-data-select
						v-model="selectedScoreOrPriceSort"
						:localdata="scoreOrPriceSortOptions"
						placeholder="不排序"
						:clear="true"
						:disabled="isFiltering"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">点赞排序</text>
					<uni-data-select
						v-model="selectedLikeSort"
						:localdata="likeSortOptions"
						placeholder="不排序"
						:clear="true"
						:disabled="isFiltering"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">发布时间排序</text>
					<uni-data-select
						v-model="selectedDateSort"
						:localdata="dateSortOptions"
						placeholder="不排序"
						:clear="true"
						:disabled="isFiltering"
						class="filter-select"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-label">最大参与人数排序</text>
					<uni-data-select
						v-model="selectedScaleSort"
						:localdata="scaleSortOptions"
						placeholder="不排序"
						:clear="true"
						:disabled="isFiltering"
						class="filter-select"
					/>
				</view>
				
				<!-- 清空筛选和取消按钮并排 -->
				<view class="filter-actions filter-actions-row">
					<button 
						class="filter-btn filter-btn-reset" 
						:class="{ 'filter-btn-disabled': !hasActiveFilters }"
						:disabled="!hasActiveFilters"
						@click.stop="resetFilter"
					>
						清空筛选
					</button>
					<button 
						class="filter-btn filter-btn-reset" 
						@click.stop="onDrawerContentClick"
					>
						取消
					</button>
				</view>
			</view>
		</uni-drawer>

		<unicloud-db ref='udb'
			:key="colListKey"
			v-slot:default="{data, pagination, hasMore, loading, error, options}"
			@error="onqueryerror"
			@data-change="onUdbDataChange"
			:collection="colList"
			:options="{ join: { 0: { leftKey: 'user_id', rightKey: '_id', from: 1, as: 'userInfo', type: 'left' }, 1: { leftKey: '_id', rightKey: 'task_id', from: 2, as: 'likes', type: 'left' } } }"
			:page-size="10"
			:getcount="true"
			:where="where"
			:orderby="orderBy">
			<template v-if="handleUdbDataChange(data)"></template>
			<view class="masonry-scroll">
				<view class="masonry-row">
					<view class="masonry-col" v-for="(col, colIdx) in getColumnsFiltered(useCache ? displayData : data)" :key="colIdx">
						<task-card
							v-for="item in col"
							:key="item._id"
							:task="withLikeStatus(item)"
							:user="item.user_id[0]"
							@favorite="actionsClick('收藏', $event)"
							@comment="actionsClick('评论', $event)"
							@join="actionsClick('加入', $event)"
							@like="actionsClick('点赞', $event)"
						/>
					</view>
				</view>
				<!-- 空状态 -->
				<view v-if="!data || data.length === 0" class="empty-state">
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
	import { categories } from '@/utils/categories'
	import { toggleTaskLike } from '@/utils/taskLike.js'
	import { useTaskLikeStore } from '@/store/taskLike.js'

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
				showFilterDrawer: false,
				// 筛选相关数据
				selectedPriceRange: '',
				selectedPriceSort: '',
				selectedLikeSort: '',
				selectedScoreRange: '',
				
				// 筛选状态跟踪
				originalFilters: {
					priceRange: '',
					priceSort: '',
					likeSort: '',
					scoreRange: ''
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
				
				// 积分范围选项
				scoreRangeOptions: [
					{ value: '', text: '全部积分' },
					{ value: '0-200', text: '0~200积分' },
					{ value: '200-500', text: '200~500积分' },
					{ value: '500+', text: '500积分以上' }
				],
				
				// 积分排序选项
				scoreSortOptions: [
					{ value: 'asc', text: '积分升序' },
					{ value: 'desc', text: '积分降序' }
				],
				
				// 规模排序选项
				scaleSortOptions: [
					{ value: 'asc', text: '规模升序' },
					{ value: 'desc', text: '规模降序' }
				],
				likesTaskIds: [], // 新增：存储当前用户点赞的所有任务id
				mode: '', // 仅看积分/仅看价格
				isFiltering: false, // 新增：刷新未完成时禁用筛选
				selectedScoreOrPriceSort: '', // 新增：积分/价格排序
				selectedDateSort: '', // 发布时间排序
				dateSortOptions: [
					{ value: 'asc', text: '发布时间升序' },
					{ value: 'desc', text: '发布时间降序' }
				],
				selectedScaleSort: '',
				colListKey: 0,
				inited: false,
				useCache: false,
				categoryCache: {},
				cacheExpire: 60000,
				displayData: [], // 新增：用于缓存命中时渲染
				lastRequestedCategoryId: 0, // 新增：记录本次请求的分类id
				lastCacheWriteScene: '', // 新增：记录本次缓存写入场景
				categoryScrollLeft: 0,
				showBackToAllBtn: false, // 新增：是否显示返回全部按钮
			}
		},
		computed: {
			colList() {
				const db = uniCloud.database();
				let where = this.where;
				if (this.keyword && this.keyword.trim()) {
					where += ` && /${this.keyword.trim()}/.test(name)`;
				}
				return [
					db.collection('kl-tasks')
						.where(where)
						.orderBy(this.orderBy)
						.getTemp(),
					db.collection('uni-id-users')
						.field('_id,nickname,avatar_file')
						.getTemp()
				];
			},
			inputPlaceholder(e) {
				if (uni.getStorageSync('CURRENT_LANG') == "en") {
					return 'Please enter the search content'
				} else {
					return '请输入搜索内容'
				}
			},
			listCategories() {
				// 只取 use_list 为 true 的分类
				return categories.filter(c => c.use_list)
			},
			categoryNames() {
				// 用于分类tab显示
				return this.listCategories.map(c => c.text)
			},
			// 新增：动态计算分类项样式 - 一屏显示4.5个分类项
			categoryItemStyle() {
				// 获取屏幕宽度
				const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
				// 一屏显示4.5个分类项，左右各露出半个分类项
				const VISIBLE_COUNT = 4.5;
				// 分类项左右margin
				const marginPx = 8;
				// 计算分类项宽度：(屏幕宽度 - 左右padding - 分类项间距) / 4.5
				const itemWidth = Math.floor((screenWidth - 32 - (VISIBLE_COUNT - 1) * marginPx * 2) / VISIBLE_COUNT);
				
				return {
					width: itemWidth + 'px',
					margin: `0 ${marginPx}px`,
					minWidth: itemWidth + 'px',
					maxWidth: itemWidth + 'px',
					flexShrink: '0'
				};
			},
			// 新增：计算总内容宽度
			totalCategoryWidth() {
				const categoryCount = this.categoryNames.length;
				const itemStyle = this.categoryItemStyle;
				const itemWidth = parseInt(itemStyle.width);
				const itemMargin = parseInt(itemStyle.margin.split(' ')[1]);
				// 总宽度 = 分类项数量 × (分类项宽度 + 左右margin) + 虚拟留白宽度
				const virtualBlankWidth = 16; // 虚拟留白宽度，与scroll-view的paddingRight一致
				return categoryCount * (itemWidth + itemMargin * 2) + virtualBlankWidth;
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
				if (this.mode === 'price' || this.mode === 'score') {
					count++;
				}
				if (this.selectedScoreOrPriceSort) count++;
				if (this.selectedLikeSort) count++;
				if (this.selectedDateSort) count++;
				if (this.selectedScaleSort) count++;
				return count;
			},
			currentFilterText() {
				const filters = [];
				if (this.mode === 'price') {
					filters.push('仅看价格');
					if (this.selectedScoreOrPriceSort) {
						const opt = this.scoreOrPriceSortOptions.find(option => option.value === this.selectedScoreOrPriceSort);
						if (opt) filters.push(opt.text);
					}
				} else if (this.mode === 'score') {
					filters.push('仅看积分');
					if (this.selectedScoreOrPriceSort) {
						const opt = this.scoreOrPriceSortOptions.find(option => option.value === this.selectedScoreOrPriceSort);
						if (opt) filters.push(opt.text);
					}
				}
				if (this.selectedLikeSort) {
					const opt = this.likeSortOptions.find(option => option.value === this.selectedLikeSort);
					if (opt) filters.push('点赞' + (opt.value === 'asc' ? '升序' : '降序'));
				}
				if (this.selectedDateSort) {
					const opt = this.dateSortOptions.find(option => option.value === this.selectedDateSort);
					if (opt) filters.push(opt.text);
				}
				if (this.selectedScaleSort) {
					const opt = this.scaleSortOptions.find(option => option.value === this.selectedScaleSort);
					if (opt) filters.push('最大参与人数' + (opt.value === 'asc' ? '升序' : '降序'));
				}
				return filters.join(', ');
			},
			hasActiveFilters() {
				return this.activeFilterCount > 0;
			},
			scoreOrPriceSortOptions() {
				return this.mode === 'score'
					? [ { value: 'asc', text: '积分升序' }, { value: 'desc', text: '积分降序' } ]
					: [ { value: 'asc', text: '价格升序' }, { value: 'desc', text: '价格降序' } ];
			},
			currentCatId() {
				return 'cat-' + this.currentCategory
			},
		},
		watch: {
			keyword(keyword, oldValue) {
				this.applyRealTimeFilter(); // 使用统一的筛选方法
			},
			// 实时筛选监听
			selectedPriceRange(newValue) {
				if (newValue) {
					this.selectedScoreRange = '';
				}
				this.applyRealTimeFilter();
			},
			selectedScoreRange(newValue) {
				if (newValue) {
					this.selectedPriceRange = '';
				}
				this.applyRealTimeFilter();
			},
			selectedPriceSort(newValue) {
				if (newValue) {
					this.selectedScoreSort = '';
				}
				this.applyRealTimeFilter();
			},
			selectedScoreSort(newValue) {
				if (newValue) {
					this.selectedPriceSort = '';
				}
				this.applyRealTimeFilter();
			},
			selectedScaleSort(newValue) {
				this.applyRealTimeFilter();
			},
			mode(newValue) {
				if (newValue) {
					this.selectedScoreOrPriceSort = '';
					this.applyRealTimeFilter();
				}
			},
			selectedLikeSort() {
				this.applyRealTimeFilter();
			},
			selectedDateSort() {
				this.applyRealTimeFilter();
			},
			selectedScoreOrPriceSort() {
				this.applyRealTimeFilter();
			},
		},
		methods: {
			goToSearch() {
				uni.hideKeyboard();
				uni.navigateTo({ url: '/pages/list/search/search?keyword=' + encodeURIComponent(this.keyword),animationType: 'fade-in'})
			},
			onCategoryChange(e) {
				const newCategoryIndex = e.currentIndex;
				this.currentCategory = newCategoryIndex;
				this.scrollCategoryToCenter(newCategoryIndex);
				console.log('[onCategoryChange] 当前所有缓存快照:', JSON.parse(JSON.stringify(this.categoryCache)));
				const newCategoryId = this.getCurrentCategoryId(newCategoryIndex);
				const now = Date.now();
				const cache = this.categoryCache[newCategoryId];
				// 新增：如果有筛选条件，始终刷新
				if (this.activeFilterCount > 0) {
					this.displayData = [];
					this.useCache = false;
					this.currentCategory = newCategoryIndex;
					this.lastCacheWriteScene = 'refresh';
					this.applyRealTimeFilter(newCategoryId);
					return;
				}
				if (
					cache &&
					cache.categoryId === newCategoryId &&
					(now - cache.lastUpdate < this.cacheExpire) &&
					Array.isArray(cache.dataList) && cache.dataList.length > 0
				) {
					const cacheDataStr = JSON.stringify(cache.dataList);
					const displayDataStr = JSON.stringify(this.displayData);
					if (displayDataStr !== cacheDataStr) {
						this.displayData = this.deepClone(cache.dataList);
					}
					this.useCache = true; // 命中缓存时只用缓存渲染
					this.currentCategory = newCategoryIndex;
					return;
				}
				// 没有缓存，自动刷新并写缓存
				this.displayData = [];
				this.useCache = false; // 未命中缓存时用 unicloud-db 渲染
				this.currentCategory = newCategoryIndex;
				this.lastCacheWriteScene = 'refresh';
				this.applyRealTimeFilter(newCategoryId);
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
				this.useCache = false;
				this.displayData = [];
				this.lastCacheWriteScene = 'loadMore';
				if (this.$refs.udb) {
					this.$refs.udb.loadMore();
				}
			},
			onqueryerror(e) {
				console.error('[onqueryerror] 类型:', typeof e);
			},
			actionsClick(type, item) {
				if (type === '点赞') {
					if (!item._id) return;
					const taskLikeStore = useTaskLikeStore();
					const taskId = (item._id && item._id.$oid) ? item._id.$oid : item._id;
					const likeInfo = taskLikeStore.getLike(taskId);
					const isLiked = likeInfo ? likeInfo.isLiked : false;
					// 乐观UI
					toggleTaskLike(taskId, isLiked)
						.then(({ isLiked: newLiked, likeCount }) => {
							// 强制同步本地状态
							if (newLiked) {
								taskLikeStore.setLike(taskId, true, likeCount, { ...item, is_liked: true, like_count: likeCount });
							} else {
								taskLikeStore.removeLike(taskId);
							}
						})
						.catch(e => {
							uni.showToast({ title: e.message || '操作失败', icon: 'none' });
						});
				} else {
					uni.showToast({ title: `${type}功能开发中`, icon: 'none' });
				}
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
						scoreRange: this.selectedScoreRange
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
				this.selectedScoreRange = this.originalFilters.scoreRange;
			},
			onDrawerContentClick() {
				if (this.$refs.filterDrawer) {
					this.$refs.filterDrawer.close();
					this.showFilterDrawer = false;
				}
			},
			// 移除所有批量 setLike 相关逻辑，只保留 likesTaskIds 的 fetch 和首次渲染。
			async fetchLikesTaskIds() {
				const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid;
				if (!userId) {
					this.likesTaskIds = [];
					return;
				}
				const res = await uniCloud.database()
					.collection('kl-tasks-likes')
					.where(`user_id == "${userId}"`)
					.field('task_id')
					.get();
				this.likesTaskIds = (res.result.data || []).map(item => (item.task_id && item.task_id.$oid) ? item.task_id.$oid : item.task_id);
			},
			async applyRealTimeFilter(categoryId) {
				this.isFiltering = true;
				this.displayData = []; // 新增：拉取新数据前清空
				this.lastRequestedCategoryId = categoryId !== undefined ? categoryId : this.getCurrentCategoryId(); // 新增：记录本次请求的分类id
				let where = 'isActive == true';
				if (this.currentCategory !== 0) {
					where += ` && category == ${this.currentCategory}`;
				}
				if (this.keyword && this.keyword.trim()) {
					where += ` && /${this.keyword.trim()}/.test(name)`;
				}
				if (this.mode == 'score' || this.mode == 'price') {
					where += ` && mode == '${this.mode}'`;
				}
				this.where = where;
				let orderByArr = [];
				if (this.selectedScoreOrPriceSort) {
					orderByArr.push((this.mode === 'score' ? 'score' : 'price') + ' ' + this.selectedScoreOrPriceSort);
				}
				if (this.selectedLikeSort) {
					orderByArr.push('like_count ' + this.selectedLikeSort);
				}
				if (this.selectedDateSort) {
					orderByArr.push('create_date ' + this.selectedDateSort);
				}
				if (this.selectedScaleSort) {
					orderByArr.push('max_participants ' + this.selectedScaleSort);
				}
				if (orderByArr.length === 0) {
					orderByArr.push('create_date desc');
				}
				this.orderBy = orderByArr.join(', ');
				this.dataList = [];
				if (this.inited) {
					this.colListKey++;
				}
				this.$nextTick(() => {
					this.isFiltering = false;
				});
			},
			resetFilter() {
				// 重置所有筛选条件
				this.mode = '';
				this.selectedScoreOrPriceSort = '';
				this.selectedLikeSort = '';
				this.selectedDateSort = '';
				this.selectedScaleSort = '';
				// 重置查询条件，但保留当前分类和关键词
				let where = 'isActive == true';
				if (this.currentCategory !== 0) {
					where += ` && category == ${this.currentCategory}`;
				}
				if (this.keyword && this.keyword.trim()) {
					where += ` && /${this.keyword.trim()}/.test(name)`;
				}
				this.where = where;
				this.orderBy = 'create_date desc';
				// 更新原始状态
				this.originalFilters = {
					priceRange: '',
					priceSort: '',
					likeSort: '',
					scoreRange: ''
				};
				// 清空数据并刷新
				this.dataList = [];
				this.colListKey++;
				this.showFilterDrawer = false;
				this.closeFilterDrawer();
				this.$nextTick(() => {
					this.refresh();
				});
			},
			onModeSwitch(mode) {
				if (this.mode === mode) return;
				this.mode = mode;
				this.selectedPriceSort = '';
				this.selectedScoreSort = '';
				this.$nextTick(() => {
					this.applyRealTimeFilter();
				});
			},
			// 新增：获取当前分类 id
			getCurrentCategoryId(categoryIndex = this.currentCategory) {
				// 取 listCategories 的 catId
				return this.listCategories[categoryIndex]?.catId ?? 0;
			},
			getColumnsFiltered(data) {
				const cols = [[], []];
				(data || []).forEach((item, idx) => {
					cols[idx % 2].push(item);
				});
				return cols;
			},
			// 新增：渲染 task-card 时直接判断 is_liked 和 like_count 
			withLikeStatus(item) {
				// 1. 首次渲染时，likesTaskIds 是权威点赞列表
				const idStr = (item._id && item._id.$oid) ? item._id.$oid : item._id;
				let isLiked = item.is_liked;
				if (this.likesTaskIds && this.likesTaskIds.length) {
					isLiked = this.likesTaskIds.includes(idStr);
				}
				// 2. 后续用 store 里的 isLiked/likeCount 优先生效
				const taskLikeStore = useTaskLikeStore();
				const likeInfo = taskLikeStore.getLike(idStr);
				return {
					...item,
					is_liked: likeInfo ? likeInfo.isLiked : isLiked,
					like_count: likeInfo ? likeInfo.likeCount : item.like_count
				}
			},
			// 新增：slot 内部处理缓存写入
			cacheDataForCategory(data) {
				if (Array.isArray(data) && data.length > 0) {
					// 1. 先缓存"全部"分类（categoryId: 0）
					const cacheAll = this.categoryCache[0];
					const newAllDataStr = JSON.stringify(data);
					const oldAllDataStr = cacheAll ? JSON.stringify(cacheAll.dataList) : null;
					if (cacheAll && oldAllDataStr === newAllDataStr) {
						cacheAll.lastUpdate = Date.now();
					} else {
						this.categoryCache[0] = {
							categoryId: 0,
							dataList: this.deepClone(data),
							lastUpdate: Date.now(),
							filterKey: ''
						};
					}

					// 2. 再按 category 分组缓存
					const grouped = {};
					data.forEach(item => {
						const cat = item.category;
						if (!grouped[cat]) grouped[cat] = [];
						grouped[cat].push(item);
					});
					Object.keys(grouped).forEach(catId => {
						const catNum = Number(catId);
						const groupData = grouped[catId];
						const cache = this.categoryCache[catNum];
						const newDataStr = JSON.stringify(groupData);
						const oldDataStr = cache ? JSON.stringify(cache.dataList) : null;
						if (cache && oldDataStr === newDataStr) {
							cache.lastUpdate = Date.now();
						} else {
							this.categoryCache[catNum] = {
								categoryId: catNum,
								dataList: this.deepClone(groupData),
								lastUpdate: Date.now(),
								filterKey: ''
							};
						}
					});
				} else {
					console.log('[cacheDataForCategory] 未写入缓存，data 非数组或为空');
				}
				return '';
			},
			resetKeyword() {
				this.keyword = '';
			},
			deepClone(obj) {
				return JSON.parse(JSON.stringify(obj));
			},
			writeCurrentCategoryCache() {
				const udb = this.$refs.udb;
				if (!udb) return;
				const data = udb.data || [];
				this.cacheDataForCategory(data);
			},
			onUdbDataChange({ data }) {
				if (this.lastCacheWriteScene && Array.isArray(data) && data.length > 0) {
					this.cacheDataForCategory(data);
					this.lastCacheWriteScene = '';
				}
			},
			handleUdbDataChange(data) {
				this.onUdbDataChange({ data });
				return false;
			},
			scrollCategoryToCenter(index) {
				if (index === 0) {
					this.categoryScrollLeft = 0
					return
				}
				
				// 获取屏幕宽度和分类项样式
				const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
				const itemStyle = this.categoryItemStyle;
				const itemWidth = parseInt(itemStyle.width);
				const itemMargin = parseInt(itemStyle.margin.split(' ')[1]);
				const itemTotalWidth = itemWidth + itemMargin * 2;
				
				// 计算目标分类项在总内容中的绝对位置
				const targetItemAbsoluteLeft = index * itemTotalWidth;
				
				// 计算scroll-view的可视宽度（减去左右padding）
				const scrollViewVisibleWidth = screenWidth - 32; // 左右各16px padding
				
				// 计算目标滚动位置：让目标分类项居中显示
				// 由于一屏显示4.5个分类项，目标分类项应该在第2.25个位置（从0开始算）
				const targetPosition = scrollViewVisibleWidth * 0.5 - itemTotalWidth * 0.5;
				let targetScrollLeft = targetItemAbsoluteLeft - targetPosition;
				
				// 边界检查
				const totalWidth = this.totalCategoryWidth;
				const maxScrollLeft = Math.max(0, totalWidth - scrollViewVisibleWidth);
				
				if (targetScrollLeft < 0) {
					targetScrollLeft = 0;
				} else if (targetScrollLeft > maxScrollLeft) {
					targetScrollLeft = maxScrollLeft;
				}
				
				// 应用滚动
				this.categoryScrollLeft = targetScrollLeft;
				
				// 更新返回全部按钮显示状态
				this.updateBackToAllBtnVisibility();
			},
			
			// 新增：更新返回全部按钮显示状态
			updateBackToAllBtnVisibility() {
				const itemStyle = this.categoryItemStyle;
				const itemWidth = parseInt(itemStyle.width);
				const itemMargin = parseInt(itemStyle.margin.split(' ')[1]);
				const itemTotalWidth = itemWidth + itemMargin * 2;
				
				// 当滚动距离大于一个分类项宽度时显示返回全部按钮
				this.showBackToAllBtn = this.categoryScrollLeft > itemTotalWidth;
			},
			
			// 新增：返回全部分类
			backToAll() {
				// 切换到全部分类
				this.onCategoryChange({ currentIndex: 0 });
				// 滚动到最左侧
				this.categoryScrollLeft = 0;
				// 隐藏返回全部按钮
				this.showBackToAllBtn = false;
			},
			async fetchLikesTaskIdsAndInitStore(data) {
				const userId = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo().uid;
				if (!userId) {
					this.likesTaskIds = [];
					return;
				}
				const res = await uniCloud.database()
					.collection('kl-tasks-likes')
					.where(`user_id == "${userId}"`)
					.field('task_id')
					.get();
				this.likesTaskIds = (res.result.data || []).map(item => (item.task_id && item.task_id.$oid) ? item.task_id.$oid : item.task_id);
				// 拿到 likesTaskIds 后，批量初始化 store
				// this.batchInitTaskLikeStore(data, this.likesTaskIds); // 移除批量 setLike
			},
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
			// 只处理外部跳转指定分类
			const tabCategory = uni.getStorageSync('listTabCategory')
			if (tabCategory) {
				const idx = this.listCategories.findIndex(c => c.text === tabCategory)
				if (idx !== -1) {
					this.currentCategory = idx
					this.applyRealTimeFilter();
				}
				uni.removeStorageSync('listTabCategory')
			}
			// 新增：同步搜索内容
			const searchText = getApp().globalData.searchText
			if (searchText && searchText !== this.keyword) {
				this.keyword = searchText
				this.applyRealTimeFilter()
			}
		},
		onPullDownRefresh() {
			this.useCache = false;
			this.displayData = []; 
			this.lastCacheWriteScene = 'refresh';
			this.applyRealTimeFilter().then(() => {
				uni.stopPullDownRefresh();
			});
		},
		onLoad(options) {
			this.categoryCache = {};
			this.useCache = false;
			this.lastRequestedCategoryId = this.getCurrentCategoryId();
			this.lastCacheWriteScene = 'init';
			this.fetchLikesTaskIds().then(() => {
				this.colListKey++;
				this.inited = true;
			});
		},
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
		height: 45px;
		background: #fff;
		z-index: 1001;
		width: 100vw;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}
	.back-to-all-btn {
		position: fixed;
		top: 60px;
		left: 0px;
		background: #fff;
		height: 45px !important;
		width: 8%;
		z-index: 1002;
		display: flex;
		align-items: center;
		justify-content: center;
		border-right: 1px solid #f0f0f0;
		box-shadow: 2px 0 8px rgba(0,0,0,0.04);
	}
	
	.filter-icon-btn {
		position: fixed;
		top: 60px;
		right: 0px;
		background: #fff;
		height: 45px !important;
		width: 8%;
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

	.segmented-control {
		height: 40px;
	}
	.category-scroll {
		flex: 1;
		height: 100%;
		white-space: nowrap;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 0 16px; /* 左右各16px内边距，配合4.5个分类项显示 */
		box-sizing: border-box;
	}
	.category-scroll::-webkit-scrollbar {
		display: none;
	}
	.filter-icon-btn {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 4px;
	}
	.seg-item {
		display: inline-flex !important;
		flex-direction: row !important;
		align-items: center;
		justify-content: center;
		padding: 0 12px;
		height: 45px;
		box-sizing: border-box;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 15px;
		color: #666;
		border-radius: 20px;
		transition: background 0.2s, color 0.2s;
		cursor: pointer;
		flex-shrink: 0;
		position: relative;
	}
	.seg-item.active {
		background: #fff !important;
		color: #1976d2 !important;
		font-weight: 600;
	}
	.seg-underline {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 3px;
		background: #1976d2;
		border-radius: 2px;
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
	.empty-state {
		padding: 60px 20px;
		text-align: center;
		color: #999;
		font-size: 14px;
	}
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
		height: 45px;
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
	.filter-actions-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}
	.mode-switch-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		gap: 16px;
	}
	.mode-switch-btn {
		flex: 1;
		height: 45px;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	.mode-switch-btn.active {
		background-color: #1976d2;
		color: #fff;
	}
</style>
