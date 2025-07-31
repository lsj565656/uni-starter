<template>
  <view class="edit-profile-container">
    <!-- 使用官方uni-nav-bar组件 -->
    <uni-nav-bar :fixed="true" :border="false" :shadow="false" :statusBar="true" background-color="#fff" color="#333"
      left-icon="left" left-text="" title="编辑我的信息卡" @clickLeft="goBack">
      <template #right>
        <view class="nav-right-btn" @click="saveProfile">
          <text class="save-text">保存</text>
        </view>
      </template>
    </uni-nav-bar>

    <scroll-view class="content-scroll" scroll-y>
      <!-- 基本信息 -->
      <view class="section">
        <view class="section-title">基本信息</view>

        <!-- 头像 -->
        <view class="avatar-section">
          <view class="avatar-wrapper">
            <image :src="userInfo.avatar_file.url || '/static/default-avatar.png'" class="avatar-image"
              mode="aspectFill" />
          </view>
        </view>

        <!-- 昵称 -->
        <view class="form-item">
          <text class="form-label">昵称</text>
          <view class="readonly-input">
            <text class="readonly-text">{{ userInfo.nickname || '未设置' }}</text>
          </view>
        </view>

        <!-- 性别 -->
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="readonly-input">
            <text class="readonly-text">{{ getGenderText(userInfo.gender) }}</text>
          </view>
        </view>

        <!-- 年龄 -->
        <view class="form-item">
          <text class="form-label">年龄</text>
          <picker :value="ageIndex" :range="ageOptions" range-key="label" @change="onAgeChange">
            <view class="picker-item">
              <text class="picker-text">{{ formData.age ? `${formData.age}岁` : '请选择年龄' }}</text>
              <uni-icons type="right" size="16" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 学历 -->
        <view class="form-item">
          <text class="form-label">学历</text>
          <picker :value="educationIndex" :range="educationOptions" @change="onEducationChange">
            <view class="picker-item">
              <text class="picker-text">{{ formData.education || '请选择学历' }}</text>
              <uni-icons type="right" size="16" color="#999" />
            </view>
          </picker>
        </view>

        <!-- 城市 -->
        <view class="form-item">
          <text class="form-label">常驻城市</text>
          <uni-data-picker :localdata="areaPickerData" popup-title="请选择地区" placeholder="请选择省市"
            v-model="formData.location" @change="onAreaChange" />
          <view v-if="formData.location_text && formData.location_text.length > 0" class="picker-value">
            {{ formData.location_text.join(' ') }}
          </view>
        </view>
      </view>

      <!-- 技能与标签 -->
      <view class="section">
        <view class="section-title">技能与标签</view>

        <!-- 技能标签 -->
        <view class="form-item">
          <text class="form-label">技能标签</text>
          <view class="tag-input-wrapper">
            <view class="tag-list">
              <view v-for="(skill, index) in formData.skills" :key="index" class="tag-item">
                <text class="tag-text">{{ skill }}</text>
                <uni-icons type="close" size="14" color="#999" @click="removeSkill(index)" />
              </view>
            </view>
            <view class="tag-input-row">
              <input v-model="newSkill" class="tag-input" placeholder="添加技能标签" @confirm="addSkill" />
              <button class="add-btn" @click="addSkill">添加</button>
            </view>
          </view>
        </view>

        <!-- 擅长领域 -->
        <view class="form-item">
          <text class="form-label">擅长领域</text>
          <view class="tag-input-wrapper">
            <view class="tag-list">
              <view v-for="(tag, index) in formData.tags" :key="index" class="tag-item">
                <text class="tag-text">{{ tag }}</text>
                <uni-icons type="close" size="14" color="#999" @click="removeTag(index)" />
              </view>
            </view>
            <view class="tag-input-row">
              <input v-model="newTag" class="tag-input" placeholder="添加擅长领域" @confirm="addTag" />
              <button class="add-btn" @click="addTag">添加</button>
            </view>
          </view>
        </view>

        <!-- 个人长处 -->
        <view class="form-item">
          <text class="form-label">个人长处</text>
          <textarea v-model="formData.strengths" class="form-textarea" placeholder="请描述你的个人长处和优势..." maxlength="200" />
          <text class="char-count">{{ formData.strengths.length }}/200</text>
        </view>
      </view>

      <!-- 照片管理 -->
      <view class="section">
        <view class="section-title">照片管理</view>

        <!-- 个人照片 -->
        <view class="form-item">
          <text class="form-label">个人照片</text>
          <view class="photo-grid">
            <view v-for="(photo, index) in formData.photos" :key="index" class="photo-item">
              <image :src="photo" class="photo-image" mode="aspectFill" />
              <view class="photo-delete" @click="removePhoto(index)">
                <uni-icons type="close" size="16" color="#fff" />
              </view>
            </view>
            <view v-if="formData.photos.length < 6" class="photo-add" @click="choosePhotos">
              <uni-icons type="plus" size="30" color="#999" />
              <text class="add-text">添加照片</text>
            </view>
          </view>
          <text class="photo-tip">最多可上传6张个人照片</text>
        </view>

        <!-- 毕业证书 -->
        <view class="form-item">
          <text class="form-label">毕业证书（仅用于认证）</text>
          <view class="cert-grid">
            <view v-for="(cert, index) in formData.diploma_photos" :key="index" class="cert-item">
              <image :src="cert" class="cert-image" mode="aspectFill" />
              <view class="cert-delete" @click="removeDiploma(index)">
                <uni-icons type="close" size="16" color="#fff" />
              </view>
            </view>
            <view v-if="formData.diploma_photos.length < 3" class="cert-add" @click="chooseDiploma">
              <uni-icons type="plus" size="30" color="#999" />
              <text class="add-text">上传证书</text>
            </view>
          </view>
          <text class="cert-tip">证书仅用于平台认证，不会对外展示</text>
        </view>

        <!-- 职业证书 -->
        <view class="form-item">
          <text class="form-label">职业证书（仅用于认证）</text>
          <view class="cert-grid">
            <view v-for="(cert, index) in formData.certificate_photos" :key="index" class="cert-item">
              <image :src="cert" class="cert-image" mode="aspectFill" />
              <view class="cert-delete" @click="removeCertificate(index)">
                <uni-icons type="close" size="16" color="#fff" />
              </view>
            </view>
            <view v-if="formData.certificate_photos.length < 3" class="cert-add" @click="chooseCertificate">
              <uni-icons type="plus" size="30" color="#999" />
              <text class="add-text">上传证书</text>
            </view>
          </view>
          <text class="cert-tip">证书仅用于平台认证，不会对外展示</text>
        </view>
      </view>

      <!-- 展示设置 -->
      <view class="section">
        <view class="section-title">展示设置</view>

        <!-- 字段展示控制 -->
        <view class="form-item">
          <text class="form-label">信息展示控制</text>
          <view class="switch-list">
            <view v-for="field in showFields" :key="field.key" class="switch-item">
              <text class="switch-label">{{ field.label }}</text>
              <switch :checked="formData.show_fields[field.key]"
                @change="(e) => toggleShowField(field.key, e.detail.value)" color="#007aff" />
            </view>
          </view>
        </view>

        <!-- 是否在趴活广场展示 -->
        <view class="form-item">
          <view class="switch-item">
            <text class="switch-label">在趴活广场展示我的信息</text>
            <switch :checked="formData.is_active" @change="(e) => formData.is_active = e.detail.value"
              color="#007aff" />
          </view>
        </view>

        <!-- 是否允许主页查看 -->
        <view class="form-item">
          <view class="switch-item">
            <text class="switch-label">允许他人通过我的主页查看趴活信息</text>
            <switch :checked="formData.allow_homepage_view"
              @change="(e) => formData.allow_homepage_view = e.detail.value" color="#007aff" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { areaList } from '@/common/areaList.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { computed, onMounted, ref } from 'vue'

