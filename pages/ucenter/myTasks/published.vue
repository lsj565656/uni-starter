<template>
  <view>
    <view class="filter-bar-scroll">
      <scroll-view
        class="category-scroll"
        scroll-x
        scroll-with-animation
        :scroll-left="categoryScrollLeft"
        @scroll="onCategoryScroll"
        ref="categoryScroll"
        :show-scrollbar="false"
      >
        <view
          v-for="(item, idx) in filterOptions"
          :key="idx"
          :id="'cat-' + idx"
          class="seg-item"
          :class="{active: filterIndex === idx}"
          :style="categoryItemStyle"
          @click="onFilterTab(idx)"
        >
          <uni-badge 
            v-if="categoryCounts[item] > 0"
            :text="categoryCounts[item]" 
            absolute="rightTop"
            size="small" 
            type="error"
            :offset="[-3, -3]"
          >
            <text class="seg-text">{{ item }}</text>
          </uni-badge>
          <text v-if="categoryCounts[item] <= 0" class="seg-text">{{ item }}</text>
          <view v-if="filterIndex === idx" class="seg-underline"></view>
        </view>
        <view style="display:inline-block;width:16px;height:1px"></view>
      </scroll-view>
      <view class="filter-icon-btn" @click="openFilterDrawer">
        <uni-icons type="tune" size="22" color="#1976d2" style="opacity:0.6;" />
      </view>
      <uni-popup ref="filterDrawer" type="bottom" :is-mask-click="true">
        <view class="filter-popup-content">
          <view class="filter-popup-option" v-for="(item, idx) in filterExtraOptions" :key="idx" :class="{active: filterExtraIndex === idx}" @click="onFilterExtra(idx)">
            <text>{{ item }}</text>
            <uni-icons v-if="filterExtraIndex === idx" type="checkbox-filled" color="#1976d2" size="18" style="margin-left:8px;" />
          </view>
        </view>
      </uni-popup>
    </view>
    <view class="page-content">
      <uni-swipe-action>
        <uni-swipe-action-item
          v-for="task in tasks"
          :key="task._id"
          :right-options="getSwipeOptions(task)"
          @click="(e) => onSwipeAction(e, task)"
        >
          <uni-card
            :thumbnail="task.userInfo?.avatar_file?.url || defaultAvatar"
            :title="task.name"
            :extra="getStatusText(task)"
            :sub-title="formatTime(task.start_time) + ' ~ ' + formatTime(task.end_time)"
            :is-shadow="true"
            :is-full="false"
            margin="4px 6px"
          >
            <view class="card-header-row">
              <view class="card-title-row">
                <view class="stamp">{{ task.category_name }}</view>
                <view v-if="task.user_id === userId && isUserAlsoMember(task)" class="stamp">发布并参与</view>
                <text class="reward-value">{{ task.mode === 'score' ? task.score + '积分' : task.price + '元' }}</text>
              </view>
              <view class="card-sub-row">
                <text class="meta-label">参与人数：</text>
                <text class="meta-value">{{ task.members?.length || 0 }}/{{ task.max_participants }}</text>
                <view class="avatars-row">
                  <image
                    v-for="(member, idx) in getDisplayMembers(task)"
                    :key="member._id || idx"
                    :src="member.avatar || defaultAvatar"
                    class="avatar-img"
                    :style="{ marginLeft: idx === 0 ? '0' : '-16px' }"
                  />
                  <view v-if="getMoreMemberCount(task) > 0" class="avatar-more">+{{ getMoreMemberCount(task) }}</view>
                </view>
              </view>
              <view class="card-desc-row">
                <text class="desc-text">{{ task.description || '无描述' }}</text>
              </view>
            </view>
          </uni-card>
        </uni-swipe-action-item>
      </uni-swipe-action>
      <uni-load-state
        class="load-state"
        :state="{data:tasks,pagination,hasMore,loading,error}"
        @loadMore="loadMore"
        @networkResume="refresh"
        noMoreText="没有更多了"
      />
    </view>
    <uni-drawer ref="rateDrawer" mode="right" :mask-click="false" :width="rateDrawerWidth" :style="{zIndex: 1200}">
      <view style="padding:24px 20px;min-width:240px;max-width:90vw;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;">
        <view style="font-size:17px;font-weight:600;margin-bottom:12px;">我的评价</view>
        <uni-rate :value="currentRate" allow-half readonly size="28" margin="2" />
        <view style="margin:12px 0 4px 0;color:#888;">{{ currentRateComment || '无评价内容' }}</view>
        <view style="font-size:12px;color:#aaa;">{{ currentRateTime }}</view>
        <button style="margin-top:18px;" @click="closeRateDrawer">关闭</button>
      </view>
    </uni-drawer>
    <uni-drawer ref="rateEditDrawer" mode="right" :mask-click="false" :width="rateDrawerWidth" :style="{zIndex: 1200}">
      <view style="padding:24px 20px;min-width:240px;max-width:90vw;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;">
        <view style="font-size:17px;font-weight:600;margin-bottom:12px;">任务评价</view>
        <uni-rate v-model="rateEditValue" allow-half :max="5" size="28" margin="2" />
        <uni-easyinput v-model="rateEditComment" type="textarea" maxlength="80" placeholder="请输入评价内容（80字以内）" style="margin:12px 0 4px 0;width:100%;" />
        <button style="margin-top:18px;width:100%;" :loading="rateEditLoading" @click="submitRate">提交评价</button>
        <button style="margin-top:8px;width:100%;" @click="() => { showRateEditDrawer=false; $refs.rateEditDrawer.close(); }">取消</button>
      </view>
    </uni-drawer>
		<!-- 进度查看抽屉 -->
		<uni-drawer ref="progressDrawer" mode="right" :mask-click="false" :width="rateDrawerWidth" :style="{zIndex: 1200}">
			<view style="padding:24px 20px;min-width:240px;max-width:90vw;display:flex;flex-direction:column;min-height:60vh;">
				<view class="progress-header">
					<text class="progress-title">任务进度</text>
					<uni-icons type="close" size="20" color="#999" @click="$refs.progressDrawer.close()" />
				</view>
				
				<view class="progress-content" v-if="progressData">
					<view class="task-info">
						<text class="task-name">{{ progressData.task.name }}</text>
						<text class="task-status">{{ progressData.task.status === 'in_progress' ? '进行中' : '已完成' }}</text>
					</view>
					
					<view class="members-list">
						<view v-if="progressData.progress && progressData.progress.length > 0">
							<view 
								v-for="member in progressData.progress" 
								:key="member._id" 
								class="member-item"
							>
								<view class="member-avatar">
									<cloud-image 
										v-if="member.avatar" 
										:src="member.avatar" 
										width="40rpx" 
										height="40rpx"
										style="border-radius: 50%;"
									/>
									<view v-else class="default-avatar">
										<uni-icons type="person-filled" size="20" color="#999" />
									</view>
								</view>
								
								<view class="member-info">
									<text class="member-name">{{ member.nickname }}</text>
									<text class="member-role">{{ member.is_publisher ? '发布者' : '参与者' }}</text>
								</view>
								
								<view class="member-status">
									<view v-if="member.status === 'in_progress'" class="status-loading">
										<uni-icons type="spinner-cycle" size="16" color="#1976d2" />
										<text class="status-text">进行中</text>
									</view>
									<view v-else-if="member.status === 'finished'" class="status-finished">
										<uni-icons type="checkmarkempty" size="16" color="#52c41a" />
										<text class="status-text">已完成</text>
									</view>
									<view v-else class="status-default">
										<text class="status-text">{{ member.status === 'preJoin' ? '待就绪' : member.status === 'ready' ? '已就绪' : '未知' }}</text>
									</view>
								</view>
							</view>
						</view>
						<view v-else class="no-members">
							<text class="no-members-text">暂无参与者信息</text>
						</view>
					</view>
				</view>
				
				<view class="progress-footer">
                  <view class="action-buttons">
                    <button 
                      class="refresh-btn" 
                      @click="refreshProgress"
                      :disabled="!progressData?.task?._id"
                    >
                      <uni-icons type="reload" size="16" color="#1976d2" />
                      <text>刷新进度</text>
                    </button>
                    <button 
                      class="end-task-btn" 
                      @click="endTaskFromProgress"
                      :disabled="!progressData?.allFinished"
                      :class="{ disabled: !progressData?.allFinished }"
                    >
                      <uni-icons type="checkmarkempty" size="16" color="#fff" />
                      <text>{{ isPublisherAndMember ? '确认完成' : '结束任务' }}</text>
                    </button>
                  </view>
                  <button 
                    class="close-btn" 
                    @click="$refs.progressDrawer.close()"
                  >
                    <uni-icons type="close" size="16" color="#666" />
                    <text>关闭</text>
                  </button>
                </view>
      </view>
    </uni-drawer>
    
    <!-- 就绪状态抽屉 -->
    <uni-drawer ref="readinessDrawer" mode="right" :mask-click="false" :width="rateDrawerWidth" :style="{zIndex: 1200}">
      <view style="padding:24px 20px;min-width:240px;max-width:90vw;display:flex;flex-direction:column;min-height:60vh;">
        <view class="progress-header">
          <view class="progress-title">
            <text>就绪状态</text>
            <uni-icons type="close" size="20" color="#999" @click="$refs.readinessDrawer.close()" />
          </view>
        </view>
        
        <view class="progress-content">
          <view v-if="readinessData?.progress && readinessData.progress.length > 0" class="members-list">
            <view v-for="member in readinessData.progress" :key="member._id" class="member-item">
              <view class="member-avatar">
                <image v-if="member.avatar" :src="member.avatar" class="avatar-img" />
                <view v-else class="default-avatar">{{ member.nickname?.charAt(0) || '?' }}</view>
              </view>
              <view class="member-info">
                <view class="member-name">{{ member.nickname }}</view>
                <view class="member-role">{{ member.is_publisher ? '发布者' : '参与者' }}</view>
              </view>
              <view class="member-status">
                <view v-if="member.status === 'ready'" class="status-ready">
                  <uni-icons type="checkmarkempty" size="16" color="#52c41a" />
                </view>
                <view v-else class="status-not-ready">
                  <uni-icons type="closeempty" size="16" color="#ff4757" />
                </view>
                <view class="status-text">{{ member.status === 'ready' ? '已就绪' : '未就绪' }}</view>
              </view>
              <view class="member-actions">
                <view v-if="!member.is_publisher" class="action-btn" @click="sendReminder(member)">
                  <uni-icons type="notification" size="16" color="#666" />
                </view>
                <view v-if="!member.is_publisher" class="action-btn" @click="removeJoiner(member)">
                  <uni-icons type="trash" size="16" color="#ff4757" />
                </view>
              </view>
            </view>
          </view>
          <view v-else class="no-members">
            <view class="no-members-text">暂无参与者信息</view>
          </view>
        </view>
        
        <view class="progress-footer">
          <view class="action-buttons">
            <button class="refresh-btn" @click="refreshReadiness" :disabled="!readinessData?.task?._id">
              <uni-icons type="reload" size="16" color="#1976d2" />
              <text>刷新状态</text>
            </button>
            <button class="end-task-btn" @click="startTaskFromReadiness" :disabled="!readinessData?.allReady" :class="{ disabled: !readinessData?.allReady }">
              <uni-icons type="play" size="16" color="#fff" />
              <text>开始任务</text>
            </button>
          </view>
          <button class="close-btn" @click="$refs.readinessDrawer.close()">
            <uni-icons type="close" size="16" color="#666" />
            <text>关闭</text>
          </button>
        </view>
      </view>
    </uni-drawer>
  </view>
