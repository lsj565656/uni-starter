<template>
  <view class="ucenter-container">
    <!-- 顶部状态栏占位和渐变背景 -->
    <view
      class="status-bar-placeholder"
      :style="{ height: statusBarHeight + 'px', background: statusBarBg }"
    ></view>
    <view class="center">
      <uni-sign-in ref="signIn" @signInSuccess="onSignInSuccess"></uni-sign-in>
      <view class="userInfo" @click.capture="toUserInfo">
        <!-- 使用 cloud-image（uniCloud 优化） -->
        <view
          v-if="hasLogin && userInfo.avatar_file && userInfo.avatar_file.url"
          class="avatar-container"
        >
          <cloud-image width="150rpx" height="150rpx" :src="userInfo.avatar_file.url"></cloud-image>
        </view>

        <view v-else class="defaultAvatarUrl">
          <uni-icons color="#ffffff" size="50" type="person-filled" />
        </view>

        <view class="logo-title">
          <text class="uer-name" v-if="hasLogin">{{
            userInfo.nickname || userInfo.username || userInfo.mobile
          }}</text>
          <text class="uer-name" v-else>{{ $t('mine.notLogged') }}</text>
        </view>
      </view>
      <uni-grid class="home" :column="3" :showBorder="false" :square="true">
        <uni-grid-item class="item" @click.native="goToMyPublishedTasks">
          <uni-badge
            :text="userInfo.publishedCount || 0"
            absolute="rightTop"
            size="small"
            type="error"
          >
            <view class="grid-item-content">
              <uni-icons class="icon" color="#007AFF" type="paperplane" size="26"></uni-icons>
              <text class="text">发布的任务</text>
            </view>
          </uni-badge>
        </uni-grid-item>
        <uni-grid-item class="item" @click.native="goToMyJoinedTasks">
          <uni-badge
            :text="userInfo.joinedCount || 0"
            absolute="rightTop"
            size="small"
            type="error"
          >
            <view class="grid-item-content">
              <uni-icons class="icon" color="#007AFF" type="staff" size="26"></uni-icons>
              <text class="text">参与的任务</text>
            </view>
          </uni-badge>
        </uni-grid-item>
        <uni-grid-item class="item" @click.native="goToMySchedule">
          <uni-icons class="icon" color="#007AFF" type="calendar" size="26"></uni-icons>
          <text class="text">任务时间表</text>
        </uni-grid-item>
      </uni-grid>
      <uni-list class="center-list" v-for="(sublist, index) in ucenterList" :key="index">
        <uni-list-item
          v-for="(item, i) in sublist"
          :title="item.title"
          link
          clickable
          showArrow
          :key="i"
          @click="ucenterListClick(item, $event)"
          :show-extra-icon="true"
          :extraIcon="{ type: item.icon, color: '#999' }"
        >
          <template v-slot:footer>
            <!-- 我的积分项：未登录时不显示刷新按钮和积分 -->
            <view v-if="item.showRefresh && hasLogin && item.title === this.$t('mine.myScore')" class="item-footer" @click.stop>
              <text class="item-footer-text" @click="refreshScore">{{
                (userInfo.score || 0) + ' 积分'
              }}</text>
              <uni-icons
                type="reload"
                size="22"
                color="#1976d2"
                @click="refreshScore"
                style="margin-right: 12px"
              />
            </view>
            <!-- 我的余额项：未登录时不显示刷新按钮和余额 -->
            <view v-if="item.showRefresh && hasLogin && item.title === '我的余额'" class="item-footer" @click.stop>
              <text class="item-footer-text" @click="refreshBalance">{{
                currentBalance + ' 元'
              }}</text>
              <uni-icons
                type="reload"
                size="22"
                color="#1976d2"
                @click="refreshBalance"
                style="margin-right: 12px"
              />
            </view>
            <view v-else-if="item.showBadge" class="item-footer">
              <text class="item-footer-text">{{ item.rightText }}</text>
              <view class="item-footer-badge"></view>
            </view>
          </template>
        </uni-list-item>
      </uni-list>
    </view>
  </view>
</template>

