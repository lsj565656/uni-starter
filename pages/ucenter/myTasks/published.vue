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
          <text>{{ item }}</text>
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
            :is-full="true"
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
  </view>
</template>
<script>
import { formatTime } from '@/utils/tools.js';
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
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
      showBackToAllBtn: false,
      filterExtraOptions: ['全部', '仅发布的', '发布并参与的'],
      filterExtraIndex: 0,
      error: '',
      publishedPageCache: {}, // 新增缓存对象
      cacheExpire: 60000 // 1分钟
    }
  },
  computed: {
    categoryItemStyle() {
      const screenWidth = uni.getSystemInfoSync().windowWidth || 375;
      const VISIBLE_COUNT = Math.min(this.filterOptions.length, 4.3);
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
      return (task.members || []).filter(m => m._id !== this.userId).slice(0, 4);
    },
    getMoreMemberCount(task) {
      if (!task.members) return 0;
      const members = (task.members || []).filter(m => m._id !== this.userId);
      return Math.max(0, members.length - 4);
    },
    getSwipeOptions(task) {
      const status = task.status;
      const options = [];
      if (status === 'not_started') {
        options.push({ text: '编辑', style: { background: '#1976d2', color: '#fff' }, key: 'edit' });
      }
      if (status === 'invalid') {
        options.push({ text: '删除', style: { background: '#e74c3c', color: '#fff' }, key: 'delete' });
      }
      if (status === 'finished') {
        options.push({ text: '评价', style: { background: '#ff9800', color: '#fff' }, key: 'comment' });
      }
      return options;
    },
    getCacheKey() {
      return `${this.filterIndex}_${this.filterExtraIndex}`;
    },
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
        return;
      }
      if ((!this.hasMore && !reset) || this.loading) return;
      this.loading = true;
      try {
        const res = await uniCloud.callFunction({
          name: 'getMyPublishedTasks',
          data: {
            page: this.page,
            pageSize: this.pageSize,
            userId: this.userId,
            filter: this.filterOptions[this.filterIndex],
            extra: this.filterExtraOptions[this.filterExtraIndex]
          }
        });
        if (res.result && res.result.code === 0) {
          const list = res.result.data || [];
          if (this.page === 1) {
            this.tasks = list;
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
                }
              }
            }
          } else {
            this.tasks = this.tasks.concat(list);
          }
          this.hasMore = res.result.hasMore;
          this.pagination = {
            total: res.result.total,
            page: res.result.page,
            pageSize: res.result.pageSize
          };
        }
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
      if (this.filterIndex !== idx) {
        this.filterIndex = idx;
        this.scrollCategoryToCenter(idx);
        this.page = 1;
        this.tasks = [];
        this.hasMore = true;
        this.pagination = {};
        // 切换分类时优先命中缓存
        const cacheKey = this.getCacheKey();
        const now = Date.now();
        if (this.publishedPageCache[cacheKey] && (now - this.publishedPageCache[cacheKey].ts < this.cacheExpire)) {
          const cached = this.publishedPageCache[cacheKey].data;
          this.tasks = cached.tasks;
          this.hasMore = cached.hasMore;
          this.pagination = cached.pagination;
        } else {
          this.fetchMyPublishedTasks({ reset: true });
        }
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
    updateBackToAllBtnVisibility() {
      this.$nextTick(() => {
        uni.createSelectorQuery().in(this)
          .select('#cat-0').boundingClientRect()
          .select('.category-scroll').boundingClientRect()
          .exec(res => {
            if (!res[0] || !res[1]) return;
            this.showBackToAllBtn = res[0].left < res[1].left;
          });
      });
    },
    onCategoryScroll(e) {
      this.updateBackToAllBtnVisibility();
    },
    onBackToAll() {
      this.onFilterTab(0);
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
        // 切换筛选时优先命中缓存
        const cacheKey = this.getCacheKey();
        const now = Date.now();
        if (this.publishedPageCache[cacheKey] && (now - this.publishedPageCache[cacheKey].ts < this.cacheExpire)) {
          const cached = this.publishedPageCache[cacheKey].data;
          this.tasks = cached.tasks;
          this.hasMore = cached.hasMore;
          this.pagination = cached.pagination;
        } else {
          this.fetchMyPublishedTasks({ reset: true });
        }
      }
    },
    onSwipeAction(e, task) {
      if (e.content.key === 'edit') this.editTask(task._id);
      if (e.content.key === 'delete') this.deleteTask(task._id);
      if (e.content.key === 'comment') this.goToComment(task._id);
    },
    editTask(id) {
      // 跳转到任务编辑页
      uni.navigateTo({
        url: `/pages/publish/publish?id=${id}&edit=1`
      });
    },
    deleteTask(id) {
      uni.showModal({
        title: '删除任务',
        content: '确定要删除该任务吗？删除后不可恢复',
        confirmText: '删除',
        confirmColor: '#e74c3c',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' });
            try {
              const delRes = await uniCloud.callFunction({
                name: 'deleteTask',
                data: { id }
              });
              if (delRes.result && delRes.result.code === 0) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                // 刷新列表
                this.refresh();
              } else {
                uni.showToast({ title: delRes.result?.message || '删除失败', icon: 'none' });
              }
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' });
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
    }
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
  margin-top: 45px;
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
.filter-icon-btn {
  height: 45px !important;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
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
</style> 