<template>
  <view class="skill-selector">
    <!-- 技能标签输入区域 -->
    <view class="skill-input-section">
      <view class="input-container">
        <input v-model="inputValue" class="skill-input" :placeholder="placeholder" maxlength="5" @input="onInputChange"
          @focus="onInputFocus" @blur="onInputBlur" :disabled="customSkills.length >= props.maxCustomSkills" />
        <view class="input-actions">
          <!-- 添加按钮 -->
          <view v-if="inputValue.trim()" class="add-custom-btn" @click="addCustomSkill">
            <text class="add-text">添加</text>
          </view>
          <!-- 搜索按钮 -->
          <view class="search-icon" @click="showSkillSelector">
            <uni-icons type="search" size="16" color="#999" />
          </view>
        </view>
        <!-- 字符计数提示 -->
        <view v-if="inputValue.length > 0" class="char-count-tip">
          <text class="char-count-text" :class="{ 'warning': inputValue.length < 2, 'error': inputValue.length > 5 }">
            {{ inputValue.length }}/5
          </text>
        </view>
      </view>
      <!-- 自定义技能数量提示 -->
      <view v-if="customSkills.length > 0" class="custom-skills-tip">
        <text class="tip-text">自定义技能: {{ customSkills.length }}/{{ props.maxCustomSkills }}</text>
      </view>

      <!-- 已选择的技能标签 -->
      <view v-if="selectedSkills.length > 0" class="selected-skills">
        <view v-for="(skill, index) in selectedSkills" :key="index" class="skill-tag" @click="removeSkill(index)">
          <text class="skill-text">{{ isCustomSkill(skill) ? '自定义: ' : '' }}{{ skill }}</text>
          <uni-icons type="close" size="12" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 擅长领域显示 -->
    <view v-if="showCategorieTags" class="categorieTags-section">
      <text class="section-title">擅长领域</text>
      <view class="categorieTags-tags">
        <view v-if="autoCategorieTags.length === 0" class="strength-tag-empty">
          <text class="strength-text-empty">无</text>
        </view>
        <view v-for="(strength, index) in autoCategorieTags" :key="index" class="strength-tag"
          @click="removeStrength(index)">
          <text class="strength-text">{{ strength }}</text>
          <uni-icons type="close" size="12" color="#fff" />
        </view>
      </view>
    </view>


    <!-- 技能选择抽屉 -->
    <uni-drawer ref="skillDrawer" mode="right" :width="300" :mask-click="false" @change="onDrawerChange">
      <view class="skill-selector-modal">
        <view class="skill-header">
          <text class="skill-title">选择技能</text>
          <view class="skill-close" @click="hideSkillSelector">
            <uni-icons type="close" size="20" color="#333" />
          </view>
        </view>

        <!-- 搜索框 -->
        <view class="search-section">
          <view class="search-container">
            <uni-icons type="search" size="16" color="#999" />
            <input v-model="searchKeyword" class="search-input" placeholder="搜索技能" @input="onSearchInput" />
          </view>
        </view>

        <!-- 技能分类列表 -->
        <scroll-view class="skill-content" scroll-y>
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
        </scroll-view>

        <!-- 底部操作按钮 -->
        <view class="skill-actions">
          <button class="skill-reset" @click="resetSkills">重置</button>
          <button class="skill-confirm" @click="confirmSkills">确定</button>
        </view>
      </view>
    </uni-drawer>
  </view>
</template>

<script setup>
import {
  categorySkillsMapping,
  getAllCategories,
  getAllSkills,
  getSkillsByCategory,
  searchSkills
} from '@/utils/category-skills-mapping.js'
import { onBackPress } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'

