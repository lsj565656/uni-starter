<template>
    <view class="comment-section">
      <view class="comment-header">
        <text class="comment-count">{{ totalCount }} 条评论</text>
      </view>
      <view v-if="comments.length === 0" class="comment-empty">暂无评论</view>
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
        />
        <view class="comment-footer">没有更多评论</view>
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
      taskOwnerId: { type: String, default: '' }
    },
    emits: ['submit', 'blur', 'clearContent'],
    data() {
      return {
        inputValue: '',
        replyTo: null,
        showInputBar: false // 新增
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
        console.log(' onReply do !');
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
        // 输入内容被清空，退出回复状态
        this.replyTo = null
      },
      onInputBlur() {
        console.log(' section onInputBlur do !');
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
      },
      onLike(commentId) {
        this.$emit('like', commentId)
      },
      onExpandReplies(commentId) {
        this.$emit('expand-replies', commentId)
      },
      onCollapseReplies(commentId) {
        this.$emit('collapse-replies', commentId)
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
    padding: 16px 16px 8px 16px;
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
  .input-mask {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(0,0,0,0.01);
    z-index: 999;
  }
  </style>