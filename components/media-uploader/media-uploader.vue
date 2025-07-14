<template>
  <view class="media-uploader">
    <view class="media-list">
      <template v-for="(item, idx) in mediaList" :key="item.url">
        <view class="media-item" :class="{ 'is-video': item.type === 'video' }">
          <image v-if="item.type==='image'" :src="item.url" class="media-thumb" @click="onPreview(idx)" />
          <view v-else class="video-thumb" @click="onPreview(idx)">
            <image :src="item.cover || defaultVideoCover" class="media-thumb" />
            <view class="video-play-icon">
              <uni-icons type="videocam" size="32" color="#fff" />
            </view>
          </view>
          <view class="delete-btn" @click.stop="onDelete(idx)">
            <view class="delete-x"></view>
          </view>
        </view>
      </template>
      <view v-if="canAdd" class="media-item add-item" @click="onAddClick">
        <uni-icons type="plusempty" size="36" color="#bbb" />
        <text>上传</text>
      </view>
    </view>
    <view class="media-rule">{{ ruleText }}</view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxImages: { type: Number, default: 3 },
  maxVideo: { type: Number, default: 1 },
  maxImageSize: { type: Number, default: 2 * 1024 * 1024 },
  maxVideoSize: { type: Number, default: 10 * 1024 * 1024 },
  maxVideoDuration: { type: Number, default: 30 }
})
const emit = defineEmits(['update:modelValue'])
const defaultVideoCover = ref('https://cdn.uviewui.com/uview/video/poster.png')

const mediaList = computed(() => {
  // 视频优先
  const video = (props.modelValue || []).find(f => f.type === 'video')
  const images = (props.modelValue || []).filter(f => f.type === 'image')
  return video ? [video, ...images] : images
})
const canAdd = computed(() => {
  const imgCount = mediaList.value.filter(f => f.type === 'image').length
  const hasVideo = mediaList.value.some(f => f.type === 'video')
  return (imgCount < props.maxImages) || (!hasVideo && props.maxVideo > 0)
})
const ruleText = computed(() => `图片最多${props.maxImages}张，单张≤${Math.round(props.maxImageSize/1024/1024)}MB；视频1个，≤${Math.round(props.maxVideoSize/1024/1024)}MB，≤${props.maxVideoDuration}秒`)

function onAddClick() {
  const imgCount = mediaList.value.filter(f => f.type === 'image').length
  const hasVideo = mediaList.value.some(f => f.type === 'video')
  // 只剩图片名额
  if (imgCount < props.maxImages && hasVideo) {
    chooseImage()
    return
  }
  // 只剩视频名额
  if (imgCount >= props.maxImages && !hasVideo) {
    chooseVideo()
    return
  }
  // 两者都可
  uni.showActionSheet({
    itemList: ['上传图片', '上传视频'],
    success: (res) => {
      if (res.tapIndex === 0) chooseImage()
      else chooseVideo()
    }
  })
}
function chooseImage() {
  let imgCount = mediaList.value.filter(f => f.type === 'image').length
  let remain = props.maxImages - imgCount
  if (remain <= 0) {
    uni.showToast({ title: `最多只能上传${props.maxImages}张图片`, icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remain,
    sizeType: ['original', 'compressed'],
    success: res => {
      const valid = res.tempFiles.filter(f => f.size <= props.maxImageSize)
      if (valid.length < res.tempFiles.length) {
        uni.showToast({ title: '部分图片超出大小限制', icon: 'none' })
      }
      // 严格控制总数
      let imgs = props.modelValue.filter(f => f.type === 'image')
      let addImgs = valid.slice(0, remain).map(f => ({
        url: f.tempFilePath || f.path,
        type: 'image',
        is_main: false
      }))
      const video = props.modelValue.find(f => f.type === 'video')
      let newArr = video ? [video, ...imgs, ...addImgs] : [...imgs, ...addImgs]
      // 最终图片数不超过maxImages
      newArr = video ? [video, ...newArr.slice(1, props.maxImages + 1)] : newArr.slice(0, props.maxImages)
      emit('update:modelValue', newArr)
    }
  })
}
function chooseVideo() {
  const hasVideo = mediaList.value.some(f => f.type === 'video')
  if (hasVideo) {
    uni.showToast({ title: '只能上传1个视频', icon: 'none' })
    return
  }
  uni.chooseVideo({
    maxDuration: props.maxVideoDuration,
    success: res => {
      const tempFilePath = res.tempFilePath || res.path
      if (typeof res.duration === 'number' && res.duration > props.maxVideoDuration) {
        uni.showToast({ title: '视频时长不能超过' + props.maxVideoDuration + '秒', icon: 'none' })
        return
      }
      uni.getFileInfo({
        filePath: tempFilePath,
        success: info => {
          if (info.size > props.maxVideoSize) {
            uni.showToast({ title: '视频超出大小限制', icon: 'none' })
            return
          }
          // 只能有一个视频，图片不变
          const imgs = props.modelValue.filter(f => f.type === 'image')
          let newArr = [{ url: tempFilePath, type: 'video', duration: res.duration || 0, size: info.size }, ...imgs]
          // 最终图片数不超过maxImages
          newArr = [newArr[0], ...newArr.slice(1, props.maxImages + 1)]
          emit('update:modelValue', newArr)
        }
      })
    }
  })
}
function onDelete(idx) {
  const arr = [...mediaList.value]
  arr.splice(idx, 1)
  emit('update:modelValue', arr)
}
function onPreview(idx) {
  const item = mediaList.value[idx]
  if (item.type === 'image') {
    uni.previewImage({
      urls: mediaList.value.filter(f => f.type === 'image').map(f => f.url),
      current: item.url
    })
  } else if (item.type === 'video') {
    if (uni.previewMedia) {
      uni.previewMedia({
        sources: [{ url: item.url, type: 'video' }],
        current: 0
      })
    } else {
      // 兼容不支持的平台：新开全屏页面/组件
      uni.navigateTo({
        url: '/pages/fullscreen-video/fullscreen-video?src=' + encodeURIComponent(item.url)
      })
    }
  }
}
</script>

<style scoped>
.media-uploader {
  width: 100%;
}
.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.media-item {
  width: 72px;
  height: 72px;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #f7f8fa;
  margin-bottom: 0;
  margin-right: 0;
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-item:nth-child(4n) {
  margin-right: 0;
}
.media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.delete-btn {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 40px;
  height: 40px;
  background: #dddddd;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.15s, transform 0.1s;
}
.delete-btn:active {
  background: #f5f5f5;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
  transform: scale(0.92);
}
.delete-x {
  color: #fff;
  width: 4px;
  height: 4px;
  position: relative;
  left: -15px;
  top: 5px;
}
.delete-x::before,
.delete-x::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  width: 3px;
  height: 14px;
  background: #fff;
  border-radius: 2px;
}
.delete-x::before {
  transform: rotate(45deg);
}
.delete-x::after {
  transform: rotate(-45deg);
}
.video-thumb {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-play-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-item {
  background: #fafbfc;
  border: 1.5px dashed #bbb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.media-rule {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style> 