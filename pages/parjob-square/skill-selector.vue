<template>
  <view class="skill-selector-page">
    <!-- 导航栏 -->
    <uni-nav-bar :fixed="true" :border="false" :shadow="false" :statusBar="true" background-color="#fff" color="#333"
      left-icon="left" left-text="" :title="pageTitle" @clickLeft="goBack">
      <template #right>
        <view class="nav-right-btn" @click="confirmSelection">
          <text class="confirm-text">确定</text>
        </view>
      </template>
    </uni-nav-bar>

    <view class="skill-selector-container">
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-container">
          <uni-icons type="search" size="16" color="#999" />
          <input v-model="searchKeyword" class="search-input" placeholder="搜索技能" @input="onSearchInput" />
          <uni-icons v-if="searchKeyword" type="clear" size="16" color="#999" @click="clearSearch" />
        </view>
      </view>

      <!-- 已选择的技能 -->
      <view v-if="selectedSkills.length > 0" class="selected-section">
        <view class="section-title">已选择技能</view>
        <view class="selected-skills">
          <view v-for="(skill, index) in selectedSkills" :key="index" class="selected-skill-tag">
            <text class="selected-skill-text">{{ skill }}</text>
            <uni-icons type="close" size="12" color="#fff" @click="removeSkill(index)" />
          </view>
        </view>
      </view>

      <!-- 已选择的擅长领域 -->
      <view v-if="showCategorieTags && selectedCategorieTags.length > 0" class="selected-section">
        <view class="section-title">已选择擅长领域</view>
        <view class="selected-categorie-tags">
          <view v-for="(tag, index) in selectedCategorieTags" :key="index" class="selected-categorie-tag">
            <text class="selected-categorie-text">{{ tag }}</text>
            <uni-icons type="close" size="12" color="#fff" @click="removeCategorieTag(index)" />
          </view>
        </view>
      </view>

      <!-- 已选择的自定义技能 -->
      <view v-if="customSkills.length > 0" class="selected-section">
        <view class="section-title">已选择自定义技能</view>
        <view class="selected-custom-skills">
          <view v-for="(skill, index) in customSkills" :key="'custom-' + index" class="selected-custom-skill-tag">
            <text class="selected-custom-skill-text">自定义：{{ skill }}</text>
            <uni-icons type="close" size="12" color="#fff" @click="removeCustomSkill(index)" />
          </view>
        </view>
      </view>
    </view>

    <!-- 技能分类列表 -->
    <view class="skill-content">
      <view v-for="category in filteredCategories" :key="category.key" class="category-section">
        <uni-section :title="category.name" type="line">
          <view class="skills-grid">
            <view v-for="skill in category.skills" :key="skill" class="skill-item" :class="{
              'selected': selectedSkills.includes(skill),
              'disabled': isSkillDisabled(skill, category.key)
            }" @click="toggleSkill(skill, category.key)">
              <text class="skill-item-text">{{ skill }}</text>
            </view>
          </view>
        </uni-section>
      </view>
    </view>

    <!-- 自定义技能输入区域 -->
    <view v-if="showCustomSkills" class="custom-skills-section">
      <view class="section-header">
        <text class="section-title">自定义技能</text>
        <text class="section-desc">最多添加{{ maxCustomSkills }}个自定义技能</text>
      </view>
      
      <view class="custom-input-container">
        <input 
          v-model="customSkillInput" 
          class="custom-input" 
          placeholder="请输入自定义技能（2-5个字符）" 
          maxlength="5"
          @input="onCustomInputChange"
        />
        <button 
          class="add-custom-btn" 
          :disabled="!canAddCustomSkill"
          @click="addCustomSkill"
        >
          添加
        </button>
      </view>
      
      <view v-if="customSkills.length > 0" class="custom-skills-list">
        <view v-for="(skill, index) in customSkills" :key="index" class="custom-skill-tag">
          <text class="custom-skill-text">{{ skill }}</text>
          <uni-icons type="close" size="12" color="#666" @click="removeCustomSkill(index)" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {
  categorySkillsMapping,
  getAllCategories,
  getSkillsByCategory,
  searchSkills
} from '@/utils/category-skills-mapping.js'
import { onBackPress, onLoad } from '@dcloudio/uni-app'
import { computed, ref, onMounted, watch } from 'vue'

