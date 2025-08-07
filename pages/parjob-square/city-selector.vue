<template>
  <view class="city-selector-page">
    <!-- 导航栏 -->
    <uni-nav-bar :fixed="true" :border="false" :shadow="false" :statusBar="true" background-color="#fff" color="#333"
      left-icon="left" left-text="" title="选择城市" @clickLeft="goBack">
      <template #right>
        <view class="nav-right-btn" @click="confirmSelection">
          <text class="confirm-text">确定</text>
        </view>
      </template>
    </uni-nav-bar>
    <view class="city-selector-container">
      <!-- 搜索框 -->
      <view class="search-section">
        <view class="search-container">
          <uni-icons type="search" size="16" color="#999" />
          <input 
            class="search-input" 
            placeholder="搜索城市" 
            v-model="searchKeyword"
            @input="onSearchInput"
          />
          <uni-icons v-if="searchKeyword" type="clear" size="16" color="#999" @click="clearSearch" />
        </view>
      </view>

      <!-- 已选择的城市 -->
      <view v-if="selectedCities.length > 0" class="selected-section">
        <view class="section-title">已选择的城市 ({{ selectedCities.length }}/4)</view>
        <view class="selected-cities">
          <view v-for="(city, index) in selectedCities" :key="index" class="selected-city-tag">
            <text class="city-text">{{ city.name }}</text>
            <uni-icons type="close" size="12" color="#666" @click="removeCity(index)" />
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searchKeyword && searchResults.length > 0" class="search-results-section">
        <view class="section-title">搜索结果</view>
        <view class="search-results">
          <view v-for="city in searchResults" :key="city.code" class="city-item"
            :class="{ active: isCitySelected(city.name) }" @click="toggleCity(city)">
            <text class="city-name">{{ city.name }}</text>
            <uni-icons v-if="isCitySelected(city.name)" type="checkmarkempty" size="16" color="#007aff" />
          </view>
        </view>
      </view>
    </view>

    <!-- 省市选择器 -->
    <view v-if="!searchKeyword" class="province-city-section">
      <view class="section-title">选择省市</view>
      
      <!-- 省份选择 -->
      <view class="province-selector">
        <view class="selector-label">选择省份</view>
        <picker :value="selectedProvinceIndex" :range="provinceList" range-key="name" @change="onProvinceChange">
          <view class="picker-wrapper">
            <text class="picker-text">{{ selectedProvinceIndex >= 0 ? provinceList[selectedProvinceIndex].name : '请选择省份' }}</text>
            <uni-icons type="arrowdown" size="14" color="#666" />
          </view>
        </picker>
      </view>
      
      <!-- 城市选择 -->
      <view v-if="currentCities.length > 0" class="city-selector">
        <view class="selector-label">选择城市</view>
        <view class="city-grid">
          <view v-for="city in currentCities" :key="city.code" class="city-item"
            :class="{ active: isCitySelected(city.name) }" @click="toggleCity(city)">
            <text class="city-name">{{ city.name }}</text>
            <uni-icons v-if="isCitySelected(city.name)" type="checkmarkempty" size="16" color="#007aff" />
          </view>
        </view>
      </view>
    </view>

    <!-- 热门城市 -->
    <view v-if="!searchKeyword" class="hot-cities-section">
      <view class="section-title">热门城市</view>
      <view class="hot-cities">
        <view v-for="city in hotCities" :key="city.code" class="hot-city-item"
          :class="{ active: isCitySelected(city.name) }" @click="toggleCity(city)">
          <text class="city-name">{{ city.name }}</text>
          <uni-icons v-if="isCitySelected(city.name)" type="checkmarkempty" size="16" color="#007aff" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { areaList } from '@/common/areaList.js'
