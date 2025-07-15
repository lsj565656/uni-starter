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
          <uni-easyinput type="textarea" :trim="true" v-model="form.description" maxlength="80" placeholder="请输入任务描述"
            @input="onDescInput">
            <template #right>
              <uni-icons
                v-if="form.description"
                type="clear"
                size="22"
                color="#c0c4cc"
                @mousedown.prevent
                @click="form.description = ''"
                style="margin-right: 4px; cursor: pointer;"
              />
            </template>
          </uni-easyinput>
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
        <view class="input-row">
          <uni-easyinput v-model="maxParticipantsProxy" type="number" maxlength="2" placeholder="最大参与人数 1~99">
            <template #right>
              <!-- 原有按钮替换为自定义开关 -->
              <view
                class="custom-switch"
                :class="{ active: form.is_publisher_joined }"
                @click="togglePublisherJoin"
              >
                <view class="switch-track"></view>
                <view class="switch-thumb">
                  <text>
                    {{ form.is_publisher_joined ? '参与' : '不参' }}
                  </text>
                </view>
              </view>
            </template>
          </uni-easyinput>
        </view>
        <view class="desc-text" style="margin-top:8px;color:#888;font-size:13px;">
          {{ form.is_publisher_joined ? '发布者将作为参与者加入任务' : '发布者不参与，仅发布任务' }}
        </view>
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
      <uni-forms-item label="任务类型" name="category" required>
        <uni-data-picker :localdata="typeOptions" popup-title="请选择任务类型" placeholder="请选择任务类型" v-model="form.category"
          @change="onTypeChange" />
        <view v-if="form.category !== -1" class="picker-value">
          <image v-if="typeOptions.find(opt => opt.value === form.category)?.icon"
            :src="typeOptions.find(opt => opt.value === form.category)?.icon" class="type-icon" />
          {{typeOptions.find(opt => opt.value === form.category)?.text}}
        </view>
      </uni-forms-item>
      <!-- 地区选择 -->
      <uni-forms-item label="所属地区" name="location" required>
        <uni-data-picker :localdata="areaPickerData" popup-title="请选择地区" placeholder="请选择省市区" v-model="form.location"
          @change="onAreaChange" />
      </uni-forms-item>
      <!-- 图片/视频上传 -->
      <uni-forms-item label="图片/视频" name="media">
        <media-uploader v-model="form.media_detail" :maxImages="3" :maxImageSize="2 * 1024 * 1024"
          :maxVideoSize="10 * 1024 * 1024" :maxVideoDuration="30" />
      </uni-forms-item>
      <button class="submit-btn" @click="submit">确认提交</button>
    </view>
  </uni-forms>
</template>

<script setup>
import { reactive, ref, computed, nextTick, onMounted, watch } from 'vue'
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
  media: [], // 用于提交的媒体数组
  media_detail: [], // 用于上传的媒体详情数组
  category_name: '',
  category: -1,
  mode: 'score',
  score: 0,
  price: 0.00,
  timeRange: ['', ''], // 选择用
  start_time: '',      // 存储用
  end_time: '',        // 存储用
  location: [],        // 省市区 value 数组
  location_text: [],   // 省市区文本数组
  max_participants: 1,
  is_publisher_joined: false,
  joined_count: 0,
  isActive: true
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
  category: {
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
      {
        validateFunction: (rule, value, data, callback) => {
          console.log('do max_participants validateFunction');
          const min = isPublisherJoined.value ? 2 : 1
          if (!value || isNaN(Number(value)) || Number(value) < min) {
            callback(isPublisherJoined.value ? '发布者加入时，参与人数至少2人' : '参与人数至少1人')
            return
          }
          callback()
        },
        trigger: 'blur'
      },
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
form.category = -1 // 未选
function onTypeChange(e) {
  if (!e.detail.value || e.detail.value.length === 0) {
    form.category = -1
    form.category_name = ''
    return
  }
  const catId = e.detail.value[0].value
  const idx = typeOptions.findIndex(opt => opt.value === catId)
  form.category = catId
  form.category_name = typeOptions[idx]?.text || ''
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
  return typeOptions.find(opt => opt.value === form.category)?.text || ''
})
// 优化 toTimestamp，统一输出13位毫秒时间戳
function toTimestamp(str) {
  if (!str) return ''
  if (typeof str === 'number') {
    // 如果是10位，自动转为13位
    if (str < 1e12) return str * 1000
    return str
  }
  // 字符串转13位毫秒
  return new Date(str.replace(/-/g, '/')).getTime()
}
function prepareSubmitData() {
  const data = { ...form }
  if (data.timeRange && data.timeRange.length === 2) {
    data.start_time = toTimestamp(data.timeRange[0])
    data.end_time = toTimestamp(data.timeRange[1])
  }
  if (data.is_publisher_joined) {
    data.joined_count = 1
  }
  // 确保 media 和 media_detail 都包含在提交数据中
  data.media = form.media
  data.media_detail = form.media_detail
  // 统一 create_date 为13位毫秒
  data.create_date = Date.now()
  // 确保 timeRange 字段不会被提交到数据库
  if ('timeRange' in data) {
    delete data.timeRange
  }
  return data
}
const isUploading = ref(false)