<script>
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version'
// #ifdef APP
import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js'
const uniShare = new UniShare()
// #endif
const database = uniCloud.database()
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { onPageScroll } from '@dcloudio/uni-app'
export default {
  // #ifdef APP
  onBackPress({ from }) {
    if (from == 'backbutton') {
      this.$nextTick(function () {
        uniShare.hide()
      })
      return uniShare.isShow
    }
  },
  // #endif
  data() {
    return {
      homeList: [
        {
          text: this.$t('mine.showText'),
          icon: 'chat'
        },
        {
          text: this.$t('mine.showText'),
          icon: 'cloud-upload'
        },
        {
          text: this.$t('mine.showText'),
          icon: 'contact'
        },
        {
          text: this.$t('mine.showText'),
          icon: 'download'
        }
      ],
      ucenterList: [
        [
          // #ifdef APP-PLUS
          {
            title: this.$t('mine.signInByAd'),
            event: 'signInByAd',
            icon: 'compose'
          },
          // #endif
          {
            title: this.$t('mine.signIn'),
            event: 'signIn',
            icon: 'compose'
          },
          // #ifdef APP-PLUS
          {
            title: this.$t('mine.toEvaluate'),
            event: 'gotoMarket',
            icon: 'star'
          },
          //#endif
          {
            title: this.$t('mine.myFav') || '我点赞的',
            to: '/pages/ucenter/myFav',
            icon: 'heart',
            iconColor: '#e74c3c'
          },
          {
            title: this.$t('mine.myScore'),
            to: '/pages/ucenter/point/index',
            icon: 'paperplane',
            showRefresh: true,
            showArrow: false,
            rightText: 0
          },
          {
            title: '我的余额',
            to: '/pages/ucenter/balance/index',
            icon: 'wallet',
            showRefresh: true,
            showArrow: false,
            rightText: 0
          },
          // #ifdef APP
          {
            title: this.$t('mine.invite'),
            event: 'share',
            icon: 'redo'
          }
          // #endif
        ],
        [
          {
            title: this.$t('mine.feedback'),
            to: '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback',
            icon: 'help'
          },
          {
            title: this.$t('mine.settings'),
            to: '/pages/ucenter/settings/settings',
            icon: 'gear'
          }
        ],
        // #ifdef APP
        [
          {
            title: this.$t('mine.about'),
            to: '/pages/ucenter/about/about',
            icon: 'info'
          }
        ]
        // #endif
      ],
      listStyles: {
        height: '150rpx', // 边框高度
        width: '150rpx', // 边框宽度
        border: {
          // 如果为 Boolean 值，可以控制边框显示与否
          color: '#eee', // 边框颜色
          width: '1px', // 边框宽度
          style: 'solid', // 边框样式
          radius: '100%' // 边框圆角，支持百分比
        }
      },
      statusBarHeight: 0,
      statusBarAlpha: 0.4,
      userScore: 0
    }
  },
  async onLoad() {
    //#ifdef APP-PLUS
    const appVersion = this.appVersion
    // 使用兼容的方式获取倒数第二个元素
    const secondLastIndex = this.ucenterList.length - 2
    if (secondLastIndex >= 0) {
      this.ucenterList[secondLastIndex].unshift({
        title: this.$t('mine.checkUpdate'),
        rightText: appVersion ? appVersion.version + '-' + appVersion.versionCode : '',
        event: 'checkVersion',
        icon: 'loop',
        showBadge: appVersion ? appVersion.hasNew : false
      })
    }
    //#endif
    this.userScore = store.userInfo.score || 0
    // 统计任务数量
    await this.fetchTaskCounts()
    this.checkBalanceCache() // 页面加载时检查余额缓存
    
    // 监听充值成功事件，实时更新余额显示
    uni.$on('rechargeSuccess', this.handleRechargeSuccess)
  },
  async onShow() {
    // this.userScore = await fetchUserScore()
    this.userScore = store.userInfo.score || 0
    // 页面显示时检查余额缓存
    this.checkBalanceCache()
  },
  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('rechargeSuccess', this.handleRechargeSuccess)
  },
  computed: {
    userInfo() {
      return store.userInfo
    },
    hasLogin() {
      return store.hasLogin
    },
    // 实时余额显示
    currentBalance() {
      return this.formatBalance(store.userInfo.balance || 0)
    },
    // #ifdef APP-PLUS
    appVersion() {
      return getApp().appVersion || { version: '', versionCode: '', hasNew: false }
    },
    // #endif
    appConfig() {
      return getApp().globalData.config
    },
    statusBarBg() {
      return `rgba(255,255,255,${this.statusBarAlpha})`
    }
  },
  mounted() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 0
  },
  created() {
    onPageScroll(e => {
      let alpha = 0.4 + (Math.min(e.scrollTop || 0, 100) / 100) * 0.7
      if (alpha > 1) alpha = 1
      this.statusBarAlpha = alpha
    })
  },
  methods: {
    toSettings() {
      uni.navigateTo({
        url: '/pages/ucenter/settings/settings'
      })
    },
    signIn() {
      //普通签到
      this.$refs.signIn.open()
    },
    signInByAd() {
      //看激励视频广告签到
      this.$refs.signIn.showRewardedVideoAd()
    },
    /**
     * 个人中心项目列表点击事件
     */
    ucenterListClick(item) {
      // 我的积分和我点赞的，未登录时直接跳转登录页并阻断原有跳转
      if (
        (item.to === '/pages/ucenter/point/index' || item.to === '/pages/ucenter/myFav') &&
        !this.hasLogin
      ) {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
        })
        return
      }
      // 其他有 to 的项，不登录也可跳转
      if (item.to) {
        uni.navigateTo({ url: item.to })
        return
      }
      // 事件型
      if (item.event) {
        this[item.event]()
      }
    },
    async checkVersion() {
      const res = await callCheckVersion()
      if (res.result.code > 0) {
        checkUpdate()
      } else {
        uni.showToast({
          title: res.result.message,
          icon: 'none'
        })
      }
    },
    toUserInfo() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
      })
    },
    tapHome(index) {
      uni.showToast({
        // title: '你点击了，第' + (index + 1) + '个',
        title: this.$t('mine.clicked') + ' ' + (index + 1),
        icon: 'none'
      })
    },
    /**
     * 去应用市场评分
     */
    gotoMarket() {
      // #ifdef APP-PLUS
      if (uni.getSystemInfoSync().platform == 'ios') {
        // 这里填写appstore应用id
        const appstoreid = this.appConfig.marketId.ios // 'id1417078253';
        plus.runtime.openURL(
          'itms-apps://' + 'itunes.apple.com/cn/app/wechat/' + appstoreid + '?mt=8',
          error => {
            console.log('plus.runtime.openURL err:' + JSON.stringify(error))
          }
        )
      }
      if (uni.getSystemInfoSync().platform == 'android') {
        const Uri = plus.android.importClass('android.net.Uri')
        const uri = Uri.parse('market://details?id=' + this.appConfig.marketId.android)
        const Intent = plus.android.importClass('android.content.Intent')
        const intent = new Intent(Intent.ACTION_VIEW, uri)
        const main = plus.android.runtimeMainActivity()
        main.startActivity(intent)
      }
      // #endif
    },
    /**
     * 主动刷新积分余额
     */
    refreshScore() {
      if (this.hasLogin) {
        database
          .collection('uni-id-scores')
          .where('user_id == $env.uid')
          .orderBy('create_date', 'desc')
          .limit(1)
          .get()
          .then(res => {
            const data = res.result.data[0]
            if (data) {
              // 使用 mutations 的 setUserInfo 方法，确保持久化到本地存储
              mutations.setUserInfo({ score: data.balance })
              uni.showToast({ title: '积分已刷新', icon: 'success' })
            } else {
              mutations.setUserInfo({ score: 0 })
              uni.showToast({ title: '暂无积分', icon: 'none' })
            }
          })
      }
    },
    async share() {
      const { result } = await database
        .collection('uni-id-users')
        .where('\'_id\' == $cloudEnv_uid')
        .field('my_invite_code')
        .get()
      const myInviteCode = result.data[0].my_invite_code
      if (!myInviteCode) {
        return uni.showToast({
          title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
          icon: 'none'
        })
      }
      const { appName, logo, slogan } = this.appConfig.about
      // #ifdef APP
      uniShare.show(
        {
          content: {
            //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
            type: 0,
            href:
              this.appConfig.h5.url +
              `/#/pages/ucenter/invite/invite?code=uniInvitationCode:${myInviteCode}`,
            title: appName,
            summary: slogan,
            imageUrl: logo + '?x-oss-process=image/resize,m_fill,h_100,w_100' //压缩图片解决，在ios端分享图过大导致的图片失效问题
          },
          menus: [
            {
              img: '/static/app/sharemenu/wechatfriend.png',
              text: this.$t('common.wechatFriends'),
              share: {
                provider: 'weixin',
                scene: 'WXSceneSession'
              }
            },
            {
              img: '/static/app/sharemenu/wechatmoments.png',
              text: this.$t('common.wechatBbs'),
              share: {
                provider: 'weixin',
                scene: 'WXSceneTimeline'
              }
            },
            {
              img: '/static/app/sharemenu/weibo.png',
              text: this.$t('common.weibo'),
              share: {
                provider: 'sinaweibo'
              }
            },
            {
              img: '/static/app/sharemenu/qq.png',
              text: 'QQ',
              share: {
                provider: 'qq'
              }
            },
            {
              img: '/static/app/sharemenu/copyurl.png',
              text: this.$t('common.copy'),
              share: 'copyurl'
            },
            {
              img: '/static/app/sharemenu/more.png',
              text: this.$t('common.more'),
              share: 'shareSystem'
            }
          ],
          cancelText: this.$t('common.cancelShare')
        },
        e => {
          //callback
          console.log(e)
        }
      )
      // #endif
    },
    goToMyPublishedTasks() {
      uni.navigateTo({ url: '/pages/ucenter/myTasks/published' })
    },
    goToMyJoinedTasks() {
      uni.navigateTo({ url: '/pages/ucenter/myTasks/joined' })
    },
    goToMySchedule() {
      uni.showToast({
        title: '时间表开发者 敬请期待',
        icon: 'none',
        duration: 3000
      })
    },
    // 签到成功回调
    onSignInSuccess(signInData) {
      // 立即更新本地积分显示
      if (signInData && signInData.score !== undefined) {
        // 使用 mutations 的 setUserInfo 方法，确保持久化到本地存储
        mutations.setUserInfo({ score: signInData.score })
        // 强制更新页面显示
        this.$forceUpdate()
        
        // 发送签到成功事件，供其他页面监听
        uni.$emit('signInSuccess', signInData)
        
        uni.showToast({
          title: '积分已更新',
          icon: 'success',
          duration: 1500
        })
      }
    },
    // 获取任务数量统计
    async fetchTaskCounts() {
      if (!this.hasLogin) return
      try {
        const res = await uniCloud.callFunction({
          name: 'publishAndJoinedCounts',
          data: {
            userId: store.userInfo._id
          }
        })
        if (res.result && res.result.code === 0) {
          const { publishedCount, joinedCount } = res.result.data
          // 使用 mutations 方法更新 store 中的计数，确保持久化
          mutations.setUserInfo({
            publishedCount,
            joinedCount
          })
          // 强制更新页面
          this.$forceUpdate()
        }
      } catch (error) {
        console.error('获取任务数量失败:', error)
      }
    },
    // 格式化余额显示
    formatBalance(balance) {
      return Number(balance || 0).toFixed(2)
    },
    // 刷新余额 - 从 kl-id-balance 表获取最新余额
    async refreshBalance() {
      if (this.hasLogin) {
        try {
          // 并行获取余额和充值记录
          const [balanceRes, recordsRes] = await Promise.all([
            database
              .collection('kl-id-balance')
              .where('user_id == $env.uid')
              .orderBy('create_date', 'desc')
              .limit(1)
              .get(),
            database
              .collection('kl-id-balance')
              .where('user_id == $env.uid && type == 5')
              .orderBy('create_date', 'desc')
              .limit(20)
              .get()
          ])
          
          let balance = 0
          if (balanceRes.result.data && balanceRes.result.data.length > 0) {
            balance = (balanceRes.result.data[0].balance || 0) / 100 // 转换为元
          }
          
          // 处理充值记录
          let rechargeRecords = []
          if (recordsRes.result.data && recordsRes.result.data.length > 0) {
            rechargeRecords = recordsRes.result.data.map(record => ({
              ...record,
              status: 'success',
              create_time: record.create_date,
              amount: record.amount / 100
            }))
          }
          
          // 使用 mutations 方法更新 store 中的余额，确保持久化
          mutations.setUserInfo({ balance })
          
          // 同时更新本地存储缓存，包含余额和充值记录
          try {
            const cachedData = uni.getStorageSync('userBalanceCache') || {}
            cachedData.balance = balance
            cachedData.rechargeRecords = rechargeRecords
            cachedData.timestamp = Date.now()
            uni.setStorageSync('userBalanceCache', cachedData)
          } catch (error) {
            console.error('更新余额缓存失败:', error)
          }
          
          uni.showToast({ title: '余额已刷新', icon: 'success' })
        } catch (error) {
          console.error('刷新余额失败:', error)
          uni.showToast({ title: '刷新余额失败', icon: 'none' })
        }
      }
    },
    
    // 页面显示时检查余额缓存
    checkBalanceCache() {
      if (this.hasLogin) {
        try {
          const cachedData = uni.getStorageSync('userBalanceCache')
          if (cachedData && cachedData.balance !== undefined) {
            // 使用缓存数据更新store
            mutations.setUserInfo({ balance: cachedData.balance })
          }
        } catch (error) {
          console.error('读取余额缓存失败:', error)
        }
      }
    },
    // 充值成功事件处理
    handleRechargeSuccess(data) {
      console.log('个人中心收到充值成功通知:', data)
      if (data && data.amount) {
        // 计算新的余额（当前余额 + 充值金额）
        const currentBalance = store.userInfo.balance || 0
        const rechargeAmount = data.amount / 100 // 转换为元
        const newBalance = currentBalance + rechargeAmount
        
        // 更新store中的余额
        mutations.setUserInfo({ balance: newBalance })
        
        // 同时更新本地存储缓存
        try {
          const cachedData = uni.getStorageSync('userBalanceCache') || {}
          cachedData.balance = newBalance
          cachedData.timestamp = Date.now()
          uni.setStorageSync('userBalanceCache', cachedData)
        } catch (error) {
          console.error('更新余额缓存失败:', error)
        }
        
        console.log('个人中心余额已更新:', newBalance)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ucenter-container {
  background: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 10rpx;
}
.status-bar-placeholder {
  transition: background 0.2s;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}
/* #ifndef APP-NVUE */
view {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
}

page {
  background-color: #f8f8f8;
}
/* #endif*/

.center {
  display: flex;
  flex: 1;
  flex-direction: column;
  background-color: #f8f8f8;
}

.userInfo {
  padding-top: 60px;
  /* 方案1：使用外部图片 */
  background-image: url('/static/images/user-bg.png');
  background-size: cover;
  background-position: center;
  position: relative;
  flex-direction: column;
  align-items: center;
}
.defaultAvatarUrl {
  width: 150rpx;
  height: 150rpx;
  background-color: #007aff;
  border-radius: 100%;
  justify-content: center;
  align-items: center;
}

.avatar-container {
  border-radius: 100%;
  overflow: hidden;
  width: 150rpx;
  height: 150rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 100%;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.logo-title {
  flex: 1;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
}

.uer-name {
  height: 100rpx;
  line-height: 100rpx;
  font-size: 38rpx;
  color: #ffffff;
}

.center-list {
  margin-bottom: 30rpx;
  background-color: #f9f9f9;
}

.center-list-cell {
  width: 750rpx;
  background-color: #007aff;
  height: 40rpx;
}

.home {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 6px;
  flex: none !important;
}

.uni-grid .text {
  font-size: 16px;
  height: 25px;
  line-height: 25px;
  color: #817f82;
}

.uni-grid .item ::v-deep .uni-grid-item__box {
  justify-content: center;
  align-items: center;
}

.grid-item-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 移除自定义角标样式，使用官方 uni-badge 组件 */

/*修改边线粗细示例*/
/* #ifndef APP-NVUE */
.center-list ::v-deep .uni-list--border:after {
  -webkit-transform: scaleY(0.2);
  transform: scaleY(0.2);
  margin-left: 80rpx;
}

.center-list ::v-deep .uni-list--border-top,
.center-list ::v-deep .uni-list--border-bottom {
  display: none;
}

/* #endif */
.item-footer {
  flex-direction: row;
  align-items: center;
}

.item-footer-text {
  color: #999;
  font-size: 32rpx;
  padding-right: 10rpx;
}

.item-footer-badge {
  width: 20rpx;
  height: 20rpx;
  /* #ifndef APP-NVUE */
  border-radius: 50%;
  /* #endif */
  /* #ifdef APP-NVUE */
  border-radius: 10rpx;
  /* #endif */
  background-color: #dd524d;
}
</style>