// 响应式数据
const selectedSkills = ref([])
const selectedCategorieTags = ref([])
const customSkills = ref([]) // 新增自定义技能
const customSkillInput = ref('')
const searchKeyword = ref('')
const searchResults = ref([])

// 页面参数
const pageParams = ref({})
const mode = ref('edit') // edit 或 filter
const showCategorieTags = ref(true)
const showCustomSkills = ref(true)
const maxSkills = ref(3)
const maxCategories = ref(2)
const maxCustomSkills = ref(3)

// 分类数据
const categories = ref([])
const selectedCategories = ref(new Set())

// 计算属性
const pageTitle = computed(() => {
  return mode.value === 'filter' ? '选择技能标签' : '选择技能'
})

const canAddCustomSkill = computed(() => {
  return customSkillInput.value.length >= 2 && 
         customSkillInput.value.length <= 5 && 
         customSkills.value.length < maxCustomSkills.value &&
         !customSkills.value.includes(customSkillInput.value)
})

const filteredCategories = computed(() => {
  if (!searchKeyword.value) {
    return categories.value
  }

  const searchResults = searchSkills(searchKeyword.value)
  const categoryKeys = new Set(searchResults.map(result => result.category.key))

  return categories.value.filter(category => categoryKeys.has(category.key))
})

// 监听搜索关键词变化
watch(searchKeyword, (newValue) => {
  if (newValue) {
    searchResults.value = searchSkills(newValue)
  } else {
    searchResults.value = []
  }
})

// 初始化技能数据
function initializeSkills() {
  categories.value = getAllCategories()

  // 根据技能自动设置分类
  updateSelectedCategories()
  
  // 确保擅长领域与技能保持一致
  updateAutoCategorieTags()
}

// 初始化数据
function initData(options) {
  if (!options) return
  
  mode.value = options.mode || 'edit'
  
  // 根据模式设置配置
  if (mode.value === 'filter') {
    showCategorieTags.value = true
    showCustomSkills.value = false
    maxSkills.value = 3
    maxCategories.value = 2
  } else { // edit mode
    showCategorieTags.value = true
    showCustomSkills.value = true
    maxSkills.value = 3
    maxCategories.value = 2
  }
  
  if (options.selected) {
          try {
        const selectedData = JSON.parse(decodeURIComponent(options.selected))
        
        if (mode.value === 'filter') {
          if (Array.isArray(selectedData)) { // Old format
            selectedSkills.value = selectedData
          } else if (selectedData.skills) { // New format
            selectedSkills.value = selectedData.skills || []
            selectedCategorieTags.value = selectedData.categorieTags || []
            customSkills.value = selectedData.customSkills || [] // 接收自定义技能
          }
        } else { // Edit mode
          if (selectedData.skills) { selectedSkills.value = selectedData.skills }
          if (selectedData.customSkills) { customSkills.value = selectedData.customSkills } // 接收自定义技能
          
          // 处理擅长领域：如果有传入的数据就使用，否则根据技能自动生成
          if (selectedData.categorieTags && selectedData.categorieTags.length > 0) {
            selectedCategorieTags.value = selectedData.categorieTags
          } else {
            // 没有擅长领域数据，根据技能自动生成
            updateAutoCategorieTags()
          }
        }
      } catch (error) {
        console.error('skill-selector parse error:', error)
        selectedSkills.value = options.selected.split(',').filter(Boolean) // Fallback
      }
  }
  
  initializeSkills() // Call initializeSkills after parsing options
}

// 页面加载
onLoad((options) => {
  initData(options)
})

