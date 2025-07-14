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
      <!-- 奖励模式 -->
      <uni-forms-item label="奖励模式" name="mode" required>
        <view class="form-item">
          <view class="input-row" style="align-items: center;">
            <text class="label">{{ form.mode === 'score' ? '积分' : '金额' }}</text>
            <text class="mode-switch-btn" @click="setMode(form.mode === 'score' ? 'price' : 'score')">
              切换为{{ form.mode === 'score' ? '金额' : '积分' }}模式
            </text>
          </view>
          <view v-if="form.mode === 'score'" class="reward-input">
            <uni-easyinput v-model="form.score" type="number" maxlength="5" placeholder="请输入积分" @input="onScoreInput" />
            <view class="max-unit" v-if="scoreMaxUnit && scoreMaxUnit != '个'">{{ scoreMaxUnit }}</view>
          </view>
          <view v-else class="reward-input">
            <uni-easyinput v-model="form.price" type="digit" maxlength="8" placeholder="请输入金额" @input="onPriceInput"
              @blur="onPriceInput" />
            <view class="max-unit" v-if="amountMaxUnit && amountMaxUnit != '个'">{{ amountMaxUnit }}</view>
          </view>
        </view>
      </uni-forms-item>
      <!-- 参与人数 -->
      <uni-forms-item label="参与人数" name="max_participants" required>
        <uni-easyinput v-model="form.max_participants" type="number" maxlength="2" placeholder="最大参与人数 1~99"
          @input="onMaxInput" />
      </uni-forms-item>
      <!-- 时间选择 -->
      <uni-forms-item label="任务时段" name="timeRange" required>
        <uni-datetime-picker :key="timeRangeKey" ref="datePickerRef" type="datetimerange" v-model="timeRange.value"
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
      <view class="form-item">
        <text class="label">图片/视频 *</text>
        <button @click="chooseMedia">上传</button>
        <view class="media-preview">
          <view v-for="(img, idx) in form.media" :key="'img' + idx" class="media-item">
            <image :src="img" class="media-img" />
            <view class="media-remove" @click="removeMedia(idx)">×</view>
          </view>
          <view v-if="form.video" class="media-item">
            <video :src="form.video" class="media-video" controls />
            <view class="media-remove" @click="removeVideo">×</view>
          </view>
        </view>
        <view class="media-rule">上传规则：图片最多上传6张，且每张不超过2MB；视频最多上传1个，且时长不超过20秒</view>
      </view>
      <button class="submit-btn" @click="submit">确认提交</button>
    </view>
  </uni-forms>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { formatAmountUnits, numberToChinese, formatDuration } from '@/utils/tools.js'
import { categories } from '@/utils/categories.js'
import { areaList } from '@/common/areaList.js'

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
const form = ref({
  name: '',
  description: '',
  image: '',
  media: [],
  video: '',
  type: '',
  typeIdx: -1,
  mode: 'score',
  score: '',
  price: '',
  start_time: '',
  end_time: '',
  location: [], // 省市区 value 数组
  location_text: [], // 省市区文本数组
  max_participants: ''
})
const rules = {
  name: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 15, message: '最多15字', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
    { min: 1, max: 80, message: '最多80字', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback();
        const str = (value.match(ALLOWED_DESC_REGEX) || []).join('');
        if (str.length !== value.length) return callback('仅限常用中英文及标点');
        return callback();
      }, trigger: 'blur'
    }
  ],
  price: [
    { required: function () { return form.value.mode === 'price'; }, message: '请输入金额', trigger: 'blur' },
    { pattern: /^(0|[1-9]\d{0,4})(\.\d{1,2})?$/, message: '金额格式不正确', trigger: 'blur' }
  ],
  score: [
    { required: function () { return form.value.mode === 'score'; }, message: '请输入积分', trigger: 'blur' },
    { pattern: /^([1-9]\d{0,4}|100000)$/, message: '积分为1~100000的正整数', trigger: 'blur' }
  ],
  typeIdx: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请选择地区', trigger: 'change' }
  ],
  max_participants: [
    { required: true, message: '请输入最大参与人数', trigger: 'blur' },
    { pattern: /^([1-9]|[1-9]\d)$/, message: '请输入1~99的正整数', trigger: 'blur' }
  ]
}

