<template>
  <uni-forms ref="formRef" :modelValue="form" :rules="rules" label-width="90">
    <view class="publish-container">
      <!-- 标题 -->
      <uni-forms-item label="任务标题" name="name" required>
        <view class="input-row">
          <uni-easyinput v-model="form.name" maxlength="15" placeholder="请输入任务标题" @input="onTitleInput" />
          <text class="input-count">{{ form.name.length }}/15</text>
        </view>
      </uni-forms-item>
      <!-- 描述 -->
      <uni-forms-item label="任务描述" name="description" required>
        <view class="input-row">
          <uni-easyinput type="textarea" v-model="form.description" maxlength="80" placeholder="请输入任务描述"
            @input="onDescInput" />
          <text class="input-count">{{ form.description.length }}/80</text>
        </view>
      </uni-forms-item>
      <!-- 奖励模式输入框，切换按钮放在输入框 right 插槽，外部包裹全部移除 -->
      <uni-forms-item v-if="form.mode === 'score'" label="任务积分" name="score" :required="true">
        <view class="reward-input">
          <uni-easyinput v-model="scoreProxy" type="number" maxlength="5" placeholder="请输入积分">
            <template #right>
              <view class="mode-switch-btn" @click.stop="setMode('price')"
                style="display:flex;align-items:center;cursor:pointer;">
                <uni-icons type="wallet" size="18" color="#1976d2" style="margin-right:2px;" />
                <text>金额结算</text>
              </view>
            </template>
          </uni-easyinput>
          <view class="max-unit" v-if="scoreMaxUnit && scoreMaxUnit != '个'">{{ scoreMaxUnit }}</view>
        </view>
      </uni-forms-item>
      <uni-forms-item v-else label="任务金额" name="price" :required="true">
        <view class="reward-input">
          <uni-easyinput v-model="priceProxy" type="digit" maxlength="8" placeholder="请输入金额">
            <template #right>
              <view class="mode-switch-btn" @click.stop="setMode('score')"
                style="display:flex;align-items:center;cursor:pointer;">
                <uni-icons type="medal" size="18" color="#1976d2" style="margin-right:2px;" />
                <text>积分结算</text>
              </view>
            </template>
          </uni-easyinput>
          <view class="max-unit" v-if="amountMaxUnit && amountMaxUnit != '个'">{{ amountMaxUnit }}</view>
        </view>
      </uni-forms-item>
      <!-- 参与人数 -->
      <uni-forms-item label="参与人数" name="max_participants" required>
        <uni-easyinput v-model="maxParticipantsProxy" type="number" maxlength="2" placeholder="最大参与人数 1~99" />
      </uni-forms-item>
      <!-- 时间选择 -->
      <uni-forms-item label="任务时段" name="timeRange" required>
        <uni-datetime-picker :key="timeRangeKey" ref="datePickerRef" type="datetimerange" v-model="form.timeRange"
          :start="calendarStart" :end="endDateStr" :hide-second="true" @change="onTimeRangeChange">
          <template #default>
            <view class="custom-time-input" @click="onTimeInputClick">
              <uni-icons type="calendar" size="22" color="#1976d2" style="margin-right:8px;" />
              <text :style="{ color: (form.start_time && form.end_time) ? '#333' : '#bbb', flex: 1 }">
                {{ timeRangeDisplay }}
              </text>
              <uni-icons v-if="form.start_time && form.end_time" type="close" size="20" color="#bbb"
                style="margin-left:8px;" @click="onClearTimeRange()" />
            </view>
          </template>
        </uni-datetime-picker>
        <view v-if="form.start_time && form.end_time" class="duration-text">
          <span v-if="durationTextDisplay">（时长：{{ durationTextDisplay }}）</span>
        </view>
      </uni-forms-item>
      <!-- 任务类型 -->
      <uni-forms-item label="任务类型" name="typeIdx" required>
        <uni-data-picker :localdata="typeOptions" popup-title="请选择任务类型" placeholder="请选择任务类型" v-model="form.typeIdx"
          @change="onTypeChange" />
        <view v-if="form.typeIdx !== -1" class="picker-value">
          <image v-if="typeOptions.find(opt => opt.value === form.typeIdx)?.icon"
            :src="typeOptions.find(opt => opt.value === form.typeIdx)?.icon" class="type-icon" />
          {{typeOptions.find(opt => opt.value === form.typeIdx)?.text}}
        </view>
      </uni-forms-item>
      <!-- 地区选择 -->
      <uni-forms-item label="所属地区" name="location" required>
        <uni-data-picker :localdata="areaPickerData" popup-title="请选择地区" placeholder="请选择省市区" v-model="form.location"
          @change="onAreaChange" />
      </uni-forms-item>
      <!-- 图片/视频上传 -->
      <uni-forms-item label="图片/视频" name="media">
        <media-uploader v-model="form.media" :maxImages="3" :maxImageSize="2 * 1024 * 1024"
          :maxVideoSize="10 * 1024 * 1024" :maxVideoDuration="30" />
      </uni-forms-item>
      <button class="submit-btn" @click="submit">确认提交</button>
    </view>
  </uni-forms>