import { onMounted, ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 响应式数据
const selectedCities = ref([])
const searchKeyword = ref('')
const searchResults = ref([])
const selectedProvinceIndex = ref(-1)
const provinceList = ref([])
const currentCities = ref([])

// 热门城市（包含完整信息）
const hotCities = ref([
  { code: '110100', name: '北京市', province: '北京市' },
  { code: '310100', name: '上海市', province: '上海市' },
  { code: '440100', name: '广州市', province: '广东省' },
  { code: '440300', name: '深圳市', province: '广东省' },
  { code: '330100', name: '杭州市', province: '浙江省' },
  { code: '510100', name: '成都市', province: '四川省' },
  { code: '420100', name: '武汉市', province: '湖北省' },
  { code: '610100', name: '西安市', province: '陕西省' },
  { code: '320100', name: '南京市', province: '江苏省' },
  { code: '500100', name: '重庆市', province: '重庆市' }
])

// 页面参数
const pageParams = ref({})

// 计算属性：当前省份的城市列表
const currentCitiesComputed = computed(() => {
  if (selectedProvinceIndex.value < 0) return []
  
  const province = provinceList.value[selectedProvinceIndex.value]
  if (!province) return []
  
  // 从 areaList 中获取该省份的所有城市
  const cities = []
  Object.keys(areaList.cities).forEach(code => {
    if (code.startsWith(province.code.slice(0, 2))) {
      cities.push({
        code: code,
        name: areaList.cities[code],
        province: province.name
      })
    }
  })
  
  return cities
})

// 监听计算属性变化
watch(currentCitiesComputed, (newCities) => {
  currentCities.value = newCities
})

// 监听已选择城市的变化，自动设置省份
watch(selectedCities, (newCities) => {
  if (newCities && newCities.length > 0) {
    // 获取最后一个选择的城市对应的省份
    const lastCity = newCities[newCities.length - 1]
    if (lastCity && lastCity.code) {
      const provinceCode = lastCity.code.slice(0, 2) + '0000'
      const provinceIndex = provinceList.value.findIndex(p => p.code === provinceCode)
      if (provinceIndex !== -1) {
        selectedProvinceIndex.value = provinceIndex
      }
    }
  }
}, { deep: true })

// 方法
// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 确认选择
function confirmSelection() {
  const cityData = selectedCities.value.map(city => {
    if (!city || !city.name || !city.code) return null // Safety check
    return {
      name: city.name,
      province: city.province,
      code: city.code,
      location: [city.code.slice(0, 2) + '0000', city.code],
      location_text: [city.province, city.name]
    }
  }).filter(Boolean) // Filter out null values
  uni.$emit('citySelected', cityData)
  uni.navigateBack()
}

function onProvinceChange(e) {
  const index = Number.parseInt(e.detail.value)
  selectedProvinceIndex.value = index
}

function toggleCity(city) {
  if (!city || !city.name) return
  
  const index = selectedCities.value.findIndex(c => c.name === city.name)
  if (index > -1) {
    selectedCities.value.splice(index, 1)
  } else {
    if (selectedCities.value.length < 4) {
      selectedCities.value.push(city)
      
      // 如果是热门城市或搜索结果，自动设置对应的省份选择
      if (city.code) {
        const provinceCode = city.code.slice(0, 2) + '0000'
        const provinceIndex = provinceList.value.findIndex(p => p.code === provinceCode)
        if (provinceIndex !== -1) {
          selectedProvinceIndex.value = provinceIndex
        }
      }
    } else {
      uni.showToast({
        title: '最多选择4个城市',
        icon: 'none'
      })
    }
  }
}

function removeCity(index) {
  selectedCities.value.splice(index, 1)
}

function isCitySelected(cityName) {
  return selectedCities.value.some(city => city.name === cityName)
}

function onSearchInput() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  
  const keyword = searchKeyword.value.trim()
  const results = []
  
  // 搜索所有城市
  Object.keys(areaList.cities).forEach(code => {
    const cityName = areaList.cities[code]
    if (cityName.includes(keyword)) {
      // 找到对应的省份
      const provinceCode = code.slice(0, 2) + '0000'
      const provinceName = areaList.provinces[provinceCode] || ''
      
      results.push({
        code: code,
        name: cityName,
        province: provinceName
      })
    }
  })
  
  searchResults.value = results.slice(0, 20) // 限制搜索结果数量
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
}

