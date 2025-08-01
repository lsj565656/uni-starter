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

    <uni-forms ref="formRef" :modelValue="formData" :rules="rules" label-width="90">
      <scroll-view class="content-scroll" scroll-y>
        <!-- 基本信息 -->
        <view class="section">
          <view class="section-title">基本信息</view>

          <!-- 头像 -->
          <uni-forms-item label="头像" name="avatar">
            <view class="avatar-section">
              <view class="avatar-wrapper">
                <image :src="userInfo.avatar_file.url || '/static/default-avatar.png'" class="avatar-image"
                  mode="aspectFill" />
              </view>
            </view>
          </uni-forms-item>

          <!-- 昵称 -->
          <uni-forms-item label="昵称" name="nickname">
            <view class="readonly-input">
              <text class="readonly-text">{{ userInfo.nickname || '未设置' }}</text>
            </view>
          </uni-forms-item>

          <!-- 性别 -->
          <uni-forms-item label="性别" name="gender">
            <view class="readonly-input">
              <text class="readonly-text">{{ getGenderText(userInfo.gender) }}</text>
            </view>
          </uni-forms-item>

          <!-- 年龄 -->
          <uni-forms-item label="年龄" name="age" required>
            <uni-data-select v-model="formData.age" :localdata="ageSelectData" placeholder="请选择年龄" />
          </uni-forms-item>

          <!-- 学历 -->
          <uni-forms-item label="学历" name="education" required>
            <uni-data-select v-model="formData.education" :localdata="educationSelectData" placeholder="请选择学历" />
          </uni-forms-item>

          <!-- 城市 -->
          <uni-forms-item label="城市" name="location" required>
            <uni-data-picker ref="areaPickerRef" :localdata="areaPickerData" popup-title="请选择常驻城市" placeholder="请选择省市"
              v-model="formData.location" @change="onAreaChange" @popupopened="onDataPickerOpened"
              @popupclosed="onDataPickerClosed" @popupshow="onDataPickerOpened" @popuphide="onDataPickerClosed" />
          </uni-forms-item>
        </view>

        <!-- 技能标签 -->
        <view class="section">
          <view class="section-title">技能标签</view>

          <!-- 技能标签 -->
          <uni-forms-item label="技能标签" name="skills" required>
            <!-- 技能选择器组件 -->
            <skill-selector ref="skillSelectorRef" v-model:skills="formData.skills"
              v-model:strengths="formData.strengths" v-model:personalStrengths="formData.personalStrengths"
              placeholder="自定义技能标签" :show-strengths="true" :show-personal-strengths="false" :max-custom-skills="2"
              :max-categories="2" :max-skills-per-category="3" :max-personal-strengths-length="200" :required="true" />
          </uni-forms-item>

          <!-- 个人长处 -->
          <uni-forms-item label="个人长处" name="personalStrengths">
            <uni-easyinput type="textarea" v-model="formData.personalStrengths" placeholder="请输入个人长处（可选）"
              maxlength="200" :trim="true" />
          </uni-forms-item>
        </view>

        <!-- 照片管理 -->
        <view class="section">
          <view class="section-title">照片管理</view>

          <!-- 个人照片 -->
          <uni-forms-item label="个人照片" name="photos" required>
            <view class="photo-grid">
              <view v-for="(photo, index) in formData.photos" :key="index" class="photo-item">
                <image :src="photo" class="photo-image" mode="aspectFill" />
                <view class="photo-delete" @click="removePhoto(index)">
                  <uni-icons type="close" size="16" color="#fff" />
                </view>
              </view>
              <view v-if="formData.photos.length < 3" class="photo-add" @click="choosePhotos">
                <uni-icons type="plus" size="30" color="#999" />
                <text class="add-text">添加照片</text>
              </view>
            </view>
            <text class="photo-tip">最多可上传3张个人照片</text>
          </uni-forms-item>

          <!-- 毕业证书 -->
          <uni-forms-item label="毕业证书" name="diploma_photos">
            <view class="photo-grid">
              <view v-for="(cert, index) in formData.diploma_photos" :key="index" class="photo-item">
                <image :src="cert" class="photo-image" mode="aspectFill" />
                <view class="photo-delete" @click="removeDiploma(index)">
                  <uni-icons type="close" size="16" color="#fff" />
                </view>
              </view>
              <view v-if="formData.diploma_photos.length < 3" class="photo-add" @click="chooseDiploma">
                <uni-icons type="plus" size="30" color="#999" />
                <text class="add-text">上传证书</text>
              </view>
            </view>
            <text class="photo-tip">证书仅用于平台认证，不会对外展示</text>
          </uni-forms-item>

          <!-- 职业证书 -->
          <uni-forms-item label="职业证书" name="certificate_photos">
            <view class="photo-grid">
              <view v-for="(cert, index) in formData.certificate_photos" :key="index" class="photo-item">
                <image :src="cert" class="photo-image" mode="aspectFill" />
                <view class="photo-delete" @click="removeCertificate(index)">
                  <uni-icons type="close" size="16" color="#fff" />
                </view>
              </view>
              <view v-if="formData.certificate_photos.length < 3" class="photo-add" @click="chooseCertificate">
                <uni-icons type="plus" size="30" color="#999" />
                <text class="add-text">上传证书</text>
              </view>
            </view>
            <text class="photo-tip">证书仅用于平台认证，不会对外展示</text>
          </uni-forms-item>
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
    </uni-forms>
  </view>