// 响应式数据
const formData = ref({
  age: '',
  education: '',
  city: '',
  location: [], // 省市value数组
  location_text: [], // 省市文本数组
  skills: [],
  tags: [],
  strengths: '',
  photos: [],
  diploma_photos: [],
  certificate_photos: [],
  show_fields: {
    age: true,
    gender: true,
    education: true,
    city: true,
    skills: true,
    strengths: true,
    tags: true,
    photos: true
  },
  is_active: true,
  allow_homepage_view: false
})

// 获取用户信息
const userInfo = computed(() => store.userInfo)

const newSkill = ref('')
const newTag = ref('')

// 选项数据
const educationOptions = ['高中', '大专', '本科', '硕士', '博士']

// 年龄选项 (18-60岁)
const ageOptions = Array.from({ length: 43 }, (_, i) => ({
  value: i + 18,
  label: `${i + 18}岁`
}))

// 地区数据
function parseAreaList(areaList) {
  // 省
  const provinces = Object.entries(areaList.provinces).map(([code, name]) => ({
    text: name,
    value: code,
    children: []
  }))
  // 市
  const cities = Object.entries(areaList.cities).map(([code, name]) => ({
    text: name,
    value: code,
    provinceCode: code.slice(0, 2) + '0000', // 前2位+0000
    children: []
  }))
  // 组装
  for (const province of provinces) {
    province.children = cities.filter(city => city.provinceCode === province.value)
  }
  return provinces
}
const areaPickerData = parseAreaList(areaList)

const showFields = [
  { key: 'age', label: '年龄' },
  { key: 'gender', label: '性别' },
  { key: 'education', label: '学历' },
  { key: 'city', label: '城市' },
  { key: 'skills', label: '技能标签' },
  { key: 'strengths', label: '个人长处' },
  { key: 'tags', label: '擅长领域' },
  { key: 'photos', label: '个人照片' }
]

// 计算属性
const educationIndex = computed(() => {
  return educationOptions.findIndex(edu => edu === formData.value.education)
})

const ageIndex = computed(() => {
  return ageOptions.findIndex(age => age.value === formData.value.age)
})