</template>

<script setup>
import { reactive, ref, computed, nextTick } from 'vue'
import { onReady } from '@dcloudio/uni-app'
import { formatAmountUnits, numberToChinese, formatDuration } from '@/utils/tools.js'
import { categories } from '@/utils/categories.js'
import { areaList } from '@/common/areaList.js'
import MediaUploader from '@/components/media-uploader/media-uploader.vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

const formRef = ref(null)
const datePickerRef = ref(null)
const ALLOWED_DESC_REGEX = /[a-zA-Z0-9\u4e00-\u9fa5\u3002\uff1b\uff0c\uff1a\u201c\u201d\u2018\u2019\uff01\uff1f\u3001\u2014\u2026\u2013\u3010\u3011\u300a\u300b\u3008\u3009\u300e\u300f~!@#$%^&*()_+\-=\[\]{};':",.<>/?，。？！、【】《》“”‘’·￥…—、·\\|/]/g

function getChinaNowStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}
function getTodayZeroStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} 00:00:00`;
}
const calendarStart = getTodayZeroStr();
const form = reactive({
  name: '',
  description: '',
  image: '',
  media: [],
  video: '',
  type: '',
  typeIdx: -1,
  mode: 'score',
  score: 0,
  price: 0.00,
  timeRange: ['', ''],
  start_time: '',
  end_time: '',
  location: [], // 省市区 value 数组
  location_text: [], // 省市区文本数组
  max_participants: 1
})
const rules = {
  name: {
    rules: [
      { required: true, errorMessage: '请填写姓名' },
      { min: 1, max: 15, errorMessage: '最多15字' }
    ]
  },
  description: {
    rules: [
      { required: true, errorMessage: '请输入任务描述', trigger: 'blur' },
      { min: 1, max: 80, errorMessage: '最多80字', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (!value) return callback();
          const str = (value.match(ALLOWED_DESC_REGEX) || []).join('');
          if (str.length !== value.length) return callback('仅限常用中英文及标点');
          return callback();
        }, trigger: 'blur'
      }
    ]
  },
  price: {
    rules: [
      { required: () => form.mode === 'price', errorMessage: '请输入金额', trigger: 'blur' },
      { pattern: /^(0|[1-9]\d{0,4})(\.\d{1,2})?$/, errorMessage: '金额格式不正确', trigger: 'blur' }
    ]
  },
  score: {
    rules: [
      { required: () => form.mode === 'score', errorMessage: '请输入积分', trigger: 'blur' },
      { pattern: /^([1-9]\d{0,4}|100000)$/, errorMessage: '积分为1~100000的正整数', trigger: 'blur' }
    ]
  },
  typeIdx: {
    rules: [
      {
        pattern: /^(?!-1$).+/, // 只要不是-1即可
        errorMessage: '请选择任务类型',
        trigger: 'change'
      }
    ]
  },
  timeRange: {
    rules: [
      {
        required: true,
        errorMessage: '请选择任务时段',
      },
      {
        validateFunction: function (rule, value, data, callback) {
          if (!Array.isArray(value) || value.length !== 2 || !value[0] || !value[1]) {
            callback('请选择任务时段');
            return;
          }
          const now = new Date();
          const minStart = new Date(now.getTime() + 15 * 60 * 1000);
          let start = new Date(value[0].replace(/-/g, '/'));
          let end = new Date(value[1].replace(/-/g, '/'));
          let fixed = false;
          if (start < minStart) {
            start = minStart;
            fixed = true;
          }
          const minEnd = new Date(start.getTime() + 30 * 60 * 1000);
          if (end < minEnd) {
            end = minEnd;
            fixed = true;
          }
          function format(dt) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            const h = String(dt.getHours()).padStart(2, '0');
            const min = String(dt.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${d} ${h}:${min}`;
          }
          if (fixed) {
            // 自动修正并赋值
            data.timeRange = [format(start), format(end)];
            data.start_time = format(start);
            data.end_time = format(end);
            callback();
            return;
          }
          callback();
        }
      }
    ]
  },
  location: {
    rules: [
      { required: true, errorMessage: '请选择地区', trigger: 'change' }
    ]
  },
  max_participants: {
    rules: [
      { required: true, errorMessage: '请输入最大参与人数', trigger: 'blur' },
      { pattern: /^([1-9]|[1-9]\d)$/, errorMessage: '请输入1~99的正整数', trigger: 'blur' }
    ]
  },
  media: {
    rules: [
      { required: true, errorMessage: '请至少上传一张图片', trigger: 'change' }
    ]
  }
}