</template>
<script>
import { formatTime } from '@/utils/tools.js';
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { mutations } from '@/uni_modules/uni-id-pages/common/store.js'
export default {
  data() {
    return {
      tasks: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      pagination: {},
      filterOptions: ['全部', '待开始', '进行中', '已完成', '已失效', '已评价'],
      filterIndex: 0,
      userId: '',
      defaultAvatar: '/static/logo.png',
      categoryScrollLeft: 0,
      filterExtraOptions: ['全部', '仅发布的', '发布并参与的'],
      filterExtraIndex: 0,
      error: '',
      publishedPageCache: {}, // 新增缓存对象
      cacheExpire: 60000, // 1分钟
      // showRatePopup: false, // 移除
      rateDrawerWidth: 300, // 默认
      currentRate: null,
      currentRateComment: '',
      currentRateTime: '',
      showRateEditDrawer: false,
      rateEditValue: 0,
      rateEditComment: '',
      rateEditLoading: false,
      rateEditTaskId: '',
      progressData: null,
      readinessData: null, // 新增：就绪状态数据
      categoryCounts: {
        '全部': 0,
        '待开始': 0,
        '进行中': 0,
        '已完成': 0,
        '已失效': 0,
        '已评价': 0
      }, // 新增：分类数量统计
    }
  },
  computed: {
    userInfo() {
      return store.userInfo
    },
    hasLogin() {
      return store.hasLogin
    },
    isPublisherAndMember() {
      if (!this.progressData?.progress) return false;
      return this.progressData.progress.some(member => 
        member._id === this.userId && member.is_publisher
      );
    },
    categoryItemStyle() {
      const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
      const VISIBLE_COUNT = Math.min(this.filterOptions.length, 4);
      const marginPx = 8;
      const itemWidth = Math.floor((screenWidth - 32 - (VISIBLE_COUNT - 1) * marginPx * 2) / VISIBLE_COUNT);
      return {
        width: itemWidth + 'px',
        margin: `0 ${marginPx}px`,
        minWidth: itemWidth + 'px',
        maxWidth: itemWidth + 'px',
        flexShrink: '0',
        background: 'none',
        boxShadow: 'none'
      };
    }
  },
  onLoad() {
    this.userId = store.userInfo._id || '';
    this.fetchMyPublishedTasks({ reset: true });
    // 动态设置抽屉宽度为 80% 屏幕宽
    let width = 300;
    try {
      const sys = uni.getSystemInfoSync();
      width = Math.floor((sys.windowWidth || 375) * 0.9);
    } catch(e) {}
    this.rateDrawerWidth = width;
  },
  onPullDownRefresh() {
    this.refresh();
  },
  onReachBottom() {
    this.loadMore();
  },
  methods: {
    formatTime,
    getStatusText(task) {
      if (task.myJoinStatus === 'evaluated') return '已评价';
      return {
        not_started: '待开始',
        in_progress: '进行中',
        finished: '已完成',
        invalid: '已失效',
        evaluated: '已评价'
      }[task.status] || '';
    },
    isUserAlsoMember(task) {
      return (task.members || []).some(m => m._id === this.userId);
    },
    getDisplayMembers(task) {
      if (!task.members) return [];
      // 显示所有参与者，包括发布者
      return (task.members || []).slice(0, 4);
    },
    getMoreMemberCount(task) {
      if (!task.members) return 0;
      // 计算所有参与者，包括发布者
      const members = (task.members || []);
      return Math.max(0, members.length - 4);
    },
    getSwipeOptions(task) {
      const status = this.filterOptions[this.filterIndex] === '已评价' ? 'evaluated' : task.status;
      const myStatus = task.myJoinStatus;
      const isPublisher = task.user_id === this.userId;
      const isAlsoMember = this.isUserAlsoMember(task);
      const options = [];
      
      // 进行中状态的特殊处理
      if (status === 'in_progress') {
        // 发布者：根据参与者完成情况显示不同按钮
        const allMembersFinished = this.checkAllMembersFinished(task);
        if (allMembersFinished) {
          // 发布者兼参与者时显示"确认完成"，否则显示"结束任务"
          const isPublisherAndMember = this.isUserAlsoMember(task);
          const buttonText = isPublisherAndMember ? '确认完成' : '结束任务';
          const buttonColor = isPublisherAndMember ? '#52c41a' : '#ff4757';
          
          options.push({ 
            text: buttonText, 
            style: { backgroundColor: '#fff', color: buttonColor, fontWeight: 'bold' }, 
            key: 'endTask' 
          });
        } else {
          options.push({ 
            text: '查看进度', 
            style: { backgroundColor: '#fff', color: '#666', fontWeight: 'bold' }, 
            key: 'viewProgress' 
          });
        }
      }
      
      // 待开始状态的处理
      if (status === 'not_started') {
        // 计算非发布者的参与者数量
        const nonPublisherMembers = (task.members || []).filter(m => m._id !== this.userId);
        const hasNonPublisherMembers = nonPublisherMembers.length > 0;
        const isPublisherAndMember = this.isUserAlsoMember(task);
        
        // 发布者兼参与者：显示查看状态按钮
        if (isPublisher && isPublisherAndMember) {
          options.push({ 
            text: '查看状态', 
            style: { backgroundColor: '#fff', color: '#666', fontWeight: 'bold' }, 
            key: 'readinessStatus' 
          });
        }
        // 仅发布者：显示开始按钮和就绪状态按钮
        else if (isPublisher && !isPublisherAndMember) {
          // 只有存在非发布者参与者时才显示开始按钮
          if (hasNonPublisherMembers) {
            options.push({ 
              text: '开始', 
              style: { backgroundColor: '#fff', color: '#1976d2', fontWeight: 'bold' }, 
              key: 'start' 
            });
          }
          
          // 显示就绪状态按钮（用于查看参与者状态）
          if (task.joined_count > 0) {
            options.push({ 
              text: '就绪状态', 
              style: { backgroundColor: '#fff', color: '#666', fontWeight: 'bold' }, 
              key: 'readinessStatus' 
            });
          }
        }
        
        options.push({ text: '编辑', style: { backgroundColor: '#fff', color: '#222', fontWeight: 'bold' }, key: 'edit' });
        options.push({ text: '删除', style: { backgroundColor: '#fff', color: 'red', fontWeight: 'bold' }, key: 'delete' });
      }
      
      if (status === 'invalid' || status === 'evaluated') {
        options.push({ text: '删除', style: { backgroundColor: '#fff', color: 'red', fontWeight: 'bold' }, key: 'delete' });
      }
      if (myStatus === 'evaluated' || status === 'evaluated') {
        options.push({ text: '查看评价', style: { backgroundColor: '#fff', color: '#222', fontWeight: 'bold' }, key: 'viewRate' });
      } else if (status === 'finished') {
        options.push({ text: '评价', style: { backgroundColor: '#fff', color: '#222', fontWeight: 'bold' }, key: 'comment' });
      }
      return options;
    },
    getCacheKey() {
      return `${this.filterIndex}_${this.filterExtraIndex}`;
    },
    // 获取我的发布任务
    async fetchMyPublishedTasks({ reset = false } = {}) {
      const cacheKey = this.getCacheKey();
      const now = Date.now();
      
      if (reset) {
        this.page = 1;
        this.tasks = [];
        this.hasMore = true;
        this.pagination = {};
      }
      
      // 只在第一页且reset=false时用缓存
      if (!reset && this.page === 1 && this.publishedPageCache[cacheKey] && (now - this.publishedPageCache[cacheKey].ts < this.cacheExpire)) {
        const cached = this.publishedPageCache[cacheKey].data;
        this.tasks = cached.tasks;
        this.hasMore = cached.hasMore;
        this.pagination = cached.pagination;
        this.categoryCounts = cached.categoryCounts;
        return;
      }
      
      if ((!this.hasMore && !reset) || this.loading) return;
      this.loading = true;
      
      try {
        const currentFilter = this.filterOptions[this.filterIndex];
        
        const res = await uniCloud.callFunction({
          name: 'getMyPublishedTasks',
          data: {
            userId: this.userId,
            page: this.page,
            pageSize: this.pageSize,
            filter: currentFilter,
            extra: this.filterExtraOptions[this.filterExtraIndex]
          }
        });
        
        if (res.result && res.result.code === 0) {
          const newTasks = res.result.data || [];
          
          if (this.page === 1) {
            this.tasks = newTasks;
            // 更新分类数量统计
            if (res.result.categoryCounts) {
              this.categoryCounts = res.result.categoryCounts;
            }
            // 写入缓存快照
            this.publishedPageCache[cacheKey] = {
              ts: now,
              data: {
                tasks: this.tasks,
                hasMore: res.result.hasMore,
                pagination: {
                  total: res.result.total,
                  page: res.result.page,
                  pageSize: res.result.pageSize
                },
                categoryCounts: this.categoryCounts
                }
            };
          } else {
            this.tasks = [...this.tasks, ...newTasks];
          }
          
          this.hasMore = res.result.hasMore || false;
          this.pagination = {
            total: res.result.total,
            page: res.result.page,
            pageSize: res.result.pageSize
          };
          
        } else {
          console.error('获取发布任务失败:', res.result);
        }
      } catch (error) {
        console.error('获取发布任务异常:', error);
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },
    loadMore() {
      if (!this.hasMore || this.loading) return;
      this.page += 1;
      // 不走缓存，直接拉下一页
      this.fetchMyPublishedTasks({ reset: false });
    },
    refresh() {
      this.page = 1;
      this.fetchMyPublishedTasks({ reset: true });
    },
    onFilterTab(idx) {
      if (this.filterIndex === idx) return;
        this.filterIndex = idx;
        this.page = 1;
        this.tasks = [];
        this.hasMore = true;
        this.pagination = {};
      
      // 滚动到选中的分类
      this.scrollCategoryToCenter(idx);
      
      // 切换分类时检查缓存有效性
        const cacheKey = this.getCacheKey();
        const now = Date.now();
        if (this.publishedPageCache[cacheKey] && (now - this.publishedPageCache[cacheKey].ts < this.cacheExpire)) {
          const cached = this.publishedPageCache[cacheKey].data;
        
        // 检查缓存中的任务状态是否与当前分类匹配
        const currentFilter = this.filterOptions[idx];
        const isCacheValid = this.checkCacheValidity(cached.tasks, currentFilter);
        
        if (isCacheValid) {
          // 缓存有效，直接使用
          this.tasks = cached.tasks;
          this.hasMore = cached.hasMore;
          this.pagination = cached.pagination;
          this.categoryCounts = cached.categoryCounts;
        } else {
          // 缓存无效，重新获取数据
          this.fetchMyPublishedTasks({ reset: true });
        }
      } else {
        // 无缓存或缓存过期，重新获取数据
        this.fetchMyPublishedTasks({ reset: true });
      }
    },
    scrollCategoryToCenter(index) {
      if (index === 0) {
        this.categoryScrollLeft = 0;
        return;
      }
      const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
      const itemStyle = this.categoryItemStyle;
      const itemWidth = parseInt(itemStyle.width);
      const itemMargin = parseInt(itemStyle.margin.split(' ')[1]);
      const itemTotalWidth = itemWidth + itemMargin * 2;
      const targetItemAbsoluteLeft = index * itemTotalWidth;
      const scrollViewVisibleWidth = screenWidth - 32;
      const targetPosition = scrollViewVisibleWidth * 0.5 - itemTotalWidth * 0.5;
      let targetScrollLeft = targetItemAbsoluteLeft - targetPosition;
      const totalWidth = this.filterOptions.length * (itemWidth + itemMargin * 2) + 16;
      const maxScrollLeft = Math.max(0, totalWidth - scrollViewVisibleWidth);
      if (targetScrollLeft < 0) targetScrollLeft = 0;
      else if (targetScrollLeft > maxScrollLeft) targetScrollLeft = maxScrollLeft;
      this.categoryScrollLeft = targetScrollLeft;
    },
    onCategoryScroll(e) {
      // 可以在这里添加滚动事件处理逻辑
    },
    openFilterDrawer() {
      this.$refs.filterDrawer.open('bottom');
    },
    onFilterExtra(idx) {
      if (this.filterExtraIndex !== idx) {
        this.filterExtraIndex = idx;
        if (this.$refs.filterDrawer) this.$refs.filterDrawer.close();
        this.page = 1;
        this.tasks = [];
        this.hasMore = true;
        this.pagination = {};
        
        // 切换筛选时检查缓存有效性
        const cacheKey = this.getCacheKey();
        const now = Date.now();
        if (this.publishedPageCache[cacheKey] && (now - this.publishedPageCache[cacheKey].ts < this.cacheExpire)) {
          const cached = this.publishedPageCache[cacheKey].data;
          
          // 检查缓存中的任务状态是否与当前分类匹配
          const currentFilter = this.filterOptions[this.filterIndex];
          const isCacheValid = this.checkCacheValidity(cached.tasks, currentFilter);
          
          if (isCacheValid) {
            // 缓存有效，直接使用
          this.tasks = cached.tasks;
          this.hasMore = cached.hasMore;
          this.pagination = cached.pagination;
            this.categoryCounts = cached.categoryCounts;
        } else {
            // 缓存无效，重新获取数据
            this.fetchMyPublishedTasks({ reset: true });
          }
        } else {
          // 无缓存或缓存过期，重新获取数据
          this.fetchMyPublishedTasks({ reset: true });
        }
      }
    },
    onSwipeAction(e, task) {
      const key = e.content?.key || e.key;
      if (key === 'edit') this.editTask(task._id);
      if (key === 'delete') this.deleteTask(task._id, task);
      if (key === 'comment') this.onRateTask(task);
      if (key === 'viewRate') this.showRateDialog(task);
      if (key === 'start') this.onStartTask(task);
      if (key === 'endTask') this.onEndTask(task);
      if (key === 'viewProgress') this.onViewProgress(task);
      if (key === 'readinessStatus') this.onViewReadinessStatus(task);
    },
    editTask(id) {
      // 跳转到任务编辑页
      uni.navigateTo({
        url: `/pages/publish/publish?id=${id}&edit=1`
      });
    },
    deleteTask(id, task) {
      let title = '删除任务', content = '确定要删除该任务吗？删除后不可恢复', confirmText = '删除';
      uni.showModal({
        title,
        content,
        confirmText,
        confirmColor: '#e74c3c',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: confirmText + '中...' });
            try {
              const delRes = await uniCloud.callFunction({
                name: 'deleteMyTask',
                data: { taskId: id, userId: this.userId }
              });
              if (delRes.result && delRes.result.code === 0) {
                uni.showToast({ title: confirmText + '成功', icon: 'success' });
                
                // 刷新当前分类数据
                this.refreshCurrentCategory();
              } else {
                uni.showToast({ title: delRes.result?.message || confirmText + '失败', icon: 'none' });
              }
            } catch (e) {
              uni.showToast({ title: confirmText + '失败', icon: 'none' });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    goToComment(id) {
      // 跳转到评论/评价页
      uni.navigateTo({
        url: `/pages/list/detail?id=${id}&from=published`
      });
    },
    showRateDialog(task) {
      // 直接用 task.rateInfo
      const info = task.rateInfo || {};
      this.currentRate = typeof info.rate === 'number' ? info.rate : null;
      this.currentRateComment = info.rate_comment || '';
      this.currentRateTime = info.rate_time ? this.formatTime(info.rate_time) : '';
      // 禁止滚动穿透（仅H5）
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'hidden';
      }
      this.$refs.rateDrawer.open();
    },
    closeRateDrawer() {
      this.$refs.rateDrawer.close();
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
      }
    },
    onRateTask(task) {
      this.rateEditTaskId = task._id;
      this.rateEditValue = 0;
      this.rateEditComment = '';
      this.showRateEditDrawer = true;
      this.$refs.rateEditDrawer.open();
    },
    async submitRate() {
      if (this.rateEditValue <= 0) {
        uni.showToast({ title: '请评分', icon: 'none' });
        return;
      }
      this.rateEditLoading = true;
      try {
        const res = await uniCloud.callFunction({
          name: 'rateTask',
          data: {
            task_id: this.rateEditTaskId,
            user_id: this.userId,
            rate: this.rateEditValue,
            rate_comment: this.rateEditComment
          }
        });
        if (res.result && res.result.code === 0) {
          uni.showToast({ title: '评价成功', icon: 'success' });
          // 1. 直接更新当前卡片状态
          const idx = this.tasks.findIndex(t => t._id === this.rateEditTaskId);
          if (idx !== -1) {
            this.tasks[idx].status = 'evaluated';
            this.tasks[idx].rateInfo = {
              rate: this.rateEditValue,
              rate_comment: this.rateEditComment,
              rate_time: Date.now()
            };
          }
          // 2. 如果当前是“已完成”分类，移除该卡片
          if (this.filterOptions[this.filterIndex] === '已完成') {
            this.tasks.splice(idx, 1);
          }
          this.showRateEditDrawer = false;
          this.$refs.rateEditDrawer.close();
        } else {
          uni.showToast({ title: res.result?.message || '评价失败', icon: 'none' });
        }
      } finally {
        this.rateEditLoading = false;
      }
    },
    isStartable(task) {
      return true;
    },
    async onStartTask(task) {
      const res = await uniCloud.callFunction({
        name: 'startTask',
        data: { taskId: task._id, userId: this.userId }
      });
      if (res.result && res.result.code === 0) {
        uni.showToast({ title: res.result.message || '任务已开始', icon: 'success' });
        
        // 更新积分（如果返回了新的积分值）
        if (res.result.score !== undefined) {
          mutations.setUserInfo({ score: res.result.score });
        }
        
        // 使用简化的状态变更处理方法
        this.handleTaskStatusChange(task._id, task.status, 'in_progress');
      } else {
        uni.showToast({ title: res.result?.message || '操作失败', icon: 'none' });
      }
    },
    async onEndTask(task) {
      const res = await uniCloud.callFunction({
        name: 'endTask',
        data: { taskId: task._id, userId: this.userId }
      });
      if (res.result && res.result.code === 0) {
        uni.showToast({ title: res.result.message || '任务已结束', icon: 'success' });
        
        // 更新积分（如果返回了新的积分值）
        if (res.result.score !== undefined) {
          mutations.setUserInfo({ score: res.result.score });
        }
        
        // 使用简化的状态变更处理方法
        this.handleTaskStatusChange(task._id, task.status, 'finished');
      } else {
        uni.showToast({ title: res.result?.message || '操作失败', icon: 'none' });
      }
    },
    async onViewProgress(task) {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await uniCloud.callFunction({
          name: 'getTaskProgress',
          data: { taskId: task._id }
        });
        uni.hideLoading();
        
        
        if (res.result && res.result.code === 0) {
          this.progressData = res.result.data;
          this.$refs.progressDrawer.open();
        } else {
          uni.showToast({ title: res.result?.message || '获取进度失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('获取进度失败:', error);
        uni.showToast({ title: '获取进度失败', icon: 'none' });
      }
    },
    
    // 查看就绪状态
    async onViewReadinessStatus(task) {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await uniCloud.callFunction({
          name: 'getTaskProgress',
          data: { taskId: task._id }
        });
        uni.hideLoading();
        
        if (res.result && res.result.code === 0) {
          // 处理数据，计算allReady状态
          const progress = res.result.data.progress || [];
          const nonPublisherMembers = progress.filter(m => !m.is_publisher);
          const allReady = nonPublisherMembers.length === 0 || 
                          nonPublisherMembers.every(m => m.status === 'ready');
          
          this.readinessData = {
            ...res.result.data,
            allReady
          };
          this.$refs.readinessDrawer.open();
        } else {
          uni.showToast({ title: res.result?.message || '获取状态失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('获取就绪状态失败:', error);
        uni.showToast({ title: '获取状态失败', icon: 'none' });
      }
    },
    
    // 刷新就绪状态
    async refreshReadiness() {
      if (!this.readinessData?.task?._id) return;
      
      try {
        uni.showLoading({ title: '刷新中...' });
        const res = await uniCloud.callFunction({
          name: 'getTaskProgress',
          data: { taskId: this.readinessData.task._id }
        });
        uni.hideLoading();
        
        if (res.result && res.result.code === 0) {
          const progress = res.result.data.progress || [];
          const nonPublisherMembers = progress.filter(m => !m.is_publisher);
          const allReady = nonPublisherMembers.length === 0 || 
                          nonPublisherMembers.every(m => m.status === 'ready');
          
          this.readinessData = {
            ...res.result.data,
            allReady
          };
          uni.showToast({ title: '刷新成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.result?.message || '刷新失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('刷新就绪状态失败:', error);
        uni.showToast({ title: '刷新失败', icon: 'none' });
      }
    },
    
    // 从就绪状态抽屉开始任务
    async startTaskFromReadiness() {
      if (!this.readinessData?.task?._id) return;
      
      const res = await uniCloud.callFunction({
        name: 'startTask',
        data: { taskId: this.readinessData.task._id, userId: this.userId }
      });
      
      if (res.result && res.result.code === 0) {
        uni.showToast({ title: res.result.message || '任务已开始', icon: 'success' });
        
        // 更新积分（如果返回了新的积分值）
        if (res.result.score !== undefined) {
          mutations.setUserInfo({ score: res.result.score });
        }
        
        // 使用简化的状态变更处理方法
        this.handleTaskStatusChange(this.readinessData.task._id, this.readinessData.task.status, 'in_progress');
        
        // 关闭抽屉
        this.$refs.readinessDrawer.close();
      } else {
        uni.showToast({ title: res.result?.message || '操作失败', icon: 'none' });
      }
    },
    
    // 发送提醒
    async sendReminder(member) {
      uni.showToast({ title: '提醒功能开发中', icon: 'none' });
      // TODO: 实现站内推送提醒功能
    },
    
    // 剔除参与者
    async removeJoiner(member) {
      uni.showModal({
        title: '剔除参与者',
        content: `确定要剔除参与者"${member.nickname}"吗？`,
        confirmText: '确定剔除',
        confirmColor: '#ff4757',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '剔除中...' });
              const res = await uniCloud.callFunction({
                name: 'removeTaskJoiner',
                data: { 
                  taskId: this.readinessData.task._id, 
                  joinerId: member._id,
                  userId: this.userId 
                }
              });
              uni.hideLoading();
              
              if (res.result && res.result.code === 0) {
                uni.showToast({ title: '剔除成功', icon: 'success' });
                // 刷新就绪状态
                this.refreshReadiness();
              } else {
                uni.showToast({ title: res.result?.message || '剔除失败', icon: 'none' });
              }
            } catch (error) {
              uni.hideLoading();
              console.error('剔除参与者失败:', error);
              uni.showToast({ title: '剔除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    async refreshProgress() {
      if (!this.progressData?.task?._id) return;
      
      try {
        uni.showLoading({ title: '刷新中...' });
        const res = await uniCloud.callFunction({
          name: 'getTaskProgress',
          data: { taskId: this.progressData.task._id }
        });
        uni.hideLoading();
        
        
        if (res.result && res.result.code === 0) {
          this.progressData = res.result.data;
          uni.showToast({ title: '刷新成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.result?.message || '刷新失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('刷新进度失败:', error);
        uni.showToast({ title: '刷新失败', icon: 'none' });
      }
    },
    
    async endTaskFromProgress() {
      if (!this.progressData?.task?._id) return;
      
      const res = await uniCloud.callFunction({
        name: 'endTask',
        data: { taskId: this.progressData.task._id, userId: this.userId }
      });
      
      
      if (res.result && res.result.code === 0) {
        uni.showToast({ title: res.result.message || '任务已结束', icon: 'success' });
        
        // 更新积分（如果返回了新的积分值）
        if (res.result.score !== undefined) {
          mutations.setUserInfo({ score: res.result.score });
        }
        
        // 使用简化的状态变更处理方法
        this.handleTaskStatusChange(this.progressData.task._id, this.progressData.task.status, 'finished');
        
        // 关闭抽屉
        this.$refs.progressDrawer.close();
      } else {
        uni.showToast({ title: res.result?.message || '操作失败', icon: 'none' });
      }
    },
    
    // 处理任务状态变更
    handleTaskStatusChange(taskId, oldStatus, newStatus) {
      
      // 直接刷新当前分类数据
      this.refreshCurrentCategory();
    },
    
    // 刷新当前分类数据
    async refreshCurrentCategory() {
      try {
        // 重置页码
        this.page = 1;
        this.hasMore = true;
        this.tasks = [];
        
        // 强制重新获取数据，不使用缓存
        await this.fetchMyPublishedTasks({ reset: true });
        
        // 强制更新UI
        this.$forceUpdate();
      } catch (error) {
        console.error('刷新数据失败:', error);
      }
    },
    
    // 检查所有成员是否完成（排除发布者）
    checkAllMembersFinished(task) {
      if (!task.members || task.members.length === 0) return false;
      // 排除发布者自己，只检查其他参与者
      const otherMembers = task.members.filter(member => member._id !== this.userId);
      if (otherMembers.length === 0) return true; // 只有发布者自己参与时，直接返回true
      return otherMembers.every(member => member.status === 'finished');
    },
    
    // 检查缓存有效性
    checkCacheValidity(cachedTasks, currentFilter) {
      if (currentFilter === '全部') {
        // 全部分类时，缓存总是有效的
        return true;
      }
      
      // 检查缓存中的任务状态是否与当前分类匹配
      const statusMap = {
        '待开始': 'not_started',
        '进行中': 'in_progress',
        '已完成': 'finished',
        '已失效': 'invalid',
        '已评价': 'evaluated'
      };
      
      const targetStatus = statusMap[currentFilter];
      if (!targetStatus) {
        console.warn('未知分类，缓存无效:', currentFilter);
        return false;
      }
      
      // 检查缓存中的所有任务是否都属于当前分类
      const isValid = cachedTasks.every(task => task.status === targetStatus);
      
      return isValid;
    },
    
    // 删除checkCacheValidity方法
  }
}
</script>
<style scoped>
.filter-bar-scroll {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 1001;
  height: 45px;
  min-height: 45px;
  max-height: 45px;
}

.page-content {
  margin-top: 50px;
}
.category-scroll {
  flex: 1;
  height: 45px;
  min-height: 45px;
  max-height: 45px;
  white-space: nowrap;
  overflow-x: auto;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
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

.seg-text {
  font-size: 14px;
  font-weight: 500;
}

.seg-item.active {
  background: #1976d2;
  color: #fff;
}

.seg-item.active .seg-text {
  color: #1976d2;
}
.seg-underline {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #1976d2;
  border-radius: 1px;
}
/* 角标样式优化 */
.seg-item .uni-badge {
  margin-right: 4px;
}

.seg-item.active .uni-badge {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}
.filter-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #fff;
  border-radius: 8px;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.filter-popup-content {
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px 0;
}
.filter-popup-option {
  padding: 16px 24px;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}
.filter-popup-option.active {
  color: #1976d2;
  background: #f0f6ff;
}
.card-header-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  margin-right: 8px;
}
.stamp {
  display: inline-block;
  background: #ff9800;
  color: #fff;
  font-size: 12px;
  border-radius: 8px;
  padding: 2px 8px;
  margin-right: 6px;
}
.reward-value {
  color: #ff9800;
  font-weight: bold;
  font-size: 15px;
  margin-left: auto;
}
.card-sub-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.meta-label { color: #888; }
.meta-value { color: #333; margin: 0 4px; }
.avatars-row {
  display: flex;
  align-items: center;
  margin-left: 8px;
}
.avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #eee;
  object-fit: cover;
  margin-left: 0;
}
.avatar-more {
  margin-left: 4px;
  font-size: 12px;
  color: #888;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 2px 6px;
}
.card-desc-row {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}
.loading, .no-more, .empty { text-align: center; color: #aaa; margin: 16px 0; }
.progress-modal {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
}
.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
  text-align: center;
}
.progress-content {
  width: 100%;
  max-height: 400px; /* Adjust height as needed */
  overflow-y: auto;
  margin-bottom: 15px;
}
.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.task-name {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin-right: 10px;
}
.task-status {
  font-size: 14px;
  color: #555;
  background: #f0f6ff;
  padding: 4px 8px;
  border-radius: 6px;
}
.members-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}
.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.member-info {
  flex: 1;
  margin-right: 10px;
}
.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.member-role {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.member-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #555;
}
.status-loading {
  display: flex;
  align-items: center;
  color: #1976d2;
}
.status-finished {
  display: flex;
  align-items: center;
  color: #52c41a;
}
.status-default {
  display: flex;
  align-items: center;
  color: #888;
}
.status-text {
  margin-left: 5px;
}
.progress-footer {
  width: 100%;
  display: flex;
  justify-content: space-around;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}
.action-buttons {
  display: flex;
  gap: 10px;
  flex: 1;
}
.refresh-btn, .end-task-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.refresh-btn {
  background-color: #f0f6ff;
  color: #1976d2;
}
.refresh-btn:active {
  background-color: #e0efff;
}
.end-task-btn {
  background-color: #1976d2;
  color: #fff;
}
.end-task-btn:active {
  background-color: #1565c0;
}
.end-task-btn.disabled {
  background-color: #ccc;
  color: #888;
  cursor: not-allowed;
}

.no-members {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx 0;
}

.no-members-text {
  font-size: 26rpx;
  color: #999;
}
	/* 进度抽屉样式 */
	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background: #f8f9fa;
	}
	
	.progress-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.progress-content {
		flex: 1;
		padding: 30rpx;
		overflow-y: auto;
	}
	
	.task-info {
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.task-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}
	
	.task-status {
		font-size: 24rpx;
		color: #1976d2;
		background: #e3f2fd;
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
	}
	
	.members-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	
	.member-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background: #f8f9fa;
		border-radius: 8rpx;
	}
	
	.member-avatar {
		margin-right: 20rpx;
	}
	
	.default-avatar {
		width: 40rpx;
		height: 40rpx;
		background: #e0e0e0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.member-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.member-name {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 4rpx;
	}
	
	.member-role {
		font-size: 22rpx;
		color: #666;
	}
	
	.member-status {
		display: flex;
		align-items: center;
	}
	
	.status-loading {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.status-finished {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.status-default {
		display: flex;
		align-items: center;
	}
	
	.status-text {
		font-size: 24rpx;
		color: #666;
	}
	
	.progress-footer {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding: 30rpx;
		border-top: 1rpx solid #f0f0f0;
		background: #f8f9fa;
	}
	
	.action-buttons {
		display: flex;
		gap: 20rpx;
	}
	
	.refresh-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		background: #fff;
		border: 1rpx solid #1976d2;
		color: #1976d2;
		border-radius: 8rpx;
		padding: 20rpx;
		font-size: 26rpx;
	}
	
	.end-task-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		background: #1976d2;
		color: #fff;
		border: none;
		border-radius: 8rpx;
		padding: 20rpx;
		font-size: 26rpx;
	}
	
	.end-task-btn.disabled {
		background: #ccc;
		color: #999;
	}

	.close-btn {
		width: 80%;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		background: #fff;
		border: 1rpx solid #666;
		color: #666;
		border-radius: 8rpx;
		padding: 20rpx;
		font-size: 26rpx;
	}
	
	.no-members {
		text-align: center;
		padding: 40rpx;
		color: #999;
	}
	
	.no-members-text {
		font-size: 26rpx;
	}
  </style> 