// 方法
function goBack() {
  uni.navigateBack()
}

// 获取性别文本
function getGenderText(gender) {
  const genderMap = {
    0: '未知',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || '未设置'
}

function onEducationChange(e) {
  formData.value.education = educationOptions[e.detail.value]
}

function onAgeChange(e) {
  formData.value.age = ageOptions[e.detail.value].value
}

function onAreaChange(e) {
  // 清空
  if (!e.detail.value || e.detail.value.length === 0) {
    formData.value.location = []
    formData.value.location_text = []
    formData.value.city = ''
    return
  }
  // 省市两级，存储 value 数组和文本数组
  formData.value.location = e.detail.value.map(item => item.value)
  formData.value.location_text = e.detail.value.map(item => item.text)
  // 设置城市文本（省市组合）
  formData.value.city = formData.value.location_text.join(' ')
}

function addSkill() {
  if (newSkill.value.trim() && !formData.value.skills.includes(newSkill.value.trim())) {
    formData.value.skills.push(newSkill.value.trim())
    newSkill.value = ''
  }
}

function removeSkill(index) {
  formData.value.skills.splice(index, 1)
}

function addTag() {
  if (newTag.value.trim() && !formData.value.tags.includes(newTag.value.trim())) {
    formData.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

function removeTag(index) {
  formData.value.tags.splice(index, 1)
}

function toggleShowField(key, value) {
  formData.value.show_fields[key] = value
}


function choosePhotos() {
  uni.chooseImage({
    count: 6 - formData.value.photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.photos.push(...res.tempFilePaths)
    }
  })
}

function removePhoto(index) {
  formData.value.photos.splice(index, 1)
}

function chooseDiploma() {
  uni.chooseImage({
    count: 3 - formData.value.diploma_photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.diploma_photos.push(...res.tempFilePaths)
    }
  })
}

function removeDiploma(index) {
  formData.value.diploma_photos.splice(index, 1)
}

function chooseCertificate() {
  uni.chooseImage({
    count: 3 - formData.value.certificate_photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.certificate_photos.push(...res.tempFilePaths)
    }
  })
}

function removeCertificate(index) {
  formData.value.certificate_photos.splice(index, 1)
}

// 保存数据
async function saveProfile() {
  try {
    uni.showLoading({ title: '保存中...' })

    // 这里应该调用云函数保存数据
    // const result = await uniCloud.callFunction({
    //   name: 'saveParjobCard',
    //   data: formData.value
    // })

    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000))

    uni.hideLoading()
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)

  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  }
}

// 初始化数据
onMounted(() => {
  // 这里应该从数据库加载用户现有的趴活信息
  // loadUserParjobCard()
})
</script>

<style scoped>
.edit-profile-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.nav-right-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  background: rgba(0, 122, 255, 0.1);
  transition: all 0.3s ease;
}

.nav-right-btn:active {
  background: rgba(0, 122, 255, 0.2);
  transform: scale(0.95);
}

.save-text {
  font-size: 28rpx;
  color: #007aff;
  font-weight: 500;
}

.content-scroll {
  height: calc(100vh - 88rpx - var(--status-bar-height, 0px));
  padding-top: 0rpx;
}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar-wrapper {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15rpx;
  border: 4rpx solid rgba(0, 122, 255, 0.1);
  transition: all 0.3s ease;
}

.avatar-wrapper:active {
  transform: scale(0.95);
}

.avatar-image {
  width: 100%;
  height: 100%;
}


.avatar-tip {
  font-size: 24rpx;
  color: #999;
}

.avatar-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.readonly-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background: #f8f9fa;
  color: #666;
}

.readonly-text {
  font-size: 28rpx;
  color: #666;
}

.field-tip {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.picker-value {
  color: #666;
  padding: 8rpx 0;
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #fff;
  resize: none;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}


.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.picker-item:active {
  background: #f8f9fa;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.tag-input-wrapper {
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.tag-input-wrapper:focus-within {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f0f8ff;
  color: #007aff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.tag-text {
  font-size: 24rpx;
}

.tag-input-row {
  display: flex;
  gap: 15rpx;
}

.tag-input {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.tag-input:focus {
  border-color: #007aff;
}

.add-btn {
  width: 100rpx;
  height: 60rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.add-btn:active {
  background: #0056cc;
  transform: scale(0.95);
}

.photo-grid,
.cert-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.photo-item,
.cert-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8rpx;
  overflow: hidden;
}

.photo-image,
.cert-image {
  width: 100%;
  height: 100%;
}

.photo-delete,
.cert-delete {
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-add,
.cert-add {
  aspect-ratio: 1;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.add-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.photo-tip,
.cert-tip {
  font-size: 24rpx;
  color: #999;
}

.switch-list {
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background: #fff;
  overflow: hidden;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 20rpx;
  border-bottom: 1rpx solid #eee;
}

.switch-item:last-child {
  border-bottom: none;
}

.switch-label {
  font-size: 28rpx;
  color: #333;
}
</style>