// Props定义
const props = defineProps({
  // 技能标签
  skills: {
    type: Array,
    default: () => []
  },
  // 擅长领域
  categorieTags: {
    type: String,
    default: ''
  },

  // 输入框占位符
  placeholder: {
    type: String,
    default: '请输入技能标签'
  },
  // 是否显示擅长领域
  showCategorieTags: {
    type: Boolean,
    default: true
  },

  // 每个领域最多选择技能数
  maxSkillsPerCategory: {
    type: Number,
    default: 3
  },
  // 最多选择领域数
  maxCategories: {
    type: Number,
    default: 2
  },
  // 最多自定义技能数
  maxCustomSkills: {
    type: Number,
    default: 2
  },

  // 是否必填
  required: {
    type: Boolean,
    default: false
  }
})

// Emits定义
const emit = defineEmits(['update:skills', 'update:categorieTags', 'change'])

// 响应式数据
const inputValue = ref('')
const selectedSkills = ref([])
const customSkills = ref([]) // 自定义技能缓存
const autoCategorieTags = ref([]) // 自动填充的擅长领域
const searchKeyword = ref('')
const skillDrawer = ref(null)

// 分类数据
const categories = ref([])
const selectedCategories = ref(new Set())

// 弹窗状态管理
const isPopupOpen = ref(false)

// 初始化数据
onMounted(() => {
  categories.value = getAllCategories()

  // 分离自定义技能和预设技能
  const allSkills = [...props.skills]
  const presetSkills = []
  const customSkillsList = []

  allSkills.forEach(skill => {
    const category = getCategoryBySkill(skill)
    if (category) {
      // 预设技能
      presetSkills.push(skill)
      selectedCategories.value.add(category.key)
    } else {
      // 自定义技能
      customSkillsList.push(skill)
    }
  })

  selectedSkills.value = [...presetSkills, ...customSkillsList]
  customSkills.value = customSkillsList
  // 初始化自动擅长领域
  updateAutoCategorieTags()
})

// 页面返回拦截
onBackPress(() => {
  // 检查 skill-selector 弹窗是否打开
  if (skillDrawer.value && isPopupOpen.value) {
    skillDrawer.value.close()
    return true // 阻止页面返回
  }
  return false // 允许页面正常返回
})

// 计算属性
const filteredCategories = computed(() => {
  if (!searchKeyword.value) {
    return categories.value
  }

  const searchResults = searchSkills(searchKeyword.value)
  const categoryKeys = new Set(searchResults.map(result => result.category.key))

  return categories.value.filter(category => categoryKeys.has(category.key))
})

// 方法
function onInputChange(e) {
  inputValue.value = e.detail.value
}

function onInputFocus() {
  // 输入框获得焦点时的处理
}

function onInputBlur() {
  // 输入框失去焦点时的处理
}

// 添加自定义技能
function addCustomSkill() {
  const skill = inputValue.value.trim()
  if (!skill) {
    uni.showToast({
      title: '请输入技能名称',
      icon: 'none'
    })
    return
  }

  // 检查字数限制
  if (skill.length < 2) {
    uni.showToast({
      title: '技能名称至少需要2个字符',
      icon: 'none'
    })
    return
  }

  if (skill.length > 5) {
    uni.showToast({
      title: '技能名称最多只能5个字符',
      icon: 'none'
    })
    return
  }

  // 检查是否与预设技能重复
  const allPresetSkills = getAllSkills()
  if (allPresetSkills.includes(skill)) {
    uni.showToast({
      title: '该技能已存在于预设技能中，请从预设技能中选择',
      icon: 'none'
    })
    return
  }

  // 检查是否与已选择的自定义技能重复
  if (customSkills.value.includes(skill)) {
    uni.showToast({
      title: '该自定义技能已存在',
      icon: 'none'
    })
    return
  }

  // 检查自定义技能数量限制
  if (customSkills.value.length >= props.maxCustomSkills) {
    uni.showToast({
      title: `最多只能添加${props.maxCustomSkills}个自定义技能`,
      icon: 'none'
    })
    return
  }

  // 添加到自定义技能缓存和选择列表
  customSkills.value.push(skill)
  selectedSkills.value.push(skill)
  inputValue.value = ''
  updateValues()

  uni.showToast({
    title: '添加成功',
    icon: 'success'
  })
}