const typeOptions = categories
  .filter(c => c.use_list && c.catId !== 0)
  .map(c => ({
    ...c,
    value: c.catId
  }))
form.typeIdx = -1 // 未选
function onTypeChange(e) {
  // 清空
  if (!e.detail.value || e.detail.value.length === 0) {
    form.typeIdx = -1
    form.type = ''
    return
  }
  // 正常选择
  const catId = e.detail.value[0].value
  const idx = typeOptions.findIndex(opt => opt.value === catId)
  form.typeIdx = catId
  form.type = typeOptions[idx]?.text || ''
}
// 三级联动数据适配
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
  // 区
  const areas = Object.entries(areaList.counties).map(([code, name]) => ({
    text: name,
    value: code,
    cityCode: code.slice(0, 4) + '00' // 前4位+00
  }))
  // 组装
  provinces.forEach(province => {
    province.children = cities.filter(city => city.provinceCode === province.value)
    province.children.forEach(city => {
      city.children = areas.filter(area => area.cityCode === city.value)
    })
  })
  return provinces
}
const areaPickerData = parseAreaList(areaList)
function onAreaChange(e) {
  // 清空
  if (!e.detail.value || e.detail.value.length === 0) {
    form.location = []
    form.location_text = []
    return
  }
  // 三级联动，存储 value 数组和文本数组
  form.location = e.detail.value.map(item => item.value)
  form.location_text = e.detail.value.map(item => item.text)
}
// 获取省市区文本
function getAreaTextByIndex(idx, code) {
  if (idx === 0) return areaList.provinces[code] || ''
  if (idx === 1) return areaList.cities[code] || ''
  if (idx === 2 && areaList.counties) return areaList.counties[code] || ''
  return ''
}
// 分位与输入框第一位对齐
const amountInput = ref(null)
const scoreInput = ref(null)
const amountMaxUnitLeft = ref(16)
const scoreMaxUnitLeft = ref(16)
function updateMaxUnitPosition(type) {
  nextTick(() => {
    let inputRef = type === 'score' ? scoreInput.value : amountInput.value
    if (inputRef) {
      // 计算第一个数字的偏移
      const rect = inputRef.getBoundingClientRect()
      amountMaxUnitLeft.value = rect.left + 8 // 8为padding，视实际调整
      scoreMaxUnitLeft.value = rect.left + 8
    }
  })
}
const amountMaxUnit = computed(() => {
  const intPart = Number((form.price || '').split('.')[0] || 0);
  const arr = formatAmountUnits(intPart);
  return arr.length ? arr[0].unit : '';
})
const scoreMaxUnit = computed(() => {
  const arr = formatAmountUnits(Number(form.score));
  return arr.length ? arr[0].unit : '';
})
const durationText = computed(() => formatDuration(form.start_time, form.end_time))
const durationTextDisplay = computed(() => durationText.value)
const maxParticipantsProxy = computed({
  get() {
    return form.max_participants === null ? '' : String(form.max_participants)
  },
  set(val) {
    if (val === '' || val === null) {
      form.max_participants = null
    } else {
      const num = Number(val.toString().replace(/[^0-9]/g, ''))
      form.max_participants = isNaN(num) ? null : num
    }
  }
})
const scoreProxy = computed({
  get() {
    return form.score === null || form.score === undefined ? '' : String(form.score)
  },
  set(val) {
    if (val === '' || val === null) {
      form.score = null
    } else {
      const num = Number(val.toString().replace(/[^0-9]/g, ''))
      form.score = isNaN(num) ? null : num
    }
  }
})
const priceProxy = computed({
  get() {
    return form.price === null || form.price === undefined ? '' : String(form.price)
  },
  set(val) {
    if (val === '' || val === null) {
      form.price = null
    } else {
      let num = val.toString().replace(/[^\d.]/g, '')
      num = num.replace(/^0+(?=\d)/, '')
      if (num.indexOf('.') !== -1) {
        num = num.split('.').slice(0, 2).join('.')
        num = num.replace(/(\.\d{2})\d+$/, '$1')
      }
      form.price = num
    }
  }
})
function onTitleInput(e) {
  if (form.name.length > 15) form.name = form.name.slice(0, 15)
}
function onDescInput(e) {
  let str = (form.description.match(ALLOWED_DESC_REGEX) || []).join('');
  str = str.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
  form.description = str.slice(0, 80);
}
function setMode(mode) {
  form.mode = mode
  if (mode === 'score') form.price = 0.00
  else form.score = 0
}
const timeRangeKey = ref(0)
// onTimeRangeChange 只做提示和显示，不再修正 form.timeRange
function onTimeRangeChange(val) {
  if (Array.isArray(val) && val.length === 2) {
    const now = new Date();
    const minStart = new Date(now.getTime() + 15 * 60 * 1000);
    let start = new Date(val[0].replace(/-/g, '/'));
    let end = new Date(val[1].replace(/-/g, '/'));
    let fixed = false;
    if (start < minStart) {
      fixed = true;
    }
    const minEnd = new Date(start.getTime() + 30 * 60 * 1000);
    if (end < minEnd) {
      fixed = true;
    }
    if (fixed) {
      uni.showToast({ title: '任务开始时间需顺延15分钟，且任务时长不少于30分钟，已自动修正', icon: 'none' });
    }
    // 只做提示和 start_time/end_time 显示
    function format(dt) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const h = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d} ${h}:${min}`;
    }
    form.start_time = format(start);
    form.end_time = format(end);
    timeRangeKey.value++;
  } else {
    form.start_time = '';
    form.end_time = '';
    timeRangeKey.value++;
  }
}
// 计算 30 天后的日期字符串（yyyy-MM-dd HH:mm:ss）
function getEndDateStr() {
  const now = new Date()
  now.setDate(now.getDate() + 30)
  return now.toISOString().slice(0, 19).replace('T', ' ')
}
const endDateStr = computed(() => getEndDateStr())
function formatDateTimeHM(str) {
  if (!str) return '';
  if (str.includes('T')) {
    // ISO格式，自动转本地
    const date = new Date(str);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  } else {
    // 普通字符串，直接截取
    return str.slice(0, 16);
  }
}
const typeText = computed(() => {
  return typeOptions.find(opt => opt.value === form.typeIdx)?.text || ''
})
async function submit() {
  console.log('当前rules:', rules);
  console.log('form:', form);
  if (!store.hasLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    await formRef.value.validate(rules);
    // 优化判空逻辑：必须至少有一张图片
    const mediaArr = Array.isArray(form.media) ? form.media : [];
    const hasImage = mediaArr.some(item => item.type === 'image');
    if (!hasImage) {
      uni.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }
    const user_id = store.userInfo && store.userInfo._id;
    console.log('user_id :', user_id);
    const data = {
      ...form,
      user_id: user_id,
      isActive: true,
      create_date: Date.now()
    };
    console.log('do add !')
    return
    // await uniCloud.database().collection('kl-tasks').add(data);
    // uni.showToast({ title: '发布成功', icon: 'success' });
    // uni.navigateBack();
  } catch (err) {
    // 校验失败，不执行提交
    console.error('validate error:', err);
    let msg = '请完善表单';
    if (err && Array.isArray(err) && err[0] && err[0].message) {
      msg = err[0].message;
    }
    uni.showToast({ title: msg, icon: 'none' });
    return;
  }
}
const timeRangeDisplay = computed(() => {
  if (form.start_time && form.end_time) {
    return `${formatDateTimeHM(form.start_time)} ~ ${formatDateTimeHM(form.end_time)}`
  }
  return '请选择任务时段'
})
function clearTimeRange() {
  form.start_time = ''
  form.end_time = ''
  form.timeRange = ['', '']
  timeRangeKey.value++
  // 重置旧的日期时间弹窗组件后立即再打开新的
  // nextTick(() => openDatePicker())
}
function openDatePicker() {
  if (datePickerRef.value && datePickerRef.value.show) {
    datePickerRef.value.show()
  }
}
function onTimeInputClick(e) {
  // 如果点击的是 close 图标，不弹窗
  if (
    e &&
    e.target &&
    e.target.className &&
    typeof e.target.className.indexOf === 'function' &&
    e.target.className.indexOf('uni-icons') !== -1
  ) {
    return;
  }
  openDatePicker();
}
function onClearTimeRange() {
  console.log('do onClearTimeRange!');
  clearTimeRange();
}
onReady(() => {
  if (formRef.value && formRef.value.setRules) {
    formRef.value.setRules(rules)
  }
})
</script>

<style>
.publish-container {
  padding: 16px;
  background: #f7f8fa;
  min-height: 100vh;
}

.input-row {
  display: flex;
  align-items: center;
}

.input-count {
  float: right;
  color: #999;
  font-size: 12px;
  position: absolute;
  right: 0;
  top: 100%;
}

.mode-switch-btn {
  color: #1976d2;
  font-size: 13px;
  margin-left: 8px;
}

.reward-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  position: relative;
}

.reward-input .uni-easyinput {
  flex: 1;
  min-width: 0;
}

.max-unit {
  position: absolute;
  top: 100%;
  left: 12px !important;
  font-size: 12px;
  color: #1976d2;
  font-weight: bold;
  pointer-events: none;
  z-index: 2;
}

.chinese-amount {
  color: #1976d2;
  font-size: 13px;
  margin-left: auto;
  font-weight: bold;
  flex-shrink: 0;
  max-width: 50vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-item {
  margin-bottom: 18px;
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.label {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
  display: block;
  font-weight: 500;
}

.media-preview {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.media-item {
  position: relative;
}

.media-img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}

.media-video {
  width: 120px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}

.media-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

.media-rule {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.submit-btn {
  width: 100%;
  background: #1976d2;
  color: #fff;
  font-size: 16px;
  border-radius: 8px;
  padding: 14px 0;
  margin-top: 24px;
  position: sticky;
  bottom: 0;
}

.submit-btn:disabled {
  background: #ccc;
  color: #fff;
}

.duration-text {
  color: #1976d2;
  font-size: 13px;
  margin-top: 4px;
}

.picker-value {
  color: #666;
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.type-icon {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}

.dropdown-row {
  position: relative;
}

.dropdown-input {
  width: 100%;
  background: #fff;
  border-radius: 6px;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #eee;
  position: relative;
}

.dropdown-placeholder {
  color: #bbb;
}

.type-icon {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}

.custom-time-input {
  display: flex;
  align-items: center;
  min-height: 40px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #eee;
  padding: 0 12px;
}
</style>