// 获取文件扩展名
function getExt(url) {
  const idx = url.lastIndexOf('.')
  return idx !== -1 ? url.slice(idx) : ''
}

// 批量上传所有本地媒体文件，返回全部为云端url的media_detail
async function uploadAllMedia(mediaDetailArr) {
  const uploaded = []
  for (const item of mediaDetailArr) {
    if (typeof item.url === 'string' && (item.url.startsWith('http') || item.url.startsWith('https'))) {
      uploaded.push(item)
    } else {
      try {
        const res = await uniCloud.uploadFile({
          filePath: item.url,
          cloudPath: 'kl-tasks/' + Date.now() + '_' + Math.random().toString(36).slice(2) + getExt(item.url)
        })
        uploaded.push({ ...item, url: res.fileID || res.url })
      } catch (e) {
        throw new Error('文件上传失败: ' + (item.url || '未知文件'))
      }
    }
  }
  return uploaded
}

async function submit() {
  if (!store.hasLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    await formRef.value.validate(rules);
    // 优化判空逻辑：必须至少有一张图片
    const mediaArr = Array.isArray(form.media_detail) ? form.media_detail : [];
    const hasImage = mediaArr.some(item => item.type === 'image');
    if (!hasImage) {
      uni.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }
    isUploading.value = true
    // 1. 上传所有本地文件到云存储
    const uploadedMediaDetail = await uploadAllMedia(form.media_detail)
    form.media_detail = uploadedMediaDetail
    form.media = uploadedMediaDetail.map(item => item.url)
    isUploading.value = false
    // 2. 组装数据并提交
    const user_id = store.userInfo && store.userInfo._id;
    const data = {
      ...prepareSubmitData(),
      user_id: user_id,
      isActive: true,
      create_date: Date.now()
    };
    await uniCloud.database().collection('kl-tasks').add(data);
    uni.showToast({ title: '发布成功', icon: 'success' });
    uni.navigateBack();
  } catch (err) {
    isUploading.value = false
    // 校验失败或上传失败，不执行提交
    console.error('validate/upload error:', err);
    let msg = '请完善表单';
    if (err && err.message) {
      msg = err.message;
    } else if (err && Array.isArray(err) && err[0] && err[0].message) {
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
const isPublisherJoined = ref(false)
function togglePublisherJoin() {
  isPublisherJoined.value = !isPublisherJoined.value
  form.is_publisher_joined = isPublisherJoined.value
}
// 初始化时同步form.is_publisher_joined
onMounted(() => {
  isPublisherJoined.value = !!form.is_publisher_joined
})
onReady(() => {
  if (formRef.value && formRef.value.setRules) {
    formRef.value.setRules(rules)
  }
})

function syncMediaFields() {
  // media_detail 是对象数组，media 只存 url
  form.media = Array.isArray(form.media_detail)
    ? form.media_detail.map(item => item.url)
    : []
}
// 在图片/视频上传后自动同步
watch(() => form.media_detail, syncMediaFields, { deep: true })
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
.custom-switch {
  width: 64px;
  height: 32px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #bbb;
  position: relative;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  display: flex;
  align-items: center;
  user-select: none;
  box-sizing: border-box;
}
.custom-switch.active {
  background: #1976d2;
  border-color: #1976d2;
}
.switch-track {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  border-radius: 16px;
  z-index: 0;
}
.switch-thumb {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  color: #1976d2;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  text-align: center;
  white-space: nowrap;
  padding: 0 1px;
  overflow: visible;
}
.custom-switch.active .switch-thumb {
  left: 28px;
  background: #fff;
  color: #1976d2;
  border-color: #fff;
  box-shadow: 0 4px 16px rgba(25,118,210,0.3);
}
</style>