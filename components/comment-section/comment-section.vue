<template>
    <view class="comment-section">
      <view class="comment-header">
        <text class="comment-count">{{ totalCount }} 条评论</text>
      </view>
      <view v-if="comments.length === 0 && !loading" class="comment-empty">暂无评论</view>
      <view v-else>
        <comment-item
          v-for="item in comments"
          :key="item.id"
          :comment="item"
          :author-id="authorId"
          :task-owner-id="taskOwnerId"
          @reply="onReply"
          @like="onLike"
          @expand-replies="onExpandReplies"
          @collapse-replies="onCollapseReplies"
          @load-more-replies="onLoadMoreReplies"
        />
        
        <!-- 加载更多评论 -->
        <view v-if="hasMore && !loading" class="load-more" @click="onLoadMore">
          <text class="load-more-text">加载更多评论</text>
        </view>
        
        <!-- 加载中 -->
        <view v-if="loading" class="loading">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 没有更多 -->
        <view v-if="!hasMore && comments.length > 0" class="comment-footer">没有更多评论</view>
      </view>
      <view v-if="showInputBar" class="input-mask" @click="onInputMaskClick"></view>
      <comment-input-bar
        v-if="showInputBar"
        ref="inputBar"
        v-model="inputValue"
        :placeholder="replyPlaceholder"
        :max-length="120"
        @submit="onSubmit"
        @blur="onInputBlur"
        @clear-content="onInputBarClear"
      />
    </view>
  </template>
  
  <script>
  import CommentItem from './comment-item.vue'
  import CommentInputBar from './comment-input-bar.vue'
  
  export default {
    name: 'CommentSection',
    components: { CommentItem, CommentInputBar },
    props: {
      comments: { type: Array, default: () => [] },
      totalCount: { type: Number, default: 0 },
      authorId: { type: String, default: '' },
      taskOwnerId: { type: String, default: '' },
      loading: { type: Boolean, default: false },
      hasMore: { type: Boolean, default: false }
    },
    emits: ['submit', 'blur', 'clearContent', 'load-more', 'expand-replies', 'collapse-replies', 'load-more-replies'],
    data() {
      return {
        inputValue: '',
        replyTo: null,
        showInputBar: false
      }
    },
    computed: {
      replyPlaceholder() {
        return this.replyTo && this.replyTo.commentId
          ? `回复 ${this.replyTo.nickname}`
          : '说点什么吧...'
      }
    },
    methods: {
      onReply(comment) {
        // 禁止回复自己的评论
        if (comment.commenter_id === this.authorId) {
          uni.showToast({ title: '不能评论自己的评论', icon: 'none' });
          return;
        }
        this.replyTo = { commentId: comment.id, nickname: comment.commenter_name }
        this.showInputBar = true
        this.$nextTick(() => {
            // 兼容直接调用子组件的 focus 方法（H5/小程序）
            if (this.$refs.inputBar && this.$refs.inputBar.focus) {
                this.$refs.inputBar.focus()
            } else if (this.$refs.inputBar && this.$refs.inputBar.$refs && this.$refs.inputBar.$refs.input) {
                // 兼容 Vue2 下的 $refs.input
                this.$refs.inputBar.$refs.input.focus && this.$refs.inputBar.$refs.input.focus()
            }
        })
      },
      onInputBarClear() {
        // 输入内容被清空，不退出回复状态
      },
      onInputBlur() {
        setTimeout(() => {
          this.$emit('blur', this.inputValue); // 关键：把内容传递给父组件
          this.replyTo = null
          this.showInputBar = false
          if (typeof uni !== 'undefined' && uni.hideKeyboard) uni.hideKeyboard()
        }, 100)
      },
      onInputMaskClick() {
        this.replyTo = null;
        this.showInputBar = false;
        if (typeof uni !== 'undefined' && uni.hideKeyboard) uni.hideKeyboard();
      },
      onSubmit(content, images) {
        this.$emit('submit', {
          content,
          replyTo: this.replyTo,
          images
        })
        this.inputValue = ''
        this.replyTo = null
        this.showInputBar = false
        this.$emit('update') // 新增：通知父组件刷新评论列表
      },
      onLike(commentId) {
        this.$emit('like', commentId)
      },
      onExpandReplies(commentId) {
        this.$emit('expand-replies', commentId)
      },
      onCollapseReplies(commentId) {
        this.$emit('collapse-replies', commentId)
      },
      onLoadMore() {
        this.$emit('load-more')
      },
      onLoadMoreReplies(commentId) {
        this.$emit('load-more-replies', commentId)
      }
    }
  }
  </script>
  
  <style scoped>
  .comment-section {
    background: #fff;
    padding-bottom: 70px;
    padding: 0 16px;
  }
  .comment-header {
    font-size: 16px;
    font-weight: 600;
    padding: 16px 16px 16px 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .comment-count {
    color: #222;
  }
  .comment-empty {
    color: #aaa;
    text-align: center;
    margin: 40px 0 20px 0;
  }
  .comment-footer {
    color: #bbb;
    text-align: center;
    font-size: 13px;
    margin: 18px 0 10px 0;
  }
  .load-more {
    text-align: center;
    padding: 16px 0;
    color: #1976d2;
    font-size: 14px;
  }
  .load-more-text {
    cursor: pointer;
  }
  .loading {
    text-align: center;
    padding: 16px 0;
    color: #999;
    font-size: 14px;
  }
  .loading-text {
    display: inline-block;
    position: relative;
  }
  .loading-text::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    margin: auto;
    border: 2px solid transparent;
    border-top-color: #999;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    right: -24px;
    top: 0;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .input-mask {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(0,0,0,0.01);
    z-index: 999;
  }
  </style>