const typeOptions = categories
  .filter(c => c.use_list && c.catId !== 0)
  .map(c => ({
    ...c,
    value: c.catId
  }))
form.value.typeIdx = -1 // 未选
function onTypeChange(e) {
  // 清空
  if (!e.detail.value || e.detail.value.length === 0) {
    form.value.typeIdx = -1
    form.value.type = ''
    return
  }
  // 正常选择
  const catId = e.detail.value[0].value
  const idx = typeOptions.findIndex(opt => opt.value === catId)
  form.value.typeIdx = catId
  form.value.type = typeOptions[idx]?.text || ''
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
    form.value.location = []
    form.value.location_text = []
    return
  }
  // 三级联动，存储 value 数组和文本数组
  form.value.location = e.detail.value.map(item => item.value)
  form.value.location_text = e.detail.value.map(item => item.text)
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
  const intPart = Number((form.value.price || '').split('.')[0] || 0);
  const arr = formatAmountUnits(intPart);
  return arr.length ? arr[0].unit : '';
})
const scoreMaxUnit = computed(() => {
  const arr = formatAmountUnits(Number(form.value.score));
  return arr.length ? arr[0].unit : '';
})
const scoreChinese = computed(() => form.value.score ? numberToChinese(Number(form.value.score)) + '积分' : '')
const durationText = computed(() => formatDuration(form.value.start_time, form.value.end_time))
const startTimeDisplay = computed(() => formatDateTimeHM(form.value.start_time))
const endTimeDisplay = computed(() => formatDateTimeHM(form.value.end_time))
const durationTextDisplay = computed(() => durationText.value)
function onTitleInput(e) {
  if (form.value.name.length > 15) form.value.name = form.value.name.slice(0, 15)
}
function onDescInput(e) {
  let str = (form.value.description.match(ALLOWED_DESC_REGEX) || []).join('');
  str = str.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
  form.value.description = str.slice(0, 80);
}
function setMode(mode) {
  form.value.mode = mode
  if (mode === 'score') form.value.price = ''
  else form.value.score = ''
}
function onScoreInput(e) {
  let val = e.detail.value.replace(/[^0-9]/g, '').slice(0, 5)
  form.value.score = val
  updateMaxUnitPosition('score')
}
function onPriceInput(e) {
  // 兼容 input/blur 事件
  let val = (e && e.detail && e.detail.value !== undefined) ? e.detail.value : form.value.price || '';
  // 禁止负号
  if (val.includes('-')) val = val.replace(/-/g, '');
  // 只允许数字和小数点
  val = val.replace(/[^\d.]/g, '');
  // 只保留第一个小数点
  val = val.replace(/\.{2,}/g, '.');
  val = val.replace('.', '#').replace(/\./g, '').replace('#', '.');
  // 拆分整数和小数
  let [int, dec] = val.split('.');
  // 处理整数部分
  if (int) {
    // 允许0开头的"0"或"0.xx"，但不允许"00x"或"01x"
    if (int.length > 1 && int.startsWith('0')) int = int.replace(/^0+/, '') || '0';
    int = int.slice(0, 5); // 整数最多5位
  } else {
    int = '';
  }
  // 处理小数部分
  if (typeof dec !== 'undefined') {
    dec = dec.slice(0, 2); // 小数最多2位
    val = int + '.' + dec;
  } else {
    val = int;
  }
  // 如果只输入了小数点，自动补0
  if (val === '.') val = '0.';
  // 如果以0开头且没有小数点，只能是"0"
  if (val.startsWith('0') && val.length > 1 && !val.startsWith('0.')) val = '0';
  form.value.price = val;
}
function onMaxInput(e) {
  let val = e.detail.value.replace(/[^0-9]/g, '')
  if (val.startsWith('0')) val = val.replace(/^0+/, '')
  if (val.length > 2) val = val.slice(0, 2)
  if (val && (Number(val) < 1 || Number(val) > 99)) val = ''
  form.value.max_participants = val
}
// 初始化timeRange
const timeRange = ref(['', ''])
const timeRangeKey = ref(0)
function onTimeRangeChange(val) {
  console.log('onTimeRangeChange val:', val, 'start:', val && val[0], 'end:', val && val[1])
  if (Array.isArray(val) && val.length === 2) {
    // 新增逻辑：开始时间不能早于当前时间+15分钟，结束时间不能早于开始时间+30分钟
    const now = new Date();
    const minStart = new Date(now.getTime() + 15 * 60 * 1000); // 当前时间+15分钟
    let start = new Date(val[0].replace(/-/g, '/'));
    let end = new Date(val[1].replace(/-/g, '/'));
    let fixed = false;
    // 如果开始时间早于当前时间+15分钟
    if (start < minStart) {
      start = minStart;
      fixed = true;
    }
    // 结束时间不能早于开始时间+30分钟
    const minEnd = new Date(start.getTime() + 30 * 60 * 1000);
    if (end < minEnd) {
      end = minEnd;
      fixed = true;
    }
    // 格式化为 yyyy-MM-dd HH:mm
    function format(dt) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const h = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d} ${h}:${min}`;
    }
    if (fixed) {
      uni.showToast({ title: '任务开始时间需顺延15分钟，且任务时长不少于30分钟，已自动修正', icon: 'none' });
    }
    form.value.start_time = format(start);
    form.value.end_time = format(end);
    timeRange.value = [format(start), format(end)];
  } else {
    form.value.start_time = ''
    form.value.end_time = ''
    timeRange.value = ['', '']
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
const canSubmit = computed(() => {
  return (
    form.value.name &&
    form.value.description &&
    form.value.image &&
    form.value.location &&
    form.value.location.length > 0 &&
    form.value.typeIdx !== -1 &&
    ((form.value.mode === 'score' && form.value.score) || (form.value.mode === 'price' && form.value.price)) &&
    form.value.start_time &&
    form.value.end_time &&
    form.value.max_participants >= 1 && form.value.max_participants <= 99
  )
})
function chooseMedia() {
  uni.chooseMedia({
    count: 7,
    mediaType: ['image', 'video'],
    maxDuration: 20,
    success: res => {
      let images = res.tempFiles.filter(f => f.fileType === 'image' && f.size <= 2 * 1024 * 1024)
      let videos = res.tempFiles.filter(f => f.fileType === 'video' && f.size <= 20 * 1024 * 1024 && f.duration <= 20)
      if (images.length > 6) images = images.slice(0, 6)
      if (videos.length > 1) videos = videos.slice(0, 1)
      form.value.media = images.map(f => f.tempFilePath)
      form.value.video = videos[0] ? videos[0].tempFilePath : ''
      form.value.image = form.value.media[0] || form.value.video
    }
  })
}
function removeMedia(idx) {
  form.value.media.splice(idx, 1)
  if (form.value.media.length === 0 && !form.value.video) form.value.image = ''
}
function removeVideo() {
  form.value.video = ''
  if (form.value.media.length === 0) form.value.image = ''
}
async function submit() {
  if (!getApp().globalData.userInfo) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  formRef.value.validate().then(async (valid) => {
    if (!valid) return;
    if (!form.value.image) {
      uni.showToast({ title: '请上传图片/视频', icon: 'none' });
      return;
    }
    const user_id = getApp().globalData.userInfo._id;
    const data = {
      ...form.value,
      type: typeOptions.find(opt => opt.value === form.value.typeIdx)?.text,
      user_id: uniCloud.database().command.objectId(user_id),
      isActive: true,
      create_date: Date.now()
    };
    await uniCloud.database().collection('kl-tasks').add(data);
    uni.showToast({ title: '发布成功', icon: 'success' });
    uni.navigateBack();
  });
}
const timeRangeDisplay = computed(() => {
  if (form.value.start_time && form.value.end_time) {
    return `${formatDateTimeHM(form.value.start_time)} ~ ${formatDateTimeHM(form.value.end_time)}`
  }
  return '请选择任务时段'
})
function clearTimeRange() {
  form.value.start_time = ''
  form.value.end_time = ''
  timeRange.value = ['', '']
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