function showSkillSelector() {
  skillDrawer.value.open()
  isPopupOpen.value = true
}

function hideSkillSelector() {
  skillDrawer.value.close()
  isPopupOpen.value = false
}

function onDrawerChange(e) {
  // 抽屉状态变化时的处理
  if (!e) {
    // 抽屉关闭时
    isPopupOpen.value = false
  }
}

function onSearchInput(e) {
  searchKeyword.value = e.detail.value
}

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
    // 注意：canAddSkill 函数内部已经处理了提示，这里不需要重复提示
  }

  // 更新自动擅长领域
  updateAutoCategorieTags()
}

function canAddSkill(skill, categoryKey) {
  const categorySkills = getSkillsByCategory(categoryKey)
  const selectedCategorySkills = selectedSkills.value.filter(s => categorySkills.includes(s))

  console.log('canAddSkill - skill:', skill, 'categoryKey:', categoryKey)
  console.log('canAddSkill - selectedCategorySkills:', selectedCategorySkills)
  console.log('canAddSkill - selectedCategories:', [...selectedCategories.value])

  // 检查每个领域的技能数量限制（包含当前要添加的技能）
  if (selectedCategorySkills.length >= props.maxSkillsPerCategory) {
    uni.showToast({
      title: `每个领域最多选择${props.maxSkillsPerCategory}个技能`,
      icon: 'none'
    })
    return false
  }

  // 检查领域数量限制（如果这是一个新领域）
  if (!selectedCategories.value.has(categoryKey) && selectedCategories.value.size >= props.maxCategories) {
    uni.showToast({
      title: `您最多只能选择${props.maxCategories}个不同领域`,
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
  if (selectedCategorySkills.length >= props.maxSkillsPerCategory) {
    return true
  }

  // 如果是新领域且已达到最大领域数，则禁用
  if (!selectedCategories.value.has(categoryKey) && selectedCategories.value.size >= props.maxCategories) {
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
  } else {
    // 自定义技能：从缓存中移除
    const customIndex = customSkills.value.indexOf(skill)
    if (customIndex > -1) {
      customSkills.value.splice(customIndex, 1)
    }
  }

  updateValues()
}

function resetSkills() {
  // 只重置预设技能，保留自定义技能
  const presetSkills = selectedSkills.value.filter(skill => {
    const category = getCategoryBySkill(skill)
    return category !== null
  })

  // 移除预设技能
  presetSkills.forEach(skill => {
    const index = selectedSkills.value.indexOf(skill)
    if (index > -1) {
      selectedSkills.value.splice(index, 1)
    }
  })

  // 清空选择的分类
  selectedCategories.value.clear()
  searchKeyword.value = ''

  uni.showToast({
    title: '已重置预设技能',
    icon: 'success'
  })
}

function confirmSkills() {
  updateValues()
  hideSkillSelector()
}

function updateValues() {
  emit('update:skills', selectedSkills.value)
  emit('update:categorieTags', autoCategorieTags.value.join(', '))
  emit('change', {
    skills: selectedSkills.value,
    categorieTags: autoCategorieTags.value.join(', ')
  })
}

// 移除擅长领域
function removeStrength(index) {
  const strength = autoCategorieTags.value[index]
  autoCategorieTags.value.splice(index, 1)

  // 找到对应的分类并移除该分类下的所有技能
  const categoryToRemove = Object.keys(categorySkillsMapping).find(key => {
    const categoryData = categorySkillsMapping[key]
    return categoryData.name === strength
  })

  if (categoryToRemove) {
    // 移除该分类下的所有技能
    const categorySkills = getSkillsByCategory(categoryToRemove)
    selectedSkills.value = selectedSkills.value.filter(skill => !categorySkills.includes(skill))

    // 更新分类状态
    const hasOtherSkills = selectedSkills.value.some(skill => {
      const category = getCategoryBySkill(skill)
      return category && category.key === categoryToRemove
    })
    if (!hasOtherSkills) {
      selectedCategories.value.delete(categoryToRemove)
    }
  }

  updateValues()
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

// 判断是否为自定义技能
function isCustomSkill(skill) {
  return getCategoryBySkill(skill) === null
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

  autoCategorieTags.value = [...categorieTags]
  updateValues()
}

// 暴露方法给父组件
defineExpose({
  showSkillSelector,
  hideSkillSelector,
  resetSkills,
  isPopupOpen: computed(() => isPopupOpen.value),
  getValues: () => ({
    skills: selectedSkills.value,
    categorieTags: autoCategorieTags.value.join(', ')
  }),
  validate: () => {
    if (props.required && selectedSkills.value.length === 0) {
      return { valid: false, message: '请至少选择一个技能' }
    }
    return { valid: true }
  }
})
</script>

<style lang="scss" scoped>
@import '/uni.scss';

.skill-selector {
  width: 100%;
}

.skill-input-section {
  margin-bottom: 20rpx;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.skill-input {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  background: transparent;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding-right: 20rpx;
}

.add-custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 50rpx;
  background: linear-gradient(135deg, #007aff, #0056cc);
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.add-custom-btn:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #0056cc, #004499);
}

.add-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: bold;
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 50rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.search-icon:active {
  background: #e9ecef;
  transform: scale(0.95);
}

.custom-skills-tip {
  margin-top: 10rpx;
  padding: 8rpx 12rpx;
  background: #f0f8ff;
  border-radius: 8rpx;
  border: 1rpx solid #e6f3ff;
}

.tip-text {
  font-size: 22rpx;
  color: #007aff;
}

.char-count-tip {
  margin-top: 8rpx;
  display: flex;
  justify-content: flex-end;
}

.char-count-text {
  font-size: 20rpx;
  color: #999;
}

.char-count-text.warning {
  color: #ff9500;
}

.char-count-text.error {
  color: #ff3b30;
}

.selected-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 20rpx;
}

.skill-tag {
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

.skill-tag:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #0056cc, #004499);
}

.skill-text {
  font-size: 24rpx;
  color: #fff;
}

.categorieTags-section {
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.categorieTags-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.strength-tag {
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

.strength-tag:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #20c997, #17a2b8);
}

.strength-text {
  font-size: 24rpx;
  color: #fff;
}

.strength-tag-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 16rpx;
  background: $uni-bg-color-empty;
  border: 1rpx solid #e5e5e5;
  border-radius: 20rpx;
  font-size: 24rpx;
  min-width: 80rpx;
}

.strength-text-empty {
  font-size: 24rpx;
  color: $uni-text-color-inverse;
}


/* 技能选择抽屉样式 */
.skill-selector-modal {
  width: 100%;
  height: 94vh;
  margin-top: var(--status-bar-height, 44px);
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 20rpx 0 0 20rpx;
  overflow: hidden;
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
  background: #fff;
}

.skill-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.skill-close {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.skill-close:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.search-section {
  padding: 15rpx 30rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
  background: #fff;
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

.skill-content {
  flex: 1;
  padding: 0 32rpx;
  overflow-y: auto;
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

.skill-actions {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
  flex-shrink: 0;
  background: #fff;
}

.skill-reset,
.skill-confirm {
  flex: 1;
  height: 70rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
  transition: all 0.3s ease;
}

.skill-reset {
  background: #f5f5f5;
  color: #666;
  margin-right: 12rpx;
}

.skill-reset:active {
  background: #e0e0e0;
  transform: scale(0.98);
}

.skill-confirm {
  background: #007aff;
  color: #fff;
  margin-left: 12rpx;
}

.skill-confirm:active {
  background: #0056cc;
  transform: scale(0.98);
}
</style>