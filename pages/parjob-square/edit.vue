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
          <uni-forms-item label="技能标签" name="skills">
            <view class="skill-section">
              <!-- 技能输入框 -->
              <view class="skill-input-container">
                <input 
                  v-model="customSkillInput" 
                  class="skill-input" 
                  placeholder="自定义技能（2-5字符）" 
                  maxlength="5"
                  @input="onCustomInputChange"
                />
                <button 
                  class="search-skill-btn" 
                  :disabled="!canAddCustomSkill"
                  @click="addCustomSkill"
                >
                <uni-icons type="plus" size="16" color="#666" />
                </button>
                <button class="search-skill-btn" @click="showSkillSelector">
                  <uni-icons type="search" size="16" color="#666" />
                </button>
              </view>
              
              <!-- 已选择的技能展示 -->
              <view class="selected-skills" v-if="formData.skills.length > 0">
                <view v-for="(skill, index) in formData.skills" :key="index" class="selected-skill-tag">
                  <text class="skill-text">{{ skill }}</text>
                  <uni-icons type="close" size="12" color="#666" @click="removeSkill(index)" />
                </view>
              </view>
              
              <!-- 自定义技能展示 -->
              <view class="selected-custom-skills" v-if="formData.custom_skills.length > 0">
                <view v-for="(skill, index) in formData.custom_skills" :key="'custom-' + index" class="selected-custom-skill-tag">
                  <text class="custom-skill-text">自定义：{{ skill }}</text>
                  <uni-icons type="close" size="12" color="#666" @click="removeCustomSkill(index)" />
                </view>
              </view>
            </view>
          </uni-forms-item>

          <!-- 擅长领域 -->
          <uni-forms-item label="擅长领域" name="categorie_tags">
            <view class="categorie-tags-wrapper">
              <uni-easyinput 
                :disabled="true"
                :clearable="false"
              >
                <!-- 擅长领域标签展示 -->
                 <template #left>
                  <view class="selected-categorie-tags" v-if="formData.categorie_tags.length > 0">
                    <view v-for="(tag, index) in formData.categorie_tags" :key="index" class="selected-categorie-tag">
                      <text class="categorie-text">{{ tag }}</text>
                      <uni-icons type="close" size="12" color="#666" @click="removeCategorieTag(index)" />
                    </view>
                  </view>
                 </template>
              </uni-easyinput>
            </view>
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
          <view class="switch-list">
            <view v-for="field in showFields" :key="field.key" class="switch-item">
              <text class="switch-label">{{ field.label }}</text>
              <switch :checked="formData.show_fields[field.key]"
                @change="(e) => toggleShowField(field.key, e.detail.value)" color="#007aff" />
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
import { getUserParCard, updateUserParCardCache } from '@/utils/user-parcard.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { onMounted, ref, reactive, computed, onUnmounted } from 'vue'
import { categorySkillsMapping } from '@/utils/category-skills-mapping.js'

