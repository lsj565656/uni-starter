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
          <template v-if="level > 2 && comment.target_name">
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
        <!-- 二级及以上回复 -->
        <view v-if="comment.replies && comment.replies.length > 0" class="replies">
          <comment-item
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :author-id="authorId"
            :task-owner-id="taskOwnerId"
            :level="level+1"
            @reply="$emit('reply', $event)"
            @like="$emit('like', $event)"
          />
          <view v-if="comment.reply_count > comment.replies.length" class="expand-replies" @click="$emit('expand-replies', comment.id)">
            展开全部{{ comment.reply_count }}条回复
          </view>
          <view v-else-if="comment.reply_count > 2 && comment.replies.length === comment.reply_count" class="collapse-replies" @click="$emit('collapse-replies', comment.id)">
            收起
          </view>
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
  .comment-header {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #888;
    margin-bottom: 2px;
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
</style>