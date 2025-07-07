<template>
  <view class="publish-container">
    <view class="form-item">
      <text class="label">任务标题 *</text>
      <input v-model="form.name" placeholder="请输入任务标题" />
    </view>
    <view class="form-item">
      <text class="label">任务描述 *</text>
      <textarea v-model="form.description" placeholder="请输入任务描述" maxlength="50" />
    </view>
    <view class="form-item">
      <text class="label">奖励模式</text>
      <button @click="toggleMode">切换为{{ form.mode === 'score' ? '价格' : '积分' }}模式</button>
      <input v-if="form.mode === 'score'" v-model.number="form.score" type="number" placeholder="请输入任务积分" />
      <input v-else v-model.number="form.price" type="number" placeholder="请输入任务价格" />
    </view>
    <view class="form-item">
      <text class="label">任务类型 *</text>
      <picker :range="typeOptions" v-model="form.typeIdx">
        <view class="picker-value">{{ typeOptions[form.typeIdx] || '请选择任务类型' }}</view>
      </picker>
    </view>
    <view class="form-item">
      <text class="label">开始时间 *</text>
      <picker mode="date" v-model="form.start_time">
        <view class="picker-value">{{ form.start_time || '请选择开始时间' }}</view>
      </picker>
    </view>
    <view class="form-item">
      <text class="label">结束时间 *</text>
      <picker mode="date" v-model="form.end_time">
        <view class="picker-value">{{ form.end_time || '请选择结束时间' }}</view>
      </picker>
    </view>
    <view class="form-item">
      <text class="label">所属地区 *</text>
      <input v-model="form.location" placeholder="请输入地区" />
    </view>
    <view class="form-item">
      <text class="label">最大参与人数 *</text>
      <input v-model.number="form.max_participants" type="number" placeholder="请输入最大参与人数" />
    </view>
    <view class="form-item">
      <text class="label">图片/视频 *</text>
      <button @click="chooseMedia">上传</button>
      <view class="media-preview">
        <image v-for="(img, idx) in form.media" :key="idx" :src="img" class="media-img" />
      </view>
    </view>
    <button class="submit-btn" @click="submit">确认提交</button>
  </view>
</template>
<script>
export default {
  data() {
    return {
      form: {
        name: '',
        description: '',
        image: '',
        media: [],
        type: '',
        typeIdx: 0,
        mode: 'score',
        score: 0,
        price: 0,
        start_time: '',
        end_time: '',
        location: '',
        max_participants: 1
      },
      typeOptions: ['邻里帮/顺手帮带', '跑腿/代买', '家政服务', '其他']
    }
  },
  methods: {
    toggleMode() {
      this.form.mode = this.form.mode === 'score' ? 'price' : 'score';
    },
    chooseMedia() {
      uni.chooseImage({
        count: 6,
        success: res => {
          this.form.media = res.tempFilePaths;
          this.form.image = res.tempFilePaths[0];
        }
      });
    },
    async submit() {
      if (!getApp().globalData.userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      // 校验必填
      if (!this.form.name || !this.form.description || !this.form.image || !this.form.location) {
        uni.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }
      const user_id = getApp().globalData.userInfo._id;
      const data = {
        ...this.form,
        type: this.typeOptions[this.form.typeIdx],
        user_id: uniCloud.database().command.objectId(user_id),
        isActive: true,
        create_date: Date.now()
      };
      // 上传图片略（如需云存储可补充）
      await uniCloud.database().collection('kl-tasks').add(data);
      uni.showToast({ title: '发布成功', icon: 'success' });
      uni.navigateBack();
    }
  }
}
</script>
<style scoped>
.publish-container { padding: 16px; }
.form-item { margin-bottom: 16px; }
.label { font-size: 15px; color: #333; margin-bottom: 4px; display: block; }
.picker-value { color: #666; padding: 8px 0; }
.media-preview { display: flex; gap: 8px; margin-top: 8px; }
.media-img { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.submit-btn { width: 100%; background: #1976d2; color: #fff; font-size: 16px; border-radius: 8px; padding: 12px 0; margin-top: 24px; }
</style> 