// 初始化省份数据
function initProvinceData() {
  const provinces = []
  Object.keys(areaList.provinces).forEach(code => {
    provinces.push({
      code: code,
      name: areaList.provinces[code]
    })
  })
  provinceList.value = provinces
}

// 处理页面参数和初始化数据
function initData(options) {
  pageParams.value = options || {}
  // 设置已选择的城市
  if (pageParams.value.selected) {
    try {
      // 尝试解析JSON格式的城市数据
      const selectedCitiesJson = decodeURIComponent(pageParams.value.selected)
      const selectedCitiesData = JSON.parse(selectedCitiesJson)
      if (Array.isArray(selectedCitiesData)) {
        // 处理城市对象数组
        selectedCitiesData.forEach(cityData => {
          if (cityData.name) {
            // 先在热门城市中查找
            const hotCity = hotCities.value.find(city => city.name === cityData.name)
            if (hotCity) {
              selectedCities.value.push(hotCity)
              return
            }
            
            // 在所有城市中查找
            Object.keys(areaList.cities).forEach(code => {
              if (areaList.cities[code] === cityData.name) {
                const provinceCode = code.slice(0, 2) + '0000'
                const provinceName = areaList.provinces[provinceCode] || ''
                
                selectedCities.value.push({
                  code: code,
                  name: cityData.name,
                  province: provinceName
                })
              }
            })
          }
        })
      }
    } catch (error) {
      // 如果JSON解析失败，尝试旧的字符串格式
      const selectedCityNames = pageParams.value.selected.split(',').filter(Boolean)
      
      selectedCityNames.forEach(cityName => {
        // 先在热门城市中查找
        const hotCity = hotCities.value.find(city => city.name === cityName)
        if (hotCity) {
          selectedCities.value.push(hotCity)
          return
        }
        
        // 在所有城市中查找
        Object.keys(areaList.cities).forEach(code => {
          if (areaList.cities[code] === cityName) {
            const provinceCode = code.slice(0, 2) + '0000'
            const provinceName = areaList.provinces[provinceCode] || ''
            
            selectedCities.value.push({
              code: code,
              name: cityName,
              province: provinceName
            })
          }
        })
      })
    }
  }
  
  // 初始化省份数据
  initProvinceData()
}

// 使用 onLoad 生命周期获取页面参数
onLoad((options) => {
  initData(options)
})

// 初始化数据
onMounted(async () => {
  // 如果 onLoad 没有获取到参数，尝试从 getCurrentPages 获取
  if (!pageParams.value.selected) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage && currentPage.options) {
      initData(currentPage.options)
    }
  }
})
</script>

<style scoped>
.city-selector-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.city-selector-container {
  position: sticky;
  top: calc(44px + var(--status-bar-height));
  z-index: 1000;
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

.confirm-text {
  font-size: 28rpx;
  color: #007aff;
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
  font-size: 28rpx;
  color: #333;
}

.selected-section,
.province-city-section,
.hot-cities-section,
.search-results-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.selected-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.selected-city-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f0f8ff;
  color: #007aff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.city-info {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.city-text {
  font-size: 24rpx;
  font-weight: 500;
}

.province-selector,
.city-selector {
  margin-bottom: 30rpx;
}

.selector-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background: #fff;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15rpx;
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.city-item.active {
  background: #f0f8ff;
  border-color: #007aff;
}

.city-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.hot-cities {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15rpx;
}

.hot-city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.hot-city-item.active {
  background: #f0f8ff;
  border-color: #007aff;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.search-results .city-item {
  grid-template-columns: 1fr;
  margin-bottom: 0;
}
</style> 