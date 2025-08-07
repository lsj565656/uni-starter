<template>
  <view class="media-uploader">
    <view class="media-list">
      <template v-for="(item, idx) in mediaList" :key="item.url">
        <view class="media-item" :class="{ 'is-video': item.type === 'video' }">
          <image
            v-if="item.type === 'image'"
            :src="item.thumbnail || item.url"
            class="media-thumb"
            @click="onPreview(idx)"
            :draggable="true"
            mode="aspectFill"
            @error="onImageError($event, idx)"
          />
          <view v-else class="video-thumb" @click="onPreview(idx)">
            <image
              :src="item.cover || defaultVideoCover"
              class="media-thumb"
              @error="onImageError($event, idx)"
              :draggable="true"
              mode="aspectFill"
            />
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
        style="width: 100vw; height: 100vh; background: #000"
        @ended="closeVideo"
      />
      <view class="close-video-btn" @click="closeVideo">
        <view class="close-x"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBackPress } from '@dcloudio/uni-app'

const properties = defineProps({
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
  // 如果不允许视频上传，只返回图片
  if (properties.maxVideo <= 0) {
    return (properties.modelValue || []).filter(f => f.type === 'image')
  }
  
  // 视频优先
  const video = (properties.modelValue || []).find(f => f.type === 'video')
  const images = (properties.modelValue || []).filter(f => f.type === 'image')
  return video ? [video, ...images] : images
})
const canAdd = computed(() => {
  const imgCount = mediaList.value.filter(f => f.type === 'image').length
  const hasVideo = mediaList.value.some(f => f.type === 'video')
  
  // 如果不允许视频上传，只检查图片数量
  if (properties.maxVideo <= 0) {
    return imgCount < properties.maxImages
  }
  
  return imgCount < properties.maxImages || (!hasVideo && properties.maxVideo > 0)
})
const ruleText = computed(() => {
  const imageText = `图片最多${properties.maxImages}张，单张≤${Math.round(properties.maxImageSize / 1024 / 1024)}MB`
  
  // 如果不允许视频上传，只显示图片规则
  if (properties.maxVideo <= 0) {
    return imageText
  }
  
  return `${imageText}；视频1个，≤${Math.round(properties.maxVideoSize / 1024 / 1024)}MB，≤${properties.maxVideoDuration}秒`
})

// 全屏video播放相关
const showVideo = ref(false)
const currentVideoUrl = ref('')

