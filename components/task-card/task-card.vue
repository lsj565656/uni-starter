<template>
  <view class="masonry-card">
    <view class="custom-cover" @click="goDetail">
      <image class="cover-image" :src="task.image" mode="aspectFill" />
      <view class="cover-content">
        <text class="uni-subtitle uni-white">{{ task.name }}</text>
      </view>
    </view>
    <uni-list>
      <uni-list-item :title="task.description || task.name || '暂无描述'" showArrow></uni-list-item>
      <view class="user-info">
        <image class="user-avatar" :src="user?.avatar_file?.url || '/static/logo.png'" />
        <!-- <text class="user-nickname">{{ user?.nickname || '匿名用户' }}</text> -->
        <view class="task-type-tag">{{ task.category_name }}</view>
      </view>
    </uni-list>
    <view class="card-actions no-border">
      <view class="card-actions-item">
        <text class="card-actions-item-text">
          {{ task.mode === 'score' ? (task.score + ' 积分') : (task.price + '¥') }}
        </text>
      </view>
      <view class="card-actions-item" @click.stop="$emit('like', task)">
        <uni-icons :type="task.is_liked ? 'heart-filled' : 'heart'" size="18" :color="task.is_liked ? 'red' : '#999'" />
        <text class="card-actions-item-text">{{ task.like_count || 0 }}</text>
      </view>
      <view class="card-actions-item" @click.stop="$emit('join', task)">
        <uni-icons type="cart" size="18" color="#999" />
        <text class="card-actions-item-text">加入</text>
      </view>
    </view>
  </view>
</template>
<script>
export default {
  name: 'TaskCard',
  props: { task: Object, user: Object },
  methods: {
    goDetail() {
      uni.navigateTo({ url: '/pages/list/detail?id=' + this.task._id });
    }
  }
}
</script>
<style scoped>
.masonry-card {
  margin-bottom: 12px;
  max-height: 400px;
  overflow: hidden;
  margin: 4px 1px !important;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
}
.custom-cover { position: relative; }
.cover-image { width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0; }
.cover-content { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); padding: 4px 8px; }
.uni-subtitle.uni-white { color: #fff; font-size: 14px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-actions { display: flex; flex-direction: row; justify-content: space-around; padding: 8px 0; }
.card-actions-item { display: flex; align-items: center; }
.card-actions-item-text { margin-left: 4px; font-size: 16px; color: #666; }
.user-info {
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 2px 8px;
  border-top: 1px solid #f0f0f0;
  gap: 8px;
}
.user-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 8px;
}
.user-nickname {
  max-width: 40vw !important;
  font-size: 13px;
  color: #666;
}
.task-type-tag {
  background: #f5f5f5;
  color: #1976d2;
  font-size: 12px;
  border-radius: 6px;
  padding: 2px 8px;
  margin-left: 4px;
}
</style> 