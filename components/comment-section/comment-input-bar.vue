<template>
  <view class="input-bar">
    <view class="input-wrap">
      <uni-easyinput
        ref="input"
        type="textarea"
        v-model="inputValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :focus="isFocus"
        :inputBorder="true"
        :trim="true"
        @input="onInput"
        @blur="onBlur"
        @confirm="submit"
      >
        <template #right>
          <uni-icons
            v-if="inputValue"
            type="clear"
            size="22"
            color="#c0c4cc"
            @mousedown="onClearMouseDown"
            @touchstart="onClearMouseDown"
            @click="clearInput"
            style="margin-right: 4px;"
          />
        </template>
      </uni-easyinput>
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
    modelValue: String,
    placeholder: String,
    maxLength: { type: Number, default: 120 }
  },
  emits: ['submit', 'blur', 'clearContent', 'update:modelValue'],
  data() {
    return {
      inputValue: this.modelValue || '',
      isFocus: false,
      images: [],
      isClearing: false
    }
  },
  watch: {
    modelValue(val) { this.inputValue = val }
  },
  methods: {
    onInput(val) {
      this.inputValue = val
      this.$emit('update:modelValue', this.inputValue)
      // 如果内容被清空，通知父组件退出回复状态
      if (!this.inputValue.trim()) {
        this.$emit('clearContent')
      }
    },
    clearInput() {
      this.isClearing = true
      this.inputValue = ''
      this.$emit('update:modelValue', '')
      this.$nextTick(() => {
        if (this.$refs.input && this.$refs.input.focus) {
          this.$refs.input.focus();
        }
        setTimeout(() => { this.isClearing = false }, 300)
      });
    },
    onClearMouseDown() {
      this.isClearing = true;
    },
    submit() {
      if (!this.inputValue.trim() && this.images.length === 0) return
      this.$emit('submit', this.inputValue.trim(), this.images)
      this.inputValue = ''
      this.images = []
      this.$emit('update:modelValue', '')
      this.isFocus = false
    },
    focus() {
      this.isFocus = false
      this.$nextTick(() => {
        this.isFocus = true
      })
    },
    onBlur() {
      this.isFocus = false
      this.$emit('blur', this.inputValue, this.isClearing)
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
        this.$emit('blur', this.inputValue)
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
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  align-items: flex-end;
  padding: 2px 4px;
  z-index: 1000;
}
.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: transparent;
  border-radius: 22px;
  padding: 0 4px;
  min-height: 36px;
  max-height: 108px;
  overflow: hidden;
}
/* 深度覆盖 uni-easyinput 的外层和 textarea 行高和高度 */
::v-deep .uni-easyinput__content {
  background: #f5f5f5 !important;
  border-radius: 18px !important;
  min-height: 60px !important;
  max-height: 60px !important;
  box-sizing: border-box;
  padding: 4px 12px !important;
  border: none !important;
}
::v-deep .uni-easyinput__content-textarea {
  min-height: 60px !important;
  max-height: 60px !important;
  line-height: 24px !important;
  font-size: 16px !important;
  color: #222 !important;
  background: transparent !important;
  padding: 0 !important;
  box-sizing: border-box;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}
::v-deep .uni-easyinput__content-textarea::-webkit-scrollbar {
  width: 4px;
  background: #f5f5f5;
}
::v-deep .uni-easyinput__content-textarea::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
::v-deep .uni-easyinput__placeholder-class {
  color: #bbb !important;
  font-size: 16px !important;
}
.send-btn {
  background: linear-gradient(90deg, #ff9800, #ffc107);
  color: #fff;
  border: none;
  border-radius: 18px;
  padding: 0 12px;
  height: 36px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255,59,59,0.08);
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
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