</template>

<script setup>
import { areaList } from '@/common/areaList.js'
import skillSelector from '@/components/skill-selector/skill-selector.vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { onBackPress } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'

// 校验规则常量
const ALLOWED_DESC_REGEX = /[\w!"#$%&'()*+,./:;<=>?@[\\\]^{|}~·\u2013\u2014—\u2018'\u2019'\u201C"\u201D"\u2026…\u3001、\u3002。\u3008-\u300B\u300E-\u3011\u4E00-\u9FA5\uFF01！\uFF0C，\uFF1A\uFF1B\uFF1F？￥-]/g
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
  personalStrengths: '',
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

// 校验规则
const rules = {
  age: {
    rules: [
      { required: true, errorMessage: '请选择年龄', trigger: 'change' }
    ]
  },
  education: {
    rules: [
      { required: true, errorMessage: '请选择学历', trigger: 'change' }
    ]
  },
  location: {
    rules: [
      { required: true, errorMessage: '请选择常驻城市', trigger: 'change' }
    ]
  },
  skills: {
    rules: [
      { required: true, errorMessage: '请至少选择一个技能标签', trigger: 'change' }
    ]
  },
  photos: {
    rules: [
      { required: true, errorMessage: '请至少上传一张个人照片', trigger: 'change' }
    ]
  },
  personalStrengths: {
    rules: [
      { max: 200, errorMessage: '个人长处最多200字', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (!value) return callback()
          const string_ = (value.match(ALLOWED_DESC_REGEX) || []).join('')
          if (string_.length !== value.length) return callback('仅限常用中英文及标点')
          return callback()
        },
        trigger: 'blur'
      }
    ]
  }
}

// 获取用户信息
const userInfo = computed(() => store.userInfo)
const formRef = ref(null)
const areaPickerRef = ref(null)
const skillSelectorRef = ref(null)
const isDataPickerOpen = ref(false)

// 选项数据
const educationOptions = ['高中', '大专', '本科', '硕士', '博士']

// 年龄选项 (18-60岁)
const ageOptions = Array.from({ length: 43 }, (_, i) => ({
  value: i + 18,
  label: `${i + 18}岁`
}))

// uni-data-select 数据格式
const ageSelectData = ageOptions.map(option => ({
  value: option.value,
  text: option.label
}))

const educationSelectData = educationOptions.map(option => ({
  value: option,
  text: option
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

// uni-data-picker 弹层事件处理
function onDataPickerOpened() {
  isDataPickerOpen.value = true
}

function onDataPickerClosed() {
  isDataPickerOpen.value = false
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
    // 表单校验
    await formRef.value.validate()

    // 额外校验：个人照片
    if (!formData.value.photos || formData.value.photos.length === 0) {
      uni.showToast({
        title: '请至少上传一张个人照片',
        icon: 'none'
      })
      return
    }

    // 额外校验：技能标签
    if (!formData.value.skills || formData.value.skills.length === 0) {
      uni.showToast({
        title: '请至少选择一个技能标签',
        icon: 'none'
      })
      return
    }

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

// 页面返回拦截
onBackPress(() => {
  // 检查 uni-data-picker 是否处于打开状态
  if (isDataPickerOpen.value && areaPickerRef.value) {
    return true // 阻止页面返回
  }

  return false // 允许页面正常返回
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