// 校验规则常量
const ALLOWED_DESC_REGEX = /[\w!"#$%&'()*+,./:;<=>?@[\\\]^{|}~·\u2013\u2014—\u2018'\u2019'\u201C"\u201D"\u2026…\u3001、\u3002。\u3008-\u300B\u300E-\u3011\u4E00-\u9FA5\uFF01！\uFF0C，\uFF1A\uFF1B\uFF1F？￥-]/g
// 响应式数据
const formRef = ref(null)
const areaPickerRef = ref(null)
const isSaving = ref(false)
const isDataPickerOpen = ref(false)

// 表单数据
const formData = reactive({
  user_id: '',
  avatar: '',
  nickname: '',
  gender: 0,
  age: '',
  education: '',
  location: [],
  location_text: [],
  city: '',
  skills: [],
  categorie_tags: [],
  custom_skills: [], // 新增自定义技能数组
  strengths: '',
  photos: [],
  certificate_photos: [],
  is_active: true,
  allow_homepage_view: false,
  show_fields: {
    age: true,
    education: true,
    city: true,
    skills: true,
    categorie_tags: true,
    custom_skills: true, // 新增自定义技能显示字段
    strengths: true,
    photos: true
  }
})

// 表单验证规则
const rules = {
  nickname: {
    rules: [{
      required: true,
      errorMessage: '请输入昵称'
    }]
  },
  gender: {
    rules: [{
      required: true,
      errorMessage: '请选择性别'
    }]
  },
  age: {
    rules: [{
      required: true,
      errorMessage: '请输入年龄'
    }]
  }
}

// 自定义技能输入
const customSkillInput = ref('')
const maxCustomSkills = ref(3)

// 计算属性
const canAddCustomSkill = computed(() => {
  return customSkillInput.value.length >= 2 && 
         customSkillInput.value.length <= 5 && 
         formData.custom_skills.length < maxCustomSkills.value &&
         !formData.custom_skills.includes(customSkillInput.value)
})

// 获取用户信息
const userInfo = computed(() => store.userInfo)

// 选项数据
const ageSelectData = Array.from({ length: 43 }, (_, i) => ({
  value: i + 18,
  text: `${i + 18}岁`
}))

const educationSelectData = [
  { value: '高中', text: '高中' },
  { value: '大专', text: '大专' },
  { value: '本科', text: '本科' },
  { value: '硕士', text: '硕士' },
  { value: '博士', text: '博士' }
]

const areaPickerData = areaList

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
    formData.location = []
    formData.location_text = []
    formData.city = ''
    return
  }
  // 存储 value 数组和文本数组
  formData.location = e.detail.value.map(item => item.value)
  formData.location_text = e.detail.value.map(item => item.text)

  // 根据选择级别设置城市文本
  if (formData.location_text.length === 2) {
    // 省市二级：只存储市
    formData.city = formData.location_text[1]
  } else if (formData.location_text.length === 3) {
    // 省市区三级：存储市-区
    formData.city = `${formData.location_text[1]}-${formData.location_text[2]}`
  } else {
    // 其他情况：存储最后一个级别
    formData.city = formData.location_text[formData.location_text.length - 1]
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
  let string_ = (formData.strengths.match(ALLOWED_DESC_REGEX) || []).join('')
  // 使用 replace 替代 replaceAll，提高兼容性
  string_ = string_.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ')
  formData.strengths = string_.slice(0, 200)
}

// 清空特长简介
function clearStrengths() {
  formData.strengths = ''
}

function toggleShowField(key, value) {
  formData.show_fields[key] = value
}


function choosePhotos() {
  uni.chooseImage({
    count: 6 - formData.photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.photos.push(...res.tempFilePaths)
    }
  })
}

function removePhoto(index) {
  formData.photos.splice(index, 1)
}

function chooseDiploma() {
  uni.chooseImage({
    count: 3 - formData.certificate_photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.certificate_photos.push(...res.tempFilePaths)
    }
  })
}

function removeDiploma(index) {
  formData.certificate_photos.splice(index, 1)
}

function chooseCertificate() {
  uni.chooseImage({
    count: 3 - formData.certificate_photos.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.certificate_photos.push(...res.tempFilePaths)
    }
  })
}

function removeCertificate(index) {
  formData.certificate_photos.splice(index, 1)
}

// 技能选择相关
function showSkillSelector() {
  const selectedData = {
    skills: formData.skills,
    categorieTags: formData.categorie_tags,
    customSkills: formData.custom_skills // 传递自定义技能
  }
  const selectedDataJson = encodeURIComponent(JSON.stringify(selectedData))
  
  uni.navigateTo({
    url: `/pages/parjob-square/skill-selector?selected=${selectedDataJson}&mode=edit`
  })
}

function removeSkill(index) {
  const skill = formData.skills[index]
  formData.skills.splice(index, 1)
  
  // 检查是否需要清除相关的擅长领域
  removeRelatedCategorieTag(skill)
}

function removeCustomSkill(index) {
  formData.custom_skills.splice(index, 1)
}

// 移除相关的擅长领域
function removeRelatedCategorieTag(skill) {
  const category = getCategoryBySkill(skill)
  if (category) {
    const remainingSkills = formData.skills.filter(s => {
      const skillCategory = getCategoryBySkill(s)
      return skillCategory && skillCategory.name === category.name
    })
    
    if (remainingSkills.length === 0) {
      const tagIndex = formData.categorie_tags.indexOf(category.name)
      if (tagIndex > -1) {
        formData.categorie_tags.splice(tagIndex, 1)
      }
    }
  }
}

