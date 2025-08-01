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

    <uni-forms ref="formRef" :modelValue="formData" :disabled="isSaving" :rules="rules" label-width="90">
      <scroll-view class="content-scroll" scroll-y :class="{ 'disabled-scroll': isSaving }">
        <!-- 基本信息 -->
        <uni-section title="基本信息" type="line"></uni-section>
        <view class="section">

          <!-- 头像 -->
          <uni-forms-item name="avatar">
            <view class="avatar-section">
              <view class="avatar-wrapper">
                <image :src="formData.avatar" class="avatar-image"
                  mode="aspectFill" />
              </view>
            </view>
          </uni-forms-item>

          <!-- 昵称 -->
          <uni-forms-item label="昵称" name="nickname">
            <view class="readonly-input">
              <text class="readonly-text">{{ formData.nickname }}</text>
            </view>
          </uni-forms-item>

          <!-- 性别 -->
          <uni-forms-item label="性别" name="gender">
            <view class="readonly-input">
              <text class="readonly-text">{{ getGenderText(formData.gender) }}</text>
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
        <uni-section title="技能标签" type="line"></uni-section>
        <view class="section">

          <!-- 技能标签 -->
          <uni-forms-item label="技能标签" name="skills" required>
            <!-- 技能选择器组件 -->
            <skill-selector ref="skillSelectorRef" v-model:skills="formData.skills"
              v-model:categorieTags="formData.categorie_tags" placeholder="自定义技能标签" :show-categorie-tags="true"
              :max-custom-skills="2" :max-categories="2" :max-skills-per-category="3" :required="true" />
          </uni-forms-item>

          <!-- 特长简介 -->
          <uni-forms-item label="特长" name="strengths">
            <view class="input-row">
              <uni-easyinput type="textarea" :trim="true" v-model="formData.strengths" maxlength="200"
                placeholder="请输入特长、优势、亮点等（可选）" @input="onStrengthsInput">
                <template #right>
                  <uni-icons v-if="formData.strengths" type="clear" size="22" color="#c0c4cc" @mousedown.prevent
                    @click="clearStrengths" style="margin-right: 4px; cursor: pointer" />
                </template>
              </uni-easyinput>
              <text class="input-count">{{ formData.strengths.length }}/200</text>
            </view>
          </uni-forms-item>
        </view>

        <!-- 照片管理 -->
        <uni-section title="图片管理" type="line" sub-title="上传个人照片和认证证书（可选）"></uni-section>
        <view class="section">

          <!-- 个人照片 -->
          <uni-forms-item label="个人照片" name="photos">
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
        <uni-section title="展示设置" type="line" sub-title="控制信息展示和隐私设置"></uni-section>
        <view class="section">

          <!-- 字段展示控制 -->
          <view class="form-item">
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
    
    <!-- 保存状态遮罩层 -->
    <view v-if="isSaving" class="saving-overlay" @click.stop>
      <view class="saving-content">
        <uni-icons type="spinner-cycle" size="40" color="#007aff" class="saving-icon" />
        <text class="saving-text">保存中...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { areaList } from '@/common/areaList.js'
import skillSelector from '@/components/skill-selector/skill-selector.vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { computed, onMounted, ref } from 'vue'

// 校验规则常量
const ALLOWED_DESC_REGEX = /[\w!"#$%&'()*+,./:;<=>?@[\\\]^{|}~·\u2013\u2014—\u2018'\u2019'\u201C"\u201D"\u2026…\u3001、\u3002。\u3008-\u300B\u300E-\u3011\u4E00-\u9FA5\uFF01！\uFF0C，\uFF1A\uFF1B\uFF1F？￥-]/g
// 响应式数据
const formData = ref({
  user_id: '',
  avatar: '',
  nickname: '',
  gender: '',
  age: '',
  education: '',
  city: '',
  location: [], // 省市value数组
  location_text: [], // 省市文本数组
  skills: [],
  categorie_tags: [],
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
    categorie_tags: true,
    photos: true
  },
  is_active: true,
  allow_homepage_view: false
})

// 保存状态管理
const isSaving = ref(false)

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
  strengths: {
    rules: [
      { max: 200, errorMessage: '特长简介最多200字', trigger: 'blur' },
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
  { key: 'strengths', label: '特长简介' },
  { key: 'categorie_tags', label: '擅长领域' },
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
  // 存储 value 数组和文本数组
  formData.value.location = e.detail.value.map(item => item.value)
  formData.value.location_text = e.detail.value.map(item => item.text)

  // 根据选择级别设置城市文本
  if (formData.value.location_text.length === 2) {
    // 省市二级：只存储市
    formData.value.city = formData.value.location_text[1]
  } else if (formData.value.location_text.length === 3) {
    // 省市区三级：存储市-区
    formData.value.city = `${formData.value.location_text[1]}-${formData.value.location_text[2]}`
  } else {
    // 其他情况：存储最后一个级别
    formData.value.city = formData.value.location_text[formData.value.location_text.length - 1]
  }
}

// uni-data-picker 弹层事件处理
function onDataPickerOpened() {
  isDataPickerOpen.value = true
}

function onDataPickerClosed() {
  isDataPickerOpen.value = false
}

// 特长简介输入处理
function onStrengthsInput() {
  let string_ = (formData.value.strengths.match(ALLOWED_DESC_REGEX) || []).join('')
  // 使用 replace 替代 replaceAll，提高兼容性
  string_ = string_.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ')
  formData.value.strengths = string_.slice(0, 200)
}

// 清空特长简介
function clearStrengths() {
  formData.value.strengths = ''
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
  if (isSaving.value) return // 防止重复提交
  
  try {
    // 表单校验
    await formRef.value.validate()
    
    // 设置保存状态
    isSaving.value = true
    
    console.log('formData.value', formData.value)

    // 这里应该调用云函数保存数据
    const result = await uniCloud.callFunction({
      name: 'saveParjobCard',
      data: formData.value
    })

    // 检查云函数返回结果
    if (result.result && result.result.code === 0) {
      // 保存成功
      uni.showToast({
        title: result.result.message || '保存成功',
        icon: 'success',
        duration: 2000
      })

      // 2秒后返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      
      // 记录保存结果（避免 ESLint 警告）
      console.log('保存成功，返回数据:', result.result.data)
    } else {
      // 保存失败
      throw new Error(result.result?.message || '保存失败')
    }

  } catch (error) {
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  } finally {
    // 无论成功失败都要重置保存状态
    isSaving.value = false
  }
}

// 初始化数据
onMounted(() => {
  formData.value.user_id = userInfo.value._id
  // 初始化用户基本信息
  formData.value.avatar = userInfo.value.avatar_file?.url || '/static/default-avatar.png'
  formData.value.nickname = userInfo.value.nickname || '未设置'
  formData.value.gender = userInfo.value.gender || 0
  
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

.input-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.input-count {
  text-align: right;
  color: #999;
  font-size: 24rpx;
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

/* 保存状态遮罩层样式 */
.saving-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.saving-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.saving-icon {
  animation: spin 1s linear infinite;
}

.saving-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 禁用滚动样式 */
.disabled-scroll {
  pointer-events: none;
  user-select: none;
}
</style>