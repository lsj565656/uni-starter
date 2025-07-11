<template>
    <view class="comment-item">
      <image class="comment-avatar" :src="comment.commenter_avatar" :style="{ width: avatarSize+'px', height: avatarSize+'px' }" />
      <view class="comment-main">
        <view class="comment-header">
          <text class="comment-nickname">{{ comment.commenter_name }}</text>
          <text v-if="comment.commenter_id === taskOwnerId" class="author-tag">作者</text>
          <text class="comment-date">{{ formatRelativeTime(comment.createdAt) }}</text>
        </view>
        <view class="comment-content">
          <template v-if="level >= 3 && comment.target_name">
            <text class="reply-prefix">回复 </text>
            <text class="reply-to">{{ comment.target_name }}：</text>
            <text>{{ comment.content }}</text>
          </template>
          <template v-else>
            <text>{{ comment.content }}</text>
          </template>
        </view>
        <view class="comment-actions">
          <text class="action-btn" @click="$emit('reply', comment)">回复</text>
          <view class="like-btn" @click="$emit('like', comment.id)">
            <uni-icons :type="comment.is_liked ? 'heart-filled' : 'heart'" size="16" :color="comment.is_liked ? 'red' : '#bbb'" />
            <text>{{ comment.like_count || '' }}</text>
          </view>
        </view>
        
        <!-- 回复列表 -->
        <view v-if="comment.replies && comment.replies.length > 0" class="replies">
          <!-- 显示前2条回复 -->
          <template v-if="!comment.expanded && comment.replies.length > 2">
            <comment-item
              v-for="(reply, index) in comment.replies.slice(0, 2)"
              :key="reply.id"
              :comment="reply"
              :author-id="authorId"
              :task-owner-id="taskOwnerId"
              :level="level + 1"
              @reply="$emit('reply', $event)"
              @like="$emit('like', $event)"
            />
            <!-- 显示更多回复按钮 -->
            <view v-if="comment.reply_count > 2" class="more-replies" @click="onLoadMoreReplies">
              <text class="more-replies-text">查看全部{{ comment.reply_count }}条回复</text>
            </view>
          </template>
          
          <!-- 显示所有回复 -->
          <template v-else>
            <comment-item
              v-for="reply in comment.replies"
              :key="reply.id"
              :comment="reply"
              :author-id="authorId"
              :task-owner-id="taskOwnerId"
              :level="level + 1"
              @reply="$emit('reply', $event)"
              @like="$emit('like', $event)"
            />
            
            <!-- 加载更多回复 -->
            <view v-if="comment.hasMoreReplies && !comment.loadingReplies" class="load-more-replies" @click="onLoadMoreReplies">
              <text class="load-more-replies-text">加载更多回复</text>
            </view>
            
            <!-- 回复加载中 -->
            <view v-if="comment.loadingReplies" class="loading-replies">
              <text class="loading-replies-text">加载中...</text>
            </view>
            
            <!-- 收起回复 -->
            <view v-if="comment.reply_count > 2 && comment.replies.length >= comment.reply_count" class="collapse-replies" @click="$emit('collapse-replies', comment.id)">
              <text class="collapse-replies-text">收起</text>
            </view>
          </template>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  import { formatRelativeTime } from '@/utils/tools.js'
  export default {
    name: 'CommentItem',
    props: {
      comment: { type: Object, required: true },
      authorId: { type: String, default: '' },
      taskOwnerId: { type: String, default: '' },
      level: { type: Number, default: 1 }
    },
    computed: {
      avatarSize() {
        return this.level === 1 ? 32 : 26
      }
    },
    methods: {
      formatRelativeTime,
      onLoadMoreReplies() {
        this.$emit('load-more-replies', this.comment.id)
      }
    }
  }
  </script>
  
<style scoped>
  .comment-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .comment-avatar {
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
    background: #f5f5f5;
  }
  .comment-main {
    flex: 1;
  }
  .comment-nickname {
    font-weight: 500;
    margin-right: 6px;
    color: #222;
    font-size: 15px;
  }
  .author-tag {
    background: #ffe0b2;
    color: #ff9800;
    border-radius: 4px;
    font-size: 12px;
    padding: 0 4px;
    margin-right: 6px;
  }
  .comment-date {
    color: #bbb;
    font-size: 12px;
  }
  .comment-content {
    font-size: 15px;
    color: #333;
    line-height: 1.7;
    margin-bottom: 2px;
    word-break: break-all;
    display: block;
    margin-top: 2px;
  }
  .reply-to {
    color: #1976d2;
    margin-right: 2px;
    font-weight: 500;
  }
  .reply-prefix {
    color: #888;
    margin-right: 2px;
  }
  .comment-actions {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #888;
    margin-top: 2px;
  }
  .action-btn {
    margin-right: 16px;
    color: #1976d2;
  }
  .like-btn {
    display: flex;
    align-items: center;
    color: #bbb;
  }
  .like-btn text {
    margin-left: 2px;
    font-size: 13px;
  }
  .replies {
    margin-top: 6px;
  }
  .more-replies {
    padding: 8px 0;
    color: #1976d2;
    font-size: 14px;
  }
  .more-replies-text {
    cursor: pointer;
  }
  .load-more-replies {
    padding: 8px 0;
    color: #1976d2;
    font-size: 14px;
  }
  .load-more-replies-text {
    cursor: pointer;
  }
  .loading-replies {
    padding: 8px 0;
    color: #999;
    font-size: 14px;
    text-align: center;
  }
  .loading-replies-text {
    display: inline-block;
    position: relative;
  }
  .loading-replies-text::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    margin: auto;
    border: 2px solid transparent;
    border-top-color: #999;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    right: -20px;
    top: 0;
  }
  .collapse-replies {
    padding: 8px 0;
    color: #999;
    font-size: 14px;
  }
  .collapse-replies-text {
    cursor: pointer;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>