onMounted(() => {
  onBackPress(() => {
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
  
  // 如果不允许视频上传，直接选择图片
  if (properties.maxVideo <= 0) {
    chooseImage()
    return
  }
  
  // 只剩图片名额
  if (imgCount < properties.maxImages && hasVideo) {
    chooseImage()
    return
  }
  // 只剩视频名额
  if (imgCount >= properties.maxImages && !hasVideo) {
    chooseVideo()
    return
  }
  // 两者都可
  uni.showActionSheet({
    itemList: ['上传图片', '上传视频'],
    success: res => {
      if (res.tapIndex === 0) chooseImage()
      else chooseVideo()
    }
  })
}
function chooseImage() {
  const imgCount = mediaList.value.filter(f => f.type === 'image').length
  const remain = properties.maxImages - imgCount
  if (remain <= 0) {
    uni.showToast({ title: `最多只能上传${properties.maxImages}张图片`, icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remain,
    sizeType: ['original', 'compressed'],
    success: res => {
      const valid = res.tempFiles.filter(f => f.size <= properties.maxImageSize)
      if (valid.length < res.tempFiles.length) {
        uni.showToast({ title: '部分图片超出大小限制', icon: 'none' })
      }
      // 严格控制总数
      const imgs = properties.modelValue.filter(f => f.type === 'image')
      const addImgs = valid.slice(0, remain).map(f => ({
        url: f.tempFilePath || f.path,
        thumbnail: f.tempFilePath || f.path, // 使用原图作为缩略图
        type: 'image',
        is_main: false
      }))
      
      // 如果不允许视频上传，只处理图片
      if (properties.maxVideo <= 0) {
        const newArray = [...imgs, ...addImgs].slice(0, properties.maxImages)
        emit('update:modelValue', newArray)
        return
      }
      
      const video = properties.modelValue.find(f => f.type === 'video')
      let newArray = video ? [video, ...imgs, ...addImgs] : [...imgs, ...addImgs]
      // 最终图片数不超过maxImages
      newArray = video
        ? [video, ...newArray.slice(1, properties.maxImages + 1)]
        : newArray.slice(0, properties.maxImages)
      emit('update:modelValue', newArray)
    }
  })
}
function chooseVideo() {
  // 如果不允许视频上传，直接返回
  if (properties.maxVideo <= 0) {
    uni.showToast({ title: '不支持视频上传', icon: 'none' })
    return
  }
  
  const hasVideo = mediaList.value.some(f => f.type === 'video')
  console.log('[chooseVideo] hasVideo:', hasVideo)
  if (hasVideo) {
    uni.showToast({ title: '只能上传1个视频', icon: 'none' })
    return
  }
  uni.chooseVideo({
    maxDuration: properties.maxVideoDuration,
    success: res => {
      const temporaryFilePath = res.tempFilePath || res.path
      console.log('[chooseVideo] tempFilePath:', temporaryFilePath, res)
      if (typeof res.duration === 'number' && res.duration > properties.maxVideoDuration) {
        uni.showToast({
          title: '视频时长不能超过' + properties.maxVideoDuration + '秒',
          icon: 'none'
        })
        return
      }
      uni.getFileInfo({
        filePath: temporaryFilePath,
        success: info => {
          console.log('[chooseVideo] getFileInfo:', info)
          if (info.size > properties.maxVideoSize) {
            uni.showToast({ title: '视频超出大小限制', icon: 'none' })
            return
          }
          // 生成视频封面
          getVideoCover(temporaryFilePath)
            .then(coverPath => {
              console.log('[chooseVideo] getVideoCover result:', coverPath)
              const imgs = properties.modelValue.filter(f => f.type === 'image')
              let newArray = [
                {
                  url: temporaryFilePath,
                  type: 'video',
                  duration: res.duration || 0,
                  size: info.size,
                  cover: coverPath // 新增封面
                },
                ...imgs
              ]
              newArray = [newArray[0], ...newArray.slice(1, properties.maxImages + 1)]
              console.log('[chooseVideo] emit update:modelValue', newArray)
              emit('update:modelValue', newArray)
            })
            .catch(error => {
              console.error('[chooseVideo] getVideoCover error:', error)
              // 兜底
              const imgs = properties.modelValue.filter(f => f.type === 'image')
              let newArray = [
                {
                  url: temporaryFilePath,
                  type: 'video',
                  duration: res.duration || 0,
                  size: info.size,
                  cover: defaultVideoCover.value
                },
                ...imgs
              ]
              newArray = [newArray[0], ...newArray.slice(1, properties.maxImages + 1)]
              emit('update:modelValue', newArray)
            })
        },
        fail: error => {
          console.error('[chooseVideo] getFileInfo fail:', error)
        }
      })
    },
    fail: error => {
      console.error('[chooseVideo] uni.chooseVideo fail:', error)
    }
  })
}
// 获取视频第一帧封面（H5/APP/小程序兼容，简单降级，保证一定resolve）
function getVideoCover(videoPath) {
  return new Promise(resolve => {
    let resolved = false
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus.video && plus.video.getVideoInfo) {
      plus.video.getVideoInfo({
        src: videoPath,
        success: function (info) {
          resolved = true
          if (info.cover) resolve(info.cover)
          else resolve(defaultVideoCover.value)
        },
        fail: function () {
          resolved = true
          resolve(defaultVideoCover.value)
        }
      })
      setTimeout(() => {
        if (!resolved) resolve(defaultVideoCover.value)
      }, 3000)
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
        const context = canvas.getContext('2d')
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolved = true
        resolve(canvas.toDataURL('image/png'))
      })
      setTimeout(() => {
        if (!resolved) resolve(defaultVideoCover.value)
      }, 3000)
    } catch {
      resolve(defaultVideoCover.value)
    }
    // #endif
    // #ifdef MP-WEIXIN
    resolve(defaultVideoCover.value)
    // #endif
    // 兜底
    setTimeout(() => {
      if (!resolved) resolve(defaultVideoCover.value)
    }, 3000)
  })
}
function onImageError(e, index) {
  const item = mediaList.value[index]
  if (item) {
    if (item.type === 'video') {
      item.cover = defaultVideoCover.value
    } else if (item.type === 'image') {
      // 如果缩略图加载失败，使用原图
      if (item.thumbnail && item.thumbnail !== item.url) {
        item.thumbnail = item.url
      } else {
        console.log('onImageError')
      }
    }
  }
}
function onDelete(index) {
  const array = [...mediaList.value]
  array.splice(index, 1)
  emit('update:modelValue', array)
}
function onPreview(index) {
  const item = mediaList.value[index]
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    background 0.15s,
    transform 0.1s;
}

.delete-btn:active {
  background: #f5f5f5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
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
  background: rgba(0, 0, 0, 0.5);
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

.close-x::before {
  transform: rotate(45deg);
}

.close-x::after {
  transform: rotate(-45deg);
}
</style>