// 移除擅长领域及其相关技能
function removeCategorieTag(index) {
  const tagName = formData.categorie_tags[index]
  formData.categorie_tags.splice(index, 1)
  
  // 移除该领域下的所有技能
  formData.skills = formData.skills.filter(skill => {
    const category = getCategoryBySkill(skill)
    return !category || category.name !== tagName
  })
}

// 获取技能所属分类
function getCategoryBySkill(skill) {
  for (const [key, category] of Object.entries(categorySkillsMapping)) {
    if (category.skills.includes(skill)) {
      return {
        key,
        name: category.name,
        description: category.description
      }
    }
  }
  return null
}

// 自定义技能相关方法
function onCustomInputChange(e) {
  customSkillInput.value = e.detail.value
}

function addCustomSkill() {
  if (canAddCustomSkill.value) {
    formData.custom_skills.push(customSkillInput.value)
    customSkillInput.value = ''
  }
}

// 保存数据
async function saveProfile() {
  if (isSaving.value) return // 防止重复提交
  
  try {
    // 表单校验
    await formRef.value.validate()
    
    // 合并自定义技能到技能列表中
    const allSkills = [...formData.skills]
    formData.custom_skills.forEach(customSkill => {
      if (!allSkills.includes(customSkill)) {
        allSkills.push(customSkill)
      }
    })
    formData.skills = allSkills
    
    // 设置保存状态
    isSaving.value = true

    // 这里应该调用云函数保存数据
    const result = await uniCloud.callFunction({
      name: 'saveParjobCard',
      data: formData
    })

    // 检查云函数返回结果
    if (result.result && result.result.code === 0) {
      // 保存成功后更新缓存
      const updatedCardData = { 
        ...formData,
        // 确保地区信息正确保存
        location: formData.location || [],
        location_text: formData.location_text || [],
        city: formData.city || ''
      }
      updateUserParCardCache(updatedCardData)
      
      // 记录编辑时间戳，用于实时更新
      uni.setStorageSync('lastEditTime', Date.now())
      
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

// 监听技能选择结果
function setupEventListeners() {
  uni.$on('skillSelected', (result) => {
    console.log('接收到 skillSelected 事件:', result)
    
    if (result && result.skills) {
      // 分离系统技能和自定义技能
      const systemSkills = []
      const customSkills = []
      
      result.skills.forEach(skill => {
        // 检查是否是系统预定义的技能
        const isSystemSkill = Object.values(categorySkillsMapping).some(category => 
          category.skills.includes(skill)
        )
        
        if (isSystemSkill) {
          if (!systemSkills.includes(skill)) {
            systemSkills.push(skill)
          }
        } else {
          // 不是系统技能，添加到自定义技能
          if (!customSkills.includes(skill)) {
            customSkills.push(skill)
          }
        }
      })
      
      formData.skills = systemSkills
      formData.custom_skills = customSkills
      formData.categorie_tags = result.categorieTags || []
    }
  })
}

function cleanupEventListeners() {
  uni.$off('skillSelected')
}

// 初始化数据
onMounted(() => {
  formData.user_id = userInfo.value._id
  setupEventListeners()
  loadUserParjobCard()
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  cleanupEventListeners()
})

// 加载用户趴活信息卡
async function loadUserParjobCard() {
  try {
    // 使用工具函数获取用户信息卡
    const cardData = await getUserParCard(userInfo.value._id)
    
    if (cardData) {
      // 找到用户信息卡，填充表单
      fillFormWithCardData(cardData)
    } else {
      // 未找到用户信息卡，使用默认用户信息
      fillFormWithDefaultUserInfo()
    }
    
  } catch (error) {
    console.error('加载用户趴活信息卡失败:', error)
    // 出错时使用默认用户信息
    fillFormWithDefaultUserInfo()
  }
}

// 用卡片数据填充表单
function fillFormWithCardData(cardData) {
  // 基本信息
  formData.avatar = cardData.avatar || userInfo.value.avatar_file?.url || '/static/default-avatar.png'
  formData.nickname = cardData.nickname || userInfo.value.nickname || '未设置'
  formData.gender = cardData.gender === undefined ? (userInfo.value.gender || 0) : cardData.gender
  formData.age = cardData.age || ''
  formData.education = cardData.education || ''
  
  // 地区信息（优先使用新的location字段，兼容旧的city字段）
  if (cardData.location && Array.isArray(cardData.location) && cardData.location.length > 0) {
    formData.location = cardData.location
    formData.location_text = cardData.location_text || []
    // 根据location_text设置city
    if (cardData.location_text && cardData.location_text.length > 0) {
      formData.city = cardData.location_text[cardData.location_text.length - 1] || ''
    } else {
      formData.city = cardData.city || ''
    }
  } else {
    // 兼容旧数据
    formData.city = cardData.city || ''
    formData.location = []
    formData.location_text = []
  }
  
  // 技能信息处理
  const allSkills = cardData.skills || []
  const customSkills = cardData.custom_skills || []
  
  // 分离系统技能和自定义技能
  const systemSkills = []
  const finalCustomSkills = []
  
  // 先处理明确的自定义技能
  customSkills.forEach(skill => {
    if (!systemSkills.includes(skill)) {
      finalCustomSkills.push(skill)
    }
  })
  
  // 处理所有技能，区分系统技能和自定义技能
  allSkills.forEach(skill => {
    // 检查是否是系统预定义的技能
    const isSystemSkill = Object.values(categorySkillsMapping).some(category => 
      category.skills.includes(skill)
    )
    
    if (isSystemSkill) {
      if (!systemSkills.includes(skill)) {
        systemSkills.push(skill)
      }
    } else {
      // 不是系统技能，且不在自定义技能列表中，则添加到自定义技能
      if (!finalCustomSkills.includes(skill)) {
        finalCustomSkills.push(skill)
      }
    }
  })
  
  formData.skills = systemSkills
  formData.custom_skills = finalCustomSkills
  formData.categorie_tags = cardData.categorie_tags || []
  formData.strengths = cardData.strengths || ''
  
  // 照片信息
  formData.photos = cardData.photos || []
  formData.certificate_photos = cardData.certificate_photos || []
  
  // 展示设置
  formData.show_fields = cardData.show_fields || {
    age: true,
    education: true,
    city: true,
    skills: true,
    categorie_tags: true,
    custom_skills: true, // 填充自定义技能显示字段
    strengths: true,
    photos: true
  }
  formData.is_active = cardData.is_active === undefined ? true : cardData.is_active
  formData.allow_homepage_view = cardData.allow_homepage_view === undefined ? false : cardData.allow_homepage_view
}

// 用默认用户信息填充表单
function fillFormWithDefaultUserInfo() {
  formData.avatar = userInfo.value.avatar_file?.url || '/static/default-avatar.png'
  formData.nickname = userInfo.value.nickname || '未设置'
  formData.gender = userInfo.value.gender || 0
  // 其他字段保持默认值
}

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

.skill-selector-wrapper,
.categorie-tags-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.selected-skills,
.selected-categorie-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.selected-skill-tag,
.selected-categorie-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f0f8ff;
  color: #007aff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.selected-categorie-tag {
  color: #009400;
}

.skill-text,
.categorie-text {
  font-size: 24rpx;
}

.skill-input-container {
  display: flex;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.custom-skill-section {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e5e5e5;
}

.custom-input-container {
  display: flex;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.custom-input {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.custom-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.add-custom-btn {
  width: 120rpx;
  height: 60rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.add-custom-btn:active {
  background: #0056cc;
  transform: scale(0.95);
}

.custom-skill-tip {
  font-size: 22rpx;
  color: #999;
  margin-top: 10rpx;
  padding-left: 15rpx;
}

.selected-custom-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 10rpx;
}

.selected-custom-skill-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f0f8ff;
  color: #007aff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.custom-skill-text {
  font-size: 24rpx;
}

.skill-input {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.skill-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.search-skill-btn {
  width: 80rpx;
  height: 60rpx;
  background: #f0f0f0;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-skill-btn:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

</style>