onMounted(() => {
  // 如果没有通过 onLoad 获取到参数，尝试从当前页面获取
  if (!pageParams.value.selected) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage && currentPage.options) {
      initData(currentPage.options)
    }
  }
})

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 确认选择
function confirmSelection() {
  if (mode.value === 'filter') {
    // 筛选模式：返回技能数组和擅长领域
    const result = {
      skills: selectedSkills.value,
      categorieTags: selectedCategorieTags.value,
      customSkills: customSkills.value // 包含自定义技能
    }
    
    // 尝试多种方式发送事件
    uni.$emit('skillSelected', result)
    
    // 延迟发送，确保页面跳转完成
    setTimeout(() => {
      uni.$emit('skillSelected', result)
    }, 100)
    
    // 使用 getApp() 的全局事件总线
    const app = getApp()
    if (app && app.$emit) {
      app.$emit('skillSelected', result)
    }
    
    // 使用 Storage 作为备选方案
    uni.setStorageSync('skillSelectorResult', result)
  } else {
    // 编辑模式：返回完整对象
    const result = {
      skills: selectedSkills.value,
      categorieTags: selectedCategorieTags.value,
      customSkills: customSkills.value // 包含自定义技能
    }
    
    // 尝试多种方式发送事件，确保数据能正确传递
    uni.$emit('skillSelected', result)
    
    // 延迟发送，确保页面跳转完成
    setTimeout(() => {
      uni.$emit('skillSelected', result)
    }, 100)
    
    // 使用 getApp() 的全局事件总线
    const app = getApp()
    if (app && app.$emit) {
      app.$emit('skillSelected', result)
    }
    
    // 使用 Storage 作为备选方案
    uni.setStorageSync('skillSelectorResult', result)
  }
  
  uni.navigateBack()
}

// 搜索输入处理
function onSearchInput(e) {
  searchKeyword.value = e.detail.value
}
function clearSearch() {
  searchKeyword.value = ''
}

// 技能选择处理
function toggleSkill(skill, categoryKey) {
  
  const index = selectedSkills.value.indexOf(skill)

  if (index > -1) {
    // 移除技能
    selectedSkills.value.splice(index, 1)

    // 检查是否需要移除分类
    const categorySkills = getSkillsByCategory(categoryKey)
    const hasOtherSkills = selectedSkills.value.some(s => categorySkills.includes(s))
    if (!hasOtherSkills) {
      selectedCategories.value.delete(categoryKey)
    }
  } else {
    // 添加技能
    if (canAddSkill(skill, categoryKey)) {
      selectedSkills.value.push(skill)
      selectedCategories.value.add(categoryKey)
    }
  }

  // 更新自动擅长领域
  updateAutoCategorieTags()
}

function canAddSkill(skill, categoryKey) {
  const categorySkills = getSkillsByCategory(categoryKey)
  const selectedCategorySkills = selectedSkills.value.filter(s => categorySkills.includes(s))

  // 检查每个领域的技能数量限制（包含当前要添加的技能）
  if (selectedCategorySkills.length >= maxSkills.value) {
    uni.showToast({
      title: `每个领域最多选择${maxSkills.value}个技能`,
      icon: 'none'
    })
    return false
  }

  // 检查领域数量限制（如果这是一个新领域）
  if (!selectedCategories.value.has(categoryKey) && selectedCategories.value.size >= maxCategories.value) {
    uni.showToast({
      title: `您最多只能选择${maxCategories.value}个不同领域`,
      icon: 'none'
    })
    return false
  }

  return true
}

function isSkillDisabled(skill, categoryKey) {
  const categorySkills = getSkillsByCategory(categoryKey)
  const selectedCategorySkills = selectedSkills.value.filter(s => categorySkills.includes(s))

  // 如果技能已选择，则不禁用
  if (selectedSkills.value.includes(skill)) {
    return false
  }

  // 如果该领域已满，则禁用
  if (selectedCategorySkills.length >= maxSkills.value) {
    return true
  }

  // 如果是新领域且已达到最大领域数，则禁用
  if (!selectedCategories.value.has(categoryKey) && selectedCategories.value.size >= maxCategories.value) {
    return true
  }

  return false
}

function removeSkill(index) {
  const skill = selectedSkills.value[index]
  selectedSkills.value.splice(index, 1)

  // 检查是否是自定义技能
  const category = getCategoryBySkill(skill)
  if (category) {
    // 预设技能：检查是否需要移除分类
    const categorySkills = getSkillsByCategory(category.key)
    const hasOtherSkills = selectedSkills.value.some(s => categorySkills.includes(s))
    if (!hasOtherSkills) {
      selectedCategories.value.delete(category.key)
    }
  }

  // 更新自动擅长领域
  updateAutoCategorieTags()
}

