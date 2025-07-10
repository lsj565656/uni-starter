<template>
  <view class="input-bar">
    <view class="input-wrap">
      <!-- 图片选择按钮 -->
      <view class="icon-btn" @click="onChooseImage">
        <uni-icons type="image" size="26" color="#888" />
      </view>
      <textarea
        ref="input"
        class="input"
        v-model="inputValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :auto-height="false"
        :show-confirm-bar="true"
        :focus="isFocus"
        :rows="1"
        :style="{height: inputHeight + 'px'}"
        @input="onInput"
        @confirm="submit"
        @blur="onBlur"
      ></textarea>
    </view>
    <button class="send-btn" :disabled="!inputValue.trim() && images.length === 0" @click="submit">发送</button>
  </view>
  <view v-if="images.length > 0" class="image-preview-list">
    <view v-for="(img, idx) in images" :key="idx" class="image-preview-item">
      <image :src="img" class="preview-img" mode="aspectFill" />
      <view class="remove-img" @click="removeImage(idx)">×</view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommentInputBar',
  props: {
    value: String,
    placeholder: String,
    maxLength: { type: Number, default: 120 }
  },
  data() {
    return {
      inputValue: this.value || '',
      isFocus: false,
      inputHeight: 36, // 默认一行
      lineHeight: 36,  // 单行高度
      maxLines: 3,
      images: []
    }
  },
  watch: {
    value(val) { this.inputValue = val }
  },
  methods: {
    onInput(e) {
      this.inputValue = e.detail.value
      // 动态调整高度
      this.$nextTick(() => {
        const lines = (this.inputValue.match(/\n/g) || []).length + 1
        this.inputHeight = Math.min(this.maxLines, lines) * this.lineHeight
      })
      // 如果内容被清空，通知父组件退出回复状态
      if (!this.inputValue.trim()) {
        this.$emit('clear-content')
      }
    },
    submit() {
      if (!this.inputValue.trim() && this.images.length === 0) return
      this.$emit('submit', this.inputValue.trim(), this.images)
      this.inputValue = ''
      this.images = []
      this.isFocus = false
      this.inputHeight = this.lineHeight
    },
    focus() {
      this.isFocus = false
      this.$nextTick(() => {
        this.isFocus = true
      })
    },
    onBlur() {
      this.isFocus = false
      this.$emit('blur')
    },
    onChooseImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.images = this.images.concat(res.tempFilePaths)
        }
      })
    },
    removeImage(idx) {
      this.images.splice(idx, 1)
    },
    triggerKeyboardHide() {
      if (this.isFocus) {
        this.isFocus = false
        this.$emit('blur')
      }
    }
  },
  mounted() {
    // H5/APP: 监听 window resize
    if (typeof window !== 'undefined') {
      this._originHeight = window.innerHeight
      this._resizeHandler = () => {
        if (window.innerHeight > this._originHeight - 50) {
          this.triggerKeyboardHide()
        }
      }
      window.addEventListener('resize', this._resizeHandler)
    }
    // 微信小程序: 监听键盘高度变化
    if (typeof uni !== 'undefined' && uni.onKeyboardHeightChange) {
      this._keyboardChangeHandler = (res) => {
        if (res.height === 0) {
          this.triggerKeyboardHide()
        }
      }
      uni.onKeyboardHeightChange(this._keyboardChangeHandler)
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined' && this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
    }
    if (typeof uni !== 'undefined' && uni.offKeyboardHeightChange && this._keyboardChangeHandler) {
      uni.offKeyboardHeightChange(this._keyboardChangeHandler)
    }
  }
}
</script>

<style scoped>
.input-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  align-items: flex-end;
  padding: 8px 10px;
  z-index: 1000;
}
.input-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: #f5f5f5;
  border-radius: 22px;
  padding: 0 10px;
  min-height: 36px;
  max-height: 108px;
  overflow: auto;
}
.input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  min-height: 36px;
  max-height: 108px;
  line-height: 36px;
  resize: none;
  padding: 8px 0;
  outline: none;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}
.send-btn {
  margin-left: 8px;
  background: linear-gradient(90deg, #ff3b3b, #ff7b06);
  color: #fff;
  border: none;
  border-radius: 18px;
  padding: 0 18px;
  height: 36px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255,59,59,0.08);
}
.send-btn:disabled {
  background: #eee;
  color: #aaa;
}
.image-preview-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 10px 0 54px;
  background: #fff;
}
.image-preview-item {
  position: relative;
  margin-right: 8px;
}
.preview-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
}
.remove-img {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff3b3b;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}
</style>