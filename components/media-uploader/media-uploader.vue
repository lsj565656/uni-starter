<template>
  <view class="media-uploader">
    <view class="media-list">
      <template v-for="(item, idx) in mediaList" :key="item.url">
        <view class="media-item" :class="{ 'is-video': item.type === 'video' }">
          <image v-if="item.type==='image'" :src="item.url" class="media-thumb" @click="onPreview(idx)" :draggable="true" />
          <view v-else class="video-thumb" @click="onPreview(idx)">
            <image :src="item.cover || defaultVideoCover" class="media-thumb" @error="onImageError($event, idx)" />
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
    <!-- 全屏video播放 -->
    <view v-if="showVideo" class="fullscreen-video">
      <video
        :src="currentVideoUrl"
        title="待上传视频"
        controls
        :autoplay="true"
        :loop="true"
        :muted="true"
        :page-gesture="true"
        :vslide-gesture="true"
        :show-center-play-btn="true"
        :show-mute-btn="true"
        style="width: 100vw; height: 100vh; background: #000;"
        @ended="closeVideo"
      />
      <view class="close-video-btn" @click="closeVideo">
        <view class="close-x"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { onBackPress } from '@dcloudio/uni-app'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxImages: { type: Number, default: 3 },
  maxVideo: { type: Number, default: 1 },
  maxImageSize: { type: Number, default: 2 * 1024 * 1024 },
  maxVideoSize: { type: Number, default: 10 * 1024 * 1024 },
  maxVideoDuration: { type: Number, default: 30 }
})
const emit = defineEmits(['update:modelValue'])
const defaultVideoCover = ref('/static/icons/videoCover.png')

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

// 全屏video播放相关
const showVideo = ref(false)
const currentVideoUrl = ref('')

onMounted(() => {
  onBackPress((e) => {
    if (showVideo.value) {
      showVideo.value = false
      return true // 拦截返回
    }
    return false
  })
})
onBeforeUnmount(() => {
  showVideo.value = false
})

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
  console.log('[chooseVideo] hasVideo:', hasVideo)
  if (hasVideo) {
    uni.showToast({ title: '只能上传1个视频', icon: 'none' })
    return
  }
  uni.chooseVideo({
    maxDuration: props.maxVideoDuration,
    success: res => {
      const tempFilePath = res.tempFilePath || res.path
      console.log('[chooseVideo] tempFilePath:', tempFilePath, res)
      if (typeof res.duration === 'number' && res.duration > props.maxVideoDuration) {
        uni.showToast({ title: '视频时长不能超过' + props.maxVideoDuration + '秒', icon: 'none' })
        return
      }
      uni.getFileInfo({
        filePath: tempFilePath,
        success: info => {
          console.log('[chooseVideo] getFileInfo:', info)
          if (info.size > props.maxVideoSize) {
            uni.showToast({ title: '视频超出大小限制', icon: 'none' })
            return
          }
          // 生成视频封面
          getVideoCover(tempFilePath).then(coverPath => {
            console.log('[chooseVideo] getVideoCover result:', coverPath)
            const imgs = props.modelValue.filter(f => f.type === 'image')
            let newArr = [{
              url: tempFilePath,
              type: 'video',
              duration: res.duration || 0,
              size: info.size,
              cover: coverPath // 新增封面
            }, ...imgs]
            newArr = [newArr[0], ...newArr.slice(1, props.maxImages + 1)]
            console.log('[chooseVideo] emit update:modelValue', newArr)
            emit('update:modelValue', newArr)
          }).catch(err => {
            console.error('[chooseVideo] getVideoCover error:', err)
            // 兜底
            const imgs = props.modelValue.filter(f => f.type === 'image')
            let newArr = [{
              url: tempFilePath,
              type: 'video',
              duration: res.duration || 0,
              size: info.size,
              cover: defaultVideoCover.value
            }, ...imgs]
            newArr = [newArr[0], ...newArr.slice(1, props.maxImages + 1)]
            emit('update:modelValue', newArr)
          })
        },
        fail: err => {
          console.error('[chooseVideo] getFileInfo fail:', err)
        }
      })
    },
    fail: err => {
      console.error('[chooseVideo] uni.chooseVideo fail:', err)
    }
  })
}
// 获取视频第一帧封面（H5/APP/小程序兼容，简单降级，保证一定resolve）
function getVideoCover(videoPath) {
  return new Promise((resolve) => {
    let resolved = false
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus.video && plus.video.getVideoInfo) {
      plus.video.getVideoInfo({
        src: videoPath,
        success: function(info) {
          resolved = true
          if (info.cover) resolve(info.cover)
          else resolve(defaultVideoCover.value)
        },
        fail: function() {
          resolved = true
          resolve(defaultVideoCover.value)
        }
      })
      setTimeout(() => { if (!resolved) resolve(defaultVideoCover.value) }, 3000)
      return
    }
    // #endif
    // #ifdef H5
    try {
      const video = document.createElement('video')
      video.src = videoPath
      video.crossOrigin = 'anonymous'
      video.currentTime = 0.1
      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolved = true
        resolve(canvas.toDataURL('image/png'))
      })
      setTimeout(() => { if (!resolved) resolve(defaultVideoCover.value) }, 3000)
    } catch (e) {
      resolve(defaultVideoCover.value)
    }
    // #endif
    // #ifdef MP-WEIXIN
    resolve(defaultVideoCover.value)
    // #endif
    // 兜底
    setTimeout(() => { if (!resolved) resolve(defaultVideoCover.value) }, 3000)
  })
}
function onImageError(e, idx) {
  if (mediaList.value[idx] && mediaList.value[idx].type === 'video') {
    mediaList.value[idx].cover = defaultVideoCover.value
  }
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
    // 直接用video全屏播放
    currentVideoUrl.value = item.url
    showVideo.value = true
  }
}
function closeVideo() {
  showVideo.value = false
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
.fullscreen-video {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  background: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-video-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 36px;
  height: 36px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.close-x {
  width: 18px;
  height: 18px;
  position: relative;
}
.close-x::before,
.close-x::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  width: 2px;
  height: 18px;
  background: #fff;
  border-radius: 1px;
}
.close-x::before { transform: rotate(45deg);}
.close-x::after { transform: rotate(-45deg);}
</style> 