function removeCategorieTag(index) {
  const tagName = selectedCategorieTags.value[index]
  selectedCategorieTags.value.splice(index, 1)
  
  // 移除该领域下的所有技能
  selectedSkills.value = selectedSkills.value.filter(skill => {
    const category = getCategoryBySkill(skill)
    return !category || category.name !== tagName
  })
  
  // 更新分类状态
  updateSelectedCategories()
}

// 自定义技能相关
function onCustomInputChange(e) {
  customSkillInput.value = e.detail.value
}

// 添加自定义技能
function addCustomSkill() {
  if (canAddCustomSkill.value) {
    customSkills.value.push(customSkillInput.value)
    customSkillInput.value = ''
  }
}

// 删除自定义技能
function removeCustomSkill(index) {
  customSkills.value.splice(index, 1)
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

// 更新自动擅长领域
function updateAutoCategorieTags() {
  const categorieTags = new Set()

  selectedSkills.value.forEach(skill => {
    const category = getCategoryBySkill(skill)
    if (category) {
      // 添加分类名称作为擅长领域
      categorieTags.add(category.name)
    }
  })

  selectedCategorieTags.value = [...categorieTags]
}

// 更新选择的分类状态
function updateSelectedCategories() {
  selectedCategories.value.clear()
  selectedSkills.value.forEach(skill => {
    const category = getCategoryBySkill(skill)
    if (category) {
      selectedCategories.value.add(category.key)
    }
  })
}

// 页面返回拦截
onBackPress(() => {
  return false // 允许页面正常返回
})
</script>

<style scoped>
.skill-selector-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.skill-selector-container {
  position: sticky;
  top: calc(44px + var(--status-bar-height));
  z-index: 1000;
}

.nav-right-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 16rpx;
  background: #007aff;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.nav-right-btn:active {
  background: #0056cc;
  transform: scale(0.95);
}

.confirm-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.search-section {
  padding: 15rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  background: #fff;
  position: sticky;
  top: 0;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  background: transparent;
}

.selected-section {
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  z-index: 10;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.selected-skills,
.selected-categorie-tags,
.selected-custom-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.selected-skill-tag,
.selected-categorie-tag,
.selected-custom-skill-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: #fff;
  border-radius: 20rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
}

.selected-skill-tag:active,
.selected-categorie-tag:active,
.selected-custom-skill-tag:active {
  transform: scale(0.95);
}

.selected-skill-text,
.selected-categorie-text,
.selected-custom-skill-text {
  font-size: 24rpx;
  color: #fff;
}

.skill-content {
  flex: 1;
  padding: 0 16rpx;
  background: #fff;
}

.category-section {
  margin-bottom: 25rpx;
}

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 15rpx 0;
}

.skill-item {
  padding: 10rpx 16rpx;
  background: #f8f9fa;
  border: 1rpx solid #e5e5e5;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.skill-item.selected {
  background: linear-gradient(135deg, #007aff, #0056cc);
  color: #fff;
  border-color: #007aff;
}

.skill-item.disabled {
  background: #f0f0f0;
  color: #ccc;
  border-color: #e0e0e0;
}

.skill-item:not(.disabled):not(.selected):active {
  transform: scale(0.95);
  background: #e9ecef;
}

.skill-item-text {
  font-size: 24rpx;
  color: inherit;
}

.custom-skills-section {
  background: #fff;
  padding: 30rpx 20rpx;
  margin-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-desc {
  font-size: 24rpx;
  color: #999;
}

.custom-input-container {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.custom-input {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #fff;
}

.add-custom-btn {
  width: 120rpx;
  height: 80rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.add-custom-btn:disabled {
  background: #ccc;
  color: #999;
}

.add-custom-btn:not(:disabled):active {
  background: #0056cc;
  transform: scale(0.95);
}

.custom-skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.custom-skill-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: #fff;
  border-radius: 20rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
}

.custom-skill-tag:active {
  transform: scale(0.95);
}

.custom-skill-text {
  font-size: 24rpx;
  color: #fff;
}
</style> 