import Toast from 'tdesign-miniprogram/toast/index';
import { cdnBase } from '../../../config/index';
import dayjs from 'dayjs';
const formatDate = (timestamp) => dayjs(timestamp).format('YYYY-MM-DD');
// 图片路径前缀
const imgPrefix = `${cdnBase}/`;
// 推荐左图标和右图标
const recLeftImg = `${imgPrefix}common/rec-left.png`;
const recRightImg = `${imgPrefix}common/rec-right.png`;
// 将对象转为查询参数的方法
const obj2Params = (obj = {}, encode = false) => {
  const result = [];
  Object.keys(obj).forEach((key) => result.push(`${key}=${encode ? encodeURIComponent(obj[key]) : obj[key]}`));

  return result.join('&');
};

Page({
  data: {
    // 页面数据
    commentsList: [], // 评论列表
    commentsCount: 0, // 评论总数
    recLeftImg, // 推荐左图标
    recRightImg, // 推荐右图标
    details: {}, // 任务详情
    goodsTabArray: [
      // 任务页的选项卡数组
      {
        name: '任务', // 选项卡名称
        value: '', // 空字符串代表置顶
      },
      {
        name: '详情',
        value: 'goods-page', // 对应选项卡内容页面的值
      },
    ],
    jumpArray: [
      // 底部跳转按钮
      {
        title: '首页',
        url: '/pages/home/home', // 跳转的页面路径
        iconName: 'home', // 图标名称
      },
      {
        title: '购物车',
        url: '/pages/cart/index', // 跳转的页面路径
        iconName: 'cart', // 图标名称
        showCartNum: true, // 是否显示购物车数量
      },
    ],
    cartNum: 0, // 购物车任务数量
    soldout: false, // 是否售罄
    buttonType: 1, // 按钮类型
    buyNum: 1, // 购买数量
    selectedAttrStr: '', // 已选择的规格字符串
    primaryImage: '', // 主图
    allImages: [], // 图片数组
    currentIndex: 0, // 当前轮播图索引
    videoInitialTime: 0, // 视频初始时间
    showPlayButton: true, // 是否显示中央播放按钮
    primaryVideo: '', // 视频url
    buyType: 0, // 购买类型（立即购买/加入购物车）
    outOperateStatus: false, // 是否外层加入购物车
    list: [], // 活动标签列表
    taskId: '', // 任务 ID
    navigation: { type: 'fraction' }, // 导航类型
    current: 0, // 当前轮播图索引
    autoplay: true, // 是否自动播放
    duration: 500, // 动画时长
    interval: 5000, // 自动播放间隔
    soldNum: 0, // 已售数量
    currentDay: '', // 存放当天的日期 给动态日期展示用
    formattedCreatedDate: '', // 格式化任务创建时间  年月日 时分
    publisherInfo: {
      // 任务发布者信息
      publisherName: '', // 发布者名称
      publisherAvatarUrl: '', // 发布者头像地址
      publisherGender: '', // 发布者性别
    },
    showCommentPop: false, // 评论弹窗显隐
    translateY: 0, // 动态偏移值
    startY: 0, // 起始触摸位置
    popupHeight: 0, // 弹窗高度
    isScrolling: false, // 是否正在滚动评论列表
    scrollTopCommentCache: 0, // 缓存 评论滚动的位置
    scrollTopComment: 0, // 评论滚动的位置
    commentContent: '', // 输入框内容
    keyboardHeight: 0, // 动态记录键盘高度
    safeAreaBottom: 0, // 底部安全区域
    commentToWho: 'creater', // 评论对象类型 默认 creater-任务的评论 others-某个评论的子评论
    replytoCommentId: null, // 评论的父id 即：被回复的评论id 默认为顶层评论 null
    autosize: { maxHeight: 80, minHeight: 20 }, // 评论输入框高度范围
    replyTargetId: '', // 当前被回复 目标用户id
    replyTargetName: '', // 当前被回复 目标用户 名称
    currentUserId: '', // 当前登录用户_id
    isloading: false, // 是否正在发送
    ifShowCalendar: false, // 是否展示日程表
    calendarValue: [], // 日程表默认值
    calendarMinDate: 0, // 日程表默认最小日期
    calendarMaxDate: 0, // 日程表默认最大日期
    showTaskTimer: false, // 是否显示任务计时器
    taskTimeLeft: 60, // 任务倒计时(秒)
    taskTimerPaused: true, // 计时器是否暂停
    lastScrollTime: 0, // 最后一次滚动时间
    timerInterval: null, // 计时器interval引用
    isFocused: false, // 当前用户是否已关注该任务
    showConfirm: false, // 取消关注确认弹窗
    joinersList: [], // 参与者列表
    avatars: [], // 用于存储参与者头像URL的数组
    isJoined: false, // 检查用户是否已加入
  },

  calendarFormat(day) {
    // 日程表处理展示文本
    const { date } = day;
    // 获取今天的日期
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    // 获取当前日期的字符串
    const currentDate = new Date(date);
    const currentDateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    // 判断是否是今天
    if (currentDateString === todayString) {
      day.prefix = '今天';
    } else {
      day.prefix = '';
    }
    day.suffix = '';
    return day;
  },

  // 展示日程表
  showCalendar() {
    let { details } = this.data;
    const startTimestamp = Number(details.start_time_stamp);
    const endTimestamp = Number(details.end_time_stamp);
    this.setData({
      ifShowCalendar: true,
      calendarMinDate: startTimestamp,
      calendarMaxDate: endTimestamp,
      calendarValue: [startTimestamp, endTimestamp], // 设置默认选中范围
    });
  },

  // 日历中点击日期时触发
  calendarSelect(e) {
    const { calendarValue } = this.data;
    this.setData({
      calendarValue: calendarValue, // 恢复默认选中范围
    });
  },

  // 立即购买
  buyItNow() {
    // this.showSkuSelectPopup(1); // 显示规格选择弹窗，类型为立即购买
  },
  // 加入购物车
  toAddCart() {
    // this.showSkuSelectPopup(2); // 显示规格选择弹窗，类型为加入购物车
  },

  // 导航跳转
  toNav(e) {
    const { url } = e.detail; // 获取跳转的 URL
    wx.switchTab({
      url: url, // 执行页面跳转
    });
  },

  // 顶部轮播图切换时触发
  onSwiperChange(e) {
    const { currentIndex } = this.data;
    const newIndex = e.detail.current;
    if (currentIndex !== newIndex) {
      const videoContext = wx.createVideoContext('videoPlayer');
      // 如果切换到非视频项，暂停视频
      if (currentIndex === 0) {
        videoContext.pause();
      }
      // 如果切换到视频项，重新加载视频
      if (newIndex === 0) {
        this.setData({ showPlayButton: true });
        videoContext.seek(0); // 重新加载视频 0s开始
      }
    }
    this.setData({ currentIndex: newIndex });
  },

  // 视频播放完成
  onVideoEnded() {
    this.setData({ showPlayButton: true });
  },

  // 视频播放事件
  onVideoPlay() {
    this.setData({ showPlayButton: false });
  },

  // 视频暂停事件
  onVideoPause() {
    this.setData({ showPlayButton: true });
  },

  // 中央播放按钮点击事件
  onPlayButtonClick() {
    const videoContext = wx.createVideoContext('videoPlayer');
    videoContext.play();
    this.setData({ showPlayButton: false });
  },
  // 图片预览
  showCurImg(e) {
    const { index } = e.detail; // 获取当前图片索引
    const { uploaded_files } = this.data.details; // 获取任务的所有上传文件
    // 提取所有 image 类型文件的 URL
    const imageUrls = Array.isArray(uploaded_files)
      ? uploaded_files
          .filter((file) => file.sourceType === 'image') // 筛选出图片类型
          .map((file) => file.fileSource) // 提取图片 URL
      : [];
    // 确保当前索引有效，避免越界
    const currentIndex = index >= 0 && index < imageUrls.length ? index : 0;
    wx.previewImage({
      current: imageUrls[currentIndex], // 当前预览的图片
      urls: imageUrls, // 所有可预览的图片
    });
  },

  // 页面滚动事件
  onPageScroll({ scrollTop }) {
    const goodsTab = this.selectComponent('#goodsTab'); // 获取任务 Tab 组件
    goodsTab && goodsTab.onScroll(scrollTop); // 执行 Tab 组件的滚动事件处理

    // 更新最后活动时间
    if (this.data.showTaskTimer) {
      this.setData({ lastScrollTime: Date.now() });
    }
  },

  // 添加任务到购物车
  addCart() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '点击加入购物车',
      icon: '',
      duration: 1000, // 提示显示时长
    });
  },

  // 跳转到购买页面
  gotoBuy(type) {
    this.handlePopupHide(); // 隐藏规格选择弹窗
    const query = {
      taskId: this.data.taskId, // 任务 ID
      description: this.data.details.description, // 任务名称
      payType: this.data.details.pay_type, // 任务支付方式
      price: this.data.details.price, // 任务售价
      points: this.data.details.points, // 任务积分
      primaryImage: this.data.primaryImage, // 任务主图
      title: this.data.details.title, // 任务标题
    };
    let urlQueryStr = obj2Params({
      tasksRequestList: JSON.stringify([query]), // 将任务请求列表转换为查询参数
    });
    urlQueryStr = urlQueryStr ? `?${urlQueryStr}` : ''; // 拼接查询字符串
    const path = `/pages/order/order-confirm/index${urlQueryStr}`; // 生成跳转路径
    wx.navigateTo({
      url: path, // 跳转到订单确认页面
    });
  },

  // 获取任务详情及活动列表
  getDetail(taskId) {
    console.log('Do getDetail !');
  },

  // 获取任务评论列表 调用云函数 get-task-comments-list
  async getCommentsList(taskId) {
    const cacheCommentsList = wx.getStorageSync('cacheCommentsList'); // 缓存评论列表
    let commentsList = [];
    let commentsCount = 0;
    const pageSize = 20; // 查询分页大小
    let pageNo = 1; // 查询页码
    if (cacheCommentsList && cacheCommentsList.length > 0) {
      console.log('使用缓存中的任务评论列表数据！');
      commentsList = cacheCommentsList;
      // 统计顶层评论及其所有子评论的总数
      commentsCount = this.countAllComments(commentsList);
      this.setData({ commentsList: commentsList, commentsCount: commentsCount });
      return;
    }
    // 触发云函数
    wx.cloud
      .callFunction({
        name: 'get-task-comments-list', // 云函数名称
        data: { taskId: taskId, pageSize: pageSize, pageNo: pageNo },
      })
      .then((res) => {
        const total = res.result.data.total;
        if (total > 0) {
          // 根据 createdAt 格式化 字段为 createdAtText
          commentsList = this.formatComments(res.result.data.records);
          commentsCount = total;
        }
        this.setData({ commentsList: commentsList, commentsCount: commentsCount });
        wx.setStorageSync('cacheCommentsList', commentsList); // 缓存当前评论列表
      })
      .catch((err) => {
        console.error('云函数调用失败', err);
      });
  },

  // 递归计算所有评论
  countAllComments(comments) {
    let count = 0;
    comments.forEach((comment) => {
      count += 1; // 当前评论加1
      if (comment.children && comment.children.length > 0) {
        count += this.countAllComments(comment.children); // 递归统计子评论
      }
    });
    return count;
  },

  // 格式化评论的 createdAtText 时间，包括所有子评论
  formatComments(comments) {
    return comments.map((comment) => {
      // 格式化当前评论的时间
      const formattedDateText = formatDate(comment.createdAt);
      // 如果有子评论，递归处理子评论
      if (comment.children && comment.children.length > 0) {
        comment.children = this.formatComments(comment.children); // 递归格式化子评论
      }
      return {
        ...comment,
        createdAtText: formattedDateText,
      };
    });
  },

  // 分享小程序
  onShareAppMessage() {
    // 自定义的返回信息
    const { selectedAttrStr } = this.data;
    let shareSubTitle = '';
    if (selectedAttrStr.indexOf('件') > -1) {
      const count = selectedAttrStr.indexOf('件');
      shareSubTitle = selectedAttrStr.slice(count + 1, selectedAttrStr.length); // 获取规格名称
    }
    const customInfo = {
      imageUrl: this.data.details.primaryImage, // 分享图片
      title: this.data.details.title + shareSubTitle, // 分享标题 加 规格名称
      path: `/pages/goods/details/index?spuId=${this.data.spuId}`, // 分享路径
    };
    return customInfo; // 返回分享内容
  },

  // 设置主图 将文件里第一个符合条件的图片作为主
  setPrimaryImageAndVideo(uploadedFiles) {
    if (!Array.isArray(uploadedFiles)) return;
    // 筛选出所有图片的 URL 数组
    const allImages = uploadedFiles
      .filter((file) => file.sourceType === 'image') // 筛选图片类型
      .map((file) => file.fileSource); // 提取图片 URL

    // 获取第一个图片作为主图
    const primaryImage = allImages.length > 0 ? allImages[0] : '';

    // 筛选出视频的 URL
    const videoFile = uploadedFiles.find((file) => file.sourceType === 'video');
    const primaryVideo = videoFile ? videoFile.fileSource : '';
    this.setData({
      primaryImage, // 设置主图
      allImages, // 设置所有图片数组
      primaryVideo, // 设置主视频
    });
  },

  // 页面加载时获取任务详情、评论列表和评论统计信息
  onLoad(query) {
    const { taskId } = query; // 获取任务 ID
    // 获取并解析传递的 swipers_item 字符串
    const tasksItem = JSON.parse(decodeURIComponent(query.tasks_item));
    if (tasksItem.task_id) {
      // 如果传递值存在 任务详情数据则直接使用
      this.setPrimaryImageAndVideo(tasksItem.uploaded_files); // 设置主图
      this.setData({
        taskId: taskId,
        details: tasksItem,
        isJoined: false, // 默认设置为未加入状态，后续会检查更新
      });

      // 处理任务创建事件时间戳
      const formattedDateText = formatDate(tasksItem.createdAt);
      this.setData({ formattedCreatedDate: formattedDateText });

      // 检查tasksItem是否已包含发布者信息 有则直接使用
      if (tasksItem.publisherInfo) {
        this.setData({ publisherInfo: tasksItem.publisherInfo });
      } else {
        this.getPublisherNameAndAvatar(tasksItem.task_id, tasksItem.user_id); // 获取发布者 头像 名称 性别
      }

      if (tasksItem.joiner_ids && tasksItem.joiner_ids.length > 0) {
        const cacheJoinersList = wx.getStorageSync('cacheJoinersList');
        if (cacheJoinersList && cacheJoinersList.length > 0) {
          console.log('使用缓存中的参与者列表！');
          const avatarUrls = cacheJoinersList.map((joiner) => joiner.avatar_url || '/images/default-avatar.png');
          this.setData(
            {
              joinersList: cacheJoinersList,
              avatars: avatarUrls,
            },
            () => {
              // 数据设置完成后检查用户是否已加入
              this.checkIfJoined();
            },
          );
        } else {
          this.getJoinerNameAndAvatar(tasksItem.joiner_ids);
        }
      } else {
        // 即使没有参与者，也初始化一下isJoined状态
        this.setData({ isJoined: false });
      }
    } else {
      this.setData({
        taskId: taskId, // 设置 taskId
        isJoined: false, // 默认设置为未加入状态
      });
      this.getDetail(taskId); // 通过传递的 taskId 获取任务详情
    }
    this.getCommentsList(taskId); // 获取任务评论列表
    this.updateCurrentDay(); // 页面加载时更新日期
    // 获取底部安全区域高度
    const systemInfo = wx.getWindowInfo();
    const safeAreaBottom = systemInfo.safeArea ? systemInfo.screenHeight - systemInfo.safeArea.bottom : 0;
    // 监听键盘高度变化
    wx.onKeyboardHeightChange((res) => {
      const height = res.height || 0;
      this.setData({
        keyboardHeight: height,
      });
    });
    this.setData({ safeAreaBottom: safeAreaBottom, currentUserId: wx.getStorageSync('userId') });
    // this.checkIsFollowed(wx.getStorageSync('userId'), taskId);
    const plazaTaskInfo = wx.getStorageSync('currentPlazaTask');
    if (plazaTaskInfo) {
      this.initTaskTimer();
    }
  },

  getPublisherNameAndAvatar(taskId, publisherUserId) {
    wx.cloud
      .callFunction({
        name: 'get-publisher-info', // 云函数名称
        data: { relUserId: publisherUserId },
      })
      .then((res) => {
        const { _id } = res.result.data;
        if (_id) {
          this.setData({
            publisherInfo: {
              publisherName: res.result.data.nick_name,
              publisherAvatarUrl: res.result.data.avatar_url,
              publisherGender: res.result.data.gender,
            },
          });
          // 根据 task_id 将对应的发布者信息缓存到 cachePromotionTaskList
          const cacheList = wx.getStorageSync('cachePromotionTaskList') || [];
          // 找到对应任务项并更新
          const taskIndex = cacheList.findIndex((item) => item.task_id === taskId);
          if (taskIndex > -1) {
            const { publisherInfo } = this.data;
            cacheList[taskIndex].publisherInfo = publisherInfo;
            wx.setStorageSync('cachePromotionTaskList', cacheList); // 更新缓存
          }
        }
      })
      .catch((err) => {
        console.error('云函数调用失败', err);
      });
  },

  updateCurrentDay() {
    const now = new Date(); // 获取当前时间
    const day = now.getDate(); // 提取日期数
    this.setData({
      currentDay: day, // 更新数据绑定
    });
  },

  // 立即加入方法
  toJoinNow() {
    const userId = wx.getStorageSync('userId'); // 获取当前登录用户userId
    if (!userId) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先登录',
        icon: '',
        duration: 1500,
      });
      return;
    }

    // 重新检查用户是否已加入任务，确保按钮状态与实际状态一致
    // const isAlreadyJoined = this.checkIfJoined();
    // if (isAlreadyJoined) {
    //   Toast({
    //     context: this,
    //     selector: '#t-toast',
    //     message: '您已加入过该任务',
    //     icon: '',
    //     duration: 1500,
    //   });
    //   return;
    // }

    const { details, publisherInfo, formattedCreatedDate, isJoined } = this.data;

    // 检查是否是自己发布的任务
    if (details.user_id === userId) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '无需加入自己发的任务',
        icon: '',
        duration: 1500,
      });
      return;
    }
    const query = {
      taskId: details._id, // 任务唯一id
      showImageUrl: details.showImageUrl, // 任务首图展示
      title: details.title, // 任务标题
      description: details.description, // 任务详情
      payType: details.pay_type, // 任务支付消耗类型 积分、余额
      points: details.points, // 任务消耗积分
      price: details.price, // 任务消耗价格金额
      taskType: details.task_type, // 任务类型 文字
      areaText: details.area_text, // 任务所在地区 文字
      formattedCreatedDate: formattedCreatedDate, // 格式化后的发布日期
      startTime: details.start_time, // 任务开始时间
      endTime: details.end_time, // 任务结束时间
      userId: details.user_id, // 任务发布者_id
      publisherName: publisherInfo.publisherName, // 任务发布者名称
      publisherAvatarUrl: publisherInfo.publisherAvatarUrl, // 任务发布者头像
      publisherGender: publisherInfo.publisherGender, // 任务发布者性别
      joinerIds: details.joiner_ids, // 任务参与者_id
      joinersMax: details.joiners_max, // 任务最大参与者
      isJoined: isJoined, // 当前用户是否已加入该任务
    };
    let urlQueryStr = obj2Params({
      tasksRequestList: JSON.stringify([query]), // 将任务请求列表转换为查询参数
    });
    urlQueryStr = urlQueryStr ? `?${urlQueryStr}` : ''; // 拼接查询字符串
    const path = `/pages/task/task-confirm/index${urlQueryStr}`; // 生成跳转路径
    wx.navigateTo({
      url: path, // 跳转到订单确认页面
    });
  },

  // 检查用户是否已加入该任务
  checkIfJoined() {
    const userId = wx.getStorageSync('userId');
    const userOpenId = wx.getStorageSync('openid');
    const { joinersList } = this.data;
    if (!userId || !joinersList || !Array.isArray(joinersList) || joinersList.length === 0) {
      this.setData({ isJoined: false });
      return false;
    }
    // 尝试多种可能的匹配方式
    const isJoined = joinersList.some((joiner) => {
      const matchById = joiner._id === userId;
      const matchByOpenId = userOpenId && joiner.open_id === userOpenId;
      return matchById || matchByOpenId;
    });
    this.setData({ isJoined });
    return isJoined;
  },

  // 用户关注任务
  toFocusNow() {
    const userId = wx.getStorageSync('userId'); // 获取当前登录用户userId
    if (!userId) {
      console.log('当前用户未登录！');
      return;
    }
    const { details, isFocused } = this.data;
    // if (details.user_id == userId) {
    //   console.log('不可关注自己作品哦！');
    //   return;
    // }
    if (isFocused) {
      console.log('已关注！');
      return;
    }
    try {
      wx.cloud
        .callFunction({
          name: 'create-followed-info',
          data: {
            userId: userId,
            validStartTime: details.start_time_stamp,
            validEndTime: details.end_time_stamp,
            followType: 'task',
            followId: details.task_id,
            followTime: new Date().getTime(),
          },
        })
        .then((res) => {
          if (res.result.code === 202) {
            // 记录已存在且未逻辑删除
            wx.showToast({
              title: res.result.message,
              icon: 'none',
            });
            this.setData({ isFocused: true });
            return;
          }
          if (res.result.code === 208) {
            // 记录已存在但已逻辑删除
            wx.showToast({
              title: res.result.message,
              icon: 'success',
            });
            this.setData({ isFocused: true });
            return;
          }
          if (res.result.data.id) {
            this.setData({ isFocused: true });
            wx.showToast({ title: '关注成功', icon: 'success' });
          }
        });
    } catch (error) {
      wx.showToast({ title: '关注时遇到错误', icon: 'none' });
    }
  },

  // 检测用户是否已经关注
  checkIsFollowed(userId, taskId) {
    wx.cloud
      .callFunction({
        name: 'get-followed-info', // 云函数名称
        data: { userId: userId, taskId: taskId, followType: 'task' },
      })
      .then((res) => {
        const { _id, is_deleted } = res.result.data;
        console.log('_id:' + _id);
        if (_id && !is_deleted) {
          // 如果 该用户已为任务点赞 且未逻辑删除
          this.setData({ isFocused: true });
        }
      })
      .catch((err) => {
        console.error('云函数调用失败', err);
      });
  },

  // 取消关注
  toCancelFocusNow() {
    const { details } = this.data;
    const userId = wx.getStorageSync('userId');
    console.log('userId: ' + userId);
    console.log('taskId: ' + details.task_id);
    wx.cloud
      .callFunction({
        name: 'delete-followed-info', // 云函数名称
        data: { userId: wx.getStorageSync('userId'), taskId: details.task_id, followType: 'task' },
      })
      .then((res) => {
        const { count } = res.result.data;
        if (count > 0) {
          wx.showToast({ title: '已取关！', icon: 'success' });
          this.setData({ isFocused: false });
        }
      })
      .catch((err) => {
        console.error('云函数调用失败', err);
      });
    this.setData({
      showConfirm: false,
    });
  },

  // 取消关注弹窗开启
  cancelFocusDialogOn() {
    const userId = wx.getStorageSync('userId'); // 获取当前登录用户userId
    if (!userId) {
      console.log('当前用户未登录！');
      return;
    }
    this.setData({
      showConfirm: true,
    });
  },

  // 取消关注弹窗关闭
  cancelFocusDialogOff() {
    this.setData({
      showConfirm: false,
    });
  },

  /** 打开弹窗 */
  openCommentPop() {
    const { scrollTopCommentCache } = this.data;
    this.setData({
      showCommentPop: true,
      translateY: 0, // 打开时重置偏移
      scrollTopComment: scrollTopCommentCache, // 更新缓存滚动位置
    });
    // 动态获取弹窗高度
    const query = wx.createSelectorQuery();
    query
      .select('.popup-container')
      .boundingClientRect((res) => {
        if (res) {
          this.setData({ popupHeight: res.height });
        }
      })
      .exec();
  },

  /** 关闭弹窗 */
  closeCommentPop() {
    const { popupHeight } = this.data;
    this.setData({
      translateY: popupHeight, // 滑动剩余距离
    });
    // 动画结束后隐藏弹窗
    setTimeout(() => {
      this.setData({
        showCommentPop: false,
        keyboardHeight: 0,
      });
    }, 300);
  },

  /** 触摸开始 */
  onTouchStart(e) {
    if (!this.data.isScrolling) {
      // 如果没有滚动才启用触摸逻辑
      this.setData({
        startY: e.touches[0].pageY,
      });
    }
  },

  /** 触摸移动 */
  onTouchMove(e) {
    if (!this.data.isScrolling) {
      const { startY } = this.data;
      const deltaY = e.touches[0].pageY - startY;
      // 限制滑动范围，只允许向下滑动
      if (deltaY >= 0) {
        this.setData({ translateY: deltaY });
      }
    }
  },

  /** 触摸结束 */
  onTouchEnd() {
    if (!this.data.isScrolling) {
      const { translateY, popupHeight } = this.data;
      // 判断是否超过弹窗高度的 1/3
      if (translateY >= popupHeight / 3) {
        this.closeCommentPop(); // 滑动关闭
      } else {
        // 恢复初始位置
        this.setData({ translateY: 0 });
      }
    }
  },

  /** 评论滚动时 */
  onCommentScroll(e) {
    const { scrollTop } = e.detail;
    if (scrollTop > 0) {
      this.setData({ isScrolling: true });
    }
    if (scrollTop === 0) {
      this.setData({ isScrolling: false });
    }
    this.setData({
      scrollTopCommentCache: scrollTop,
    });
  },

  /** 评论滚动到顶部时 */
  onCommentScrollTop() {
    this.setData({ isScrolling: false });
  },

  /** 触摸开始-最外边弹层 */
  onTouchStartPop(e) {
    this.setData({
      startY: e.touches[0].pageY,
    });
  },

  /** 触摸移动-最外边弹层  */
  onTouchMovePop(e) {
    const { startY } = this.data;
    const deltaY = e.touches[0].pageY - startY;
    // 限制滑动范围，只允许向下滑动
    if (deltaY >= 0) {
      this.setData({ translateY: deltaY });
    }
  },

  /** 触摸结束-最外边弹层  */
  onTouchEndPop() {
    const { translateY, popupHeight } = this.data;
    // 判断是否超过弹窗高度的 1/3
    if (translateY >= popupHeight / 3) {
      this.closeCommentPop(); // 滑动关闭
    } else {
      // 恢复初始位置
      this.setData({ translateY: 0 });
    }
  },

  /** 监听输入框内容 */
  onCommentInput(e) {
    // 获取输入内容
    let inputValue = e.detail.value;
    // 仅匹配汉字 大小写英文字符和数字 以及常用标点符号和一些常见的特殊字符
    inputValue = inputValue.replace(
      /[^，。！？、；：'""（）《》【】——~·￥——,.!?'"()<>[\]{}\-+%&*^#@$=_\u4e00-\u9fa5a-zA-Z0-9 ]/g,
      '',
    );
    this.setData({
      commentContent: inputValue,
    });
  },

  /** 通过评论的回复 打开回复弹窗 */
  openReplyPop(e) {
    // 兼顾外层首评方法
    const { showCommentPop } = this.data;
    if (!showCommentPop) {
      // 未打开弹窗时 点击回复 先打开弹窗
      this.setData({
        showCommentPop: true,
        translateY: 0, // 打开时重置偏移
        scrollTopComment: 0, // 更新缓存滚动位置
      });
    }
    const commentId = e.currentTarget.dataset.id;
    const replyTargetId = e.currentTarget.dataset.replytargetid;
    const replyTargetName = e.currentTarget.dataset.replytargetname;
    const { currentUserId } = this.data;
    if (replyTargetId === currentUserId) {
      // 目前设定 不能回复本人的评论
      Toast({ context: this, selector: '#t-toast', message: '不能回复本人', duration: 500 });
      return;
    }
    this.setData({
      commentToWho: 'others',
      replytoCommentId: commentId, // 评论的父id 默认为 null
      replyTargetId: replyTargetId,
      replyTargetName: replyTargetName,
    });
  },

  /** 三级以及更低级别评论卡组件 通过评论的回复 打开回复弹窗 */
  subOpenFatherReplyPop(e) {
    let detail = e.detail;
    if (!detail) {
      console.log('未获取到有效的 detail 数据');
      return;
    }
    const commentId = detail.id;
    const replyTargetId = detail.replytargetid;
    const replyTargetName = detail.replytargetname;
    const { currentUserId } = this.data;
    if (replyTargetId === currentUserId) {
      // 目前设定 不能回复本人的评论
      Toast({ context: this, selector: '#t-toast', message: '不能回复本人', duration: 800 });
      return;
    }
    this.setData({
      commentToWho: 'others',
      replytoCommentId: commentId, // 评论的父id 默认为 null
      replyTargetId: replyTargetId,
      replyTargetName: replyTargetName,
    });
  },

  // 关闭特定回复（评论的回复）
  replyHandleClosed() {
    // 关闭特定回复 则回复为初始状态
    this.setData({
      commentToWho: 'creater',
      replytoCommentId: '',
      replyTargetId: '',
      replyTargetName: '',
    });
  },

  /** 发布评论 */
  doCommentSumit(e) {
    const { commentContent, details, publisherInfo, replytoCommentId, replyTargetId, replyTargetName } = this.data;
    this.setData({ isloading: true });
    if (commentContent === '') {
      Toast({ context: this, selector: '#t-toast', message: '内容不能为空', duration: 500 });
      this.setData({ isloading: false });
      return;
    }
    const { towho } = e.currentTarget.dataset; // creater:顶级评论 others:评论的评论
    // 调用文字处理接口过滤掉 违禁词
    // 调用云函数保存用户发布的评论
    const taskId = details.task_id; // 任务id
    let pid = ''; // 评论的父id
    const taskOwnerId = details.user_id; // 任务发布者id user_id
    const taskOwnerName = publisherInfo.publisherName; // 任务发布者名
    const commenterId = wx.getStorageSync('userId'); // 评论者id
    const commenterName = wx.getStorageSync('nickName'); // 评论者名称
    let targetId = ''; // 被评论者id
    let targetName = ''; // 被评论者名称
    if (towho === 'creater') {
      // 顶层评论时： 任务发布者 即为 被评论者；评论的父id 为 0
      pid = '0';
      targetId = taskOwnerId;
      targetName = taskOwnerName;
    } else if (towho === 'others') {
      pid = replytoCommentId; // 被回复评论的 唯一数据标识_id
      targetId = replyTargetId; // 被回复评论的 发布者id
      targetName = replyTargetName; // 被回复评论的 发布者名称
    }
    wx.cloud
      .callFunction({
        // 云函数名称
        name: 'create-task-comment-info',
        // 传给云函数的参数
        data: {
          taskId: taskId,
          pid: pid,
          taskOwnerId: taskOwnerId,
          taskOwnerName: taskOwnerName,
          content: commentContent,
          commenterId: commenterId,
          commenterName: commenterName,
          targetId: targetId,
          targetName: targetName,
        },
      })
      .then((res) => {
        if (res.result && res.result.data && res.result.data.id) {
          const newComment = {
            _id: res.result.data.id,
            pid: pid,
            commenter_id: commenterId,
            commenter_name: commenterName,
            content: commentContent,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdAtText: formatDate(Date.now()),
            target_id: targetId,
            target_name: targetName,
            avatar_url: wx.getStorageSync('avatarUrl') || '', // 可替换为实际头像路径
            children: [],
            gender: wx.getStorageSync('gender') || '0', // 可替换为实际性别
            task_id: taskId,
            task_owner_id: taskOwnerId,
            task_owner_name: taskOwnerName,
          };
          // 更新 cacheCommentsList 和 commentsList commentsCount
          let { commentsList, commentsCount } = this.data;
          let cacheCommentsList = wx.getStorageSync('cacheCommentsList') || [];
          if (pid === '0') {
            // 顶层评论直接添加到列表
            cacheCommentsList.unshift(newComment);
            commentsList.unshift(newComment);
          } else {
            const findParentComment = (list, parentId) => {
              for (const comment of list) {
                if (comment._id === parentId) return comment;
                if (comment.children && comment.children.length > 0) {
                  const found = findParentComment(comment.children, parentId);
                  if (found) return found;
                }
              }
              return null;
            };
            const parentCommentCache = findParentComment(cacheCommentsList, pid);
            if (parentCommentCache) {
              parentCommentCache.children.push(newComment);
            } else {
              console.log('未找到父评论（缓存）');
            }

            const parentCommentUI = findParentComment(commentsList, pid);
            if (parentCommentUI) {
              parentCommentUI.children.push(newComment);
            } else {
              console.log('未找到父评论（界面）');
            }
          }
          commentsCount += 1;
          // 更新缓存
          wx.setStorageSync('cacheCommentsList', cacheCommentsList);
          // 更新界面
          this.setData({ commentsList: [...commentsList], commentsCount, isloading: false });
          // 关闭特定回复 则回复为初始状态
          this.setData({
            commentContent: '',
            commentToWho: 'creater',
            replyTargetId: '',
            replyTargetName: '',
          });
          Toast({ context: this, selector: '#t-toast', message: '评论成功', duration: 500 });
        }
      });
  },

  // 添加计时器相关方法
  initTaskTimer() {
    // 检查是否需要显示计时器
    const plazaTaskInfo = wx.getStorageSync('currentPlazaTask');
    // 从父页面获取计时状态
    const pages = getCurrentPages();
    const planetPage = pages.find((p) => p.route === 'pages/planet/index');
    if (plazaTaskInfo && !plazaTaskInfo.completed && planetPage) {
      this.setData({
        showTaskTimer: planetPage.data.showTaskTimer,
        taskTimeLeft: planetPage.data.taskTimeLeft,
        showBackButton: planetPage.data.showBackButton,
      });
    }
    // 开始监听页面活动
    this.startActivityMonitoring();
  },

  startActivityMonitoring() {
    const MIN_ACTIVITY_INTERVAL = 3000;
    this.setData({ lastScrollTime: Date.now() });

    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - this.data.lastScrollTime < MIN_ACTIVITY_INTERVAL) {
        if (this.data.taskTimerPaused) {
          this.setData({ taskTimerPaused: false });
        }
        if (this.data.taskTimeLeft > 0) {
          this.setData({ taskTimeLeft: this.data.taskTimeLeft - 1 });
        } else {
          this.completeTask();
        }
      } else {
        if (!this.data.taskTimerPaused) {
          this.setData({ taskTimerPaused: true });
        }
      }
    }, 1000);

    this.setData({ timerInterval: interval });
  },

  completeTask() {
    clearInterval(this.data.timerInterval);

    // 获取缓存中的任务信息
    const plazaTaskInfo = wx.getStorageSync('currentPlazaTask');
    if (plazaTaskInfo) {
      plazaTaskInfo.completed = true;
      plazaTaskInfo.taskTimeLeft = 0;
      plazaTaskInfo.endTime = Date.now();
      wx.setStorageSync('currentPlazaTask', plazaTaskInfo);
      this.setData({
        showTaskTimer: false,
        taskTimeLeft: 0,
      });
      wx.showToast({
        title: `获得${plazaTaskInfo.points}积分`,
        icon: 'success',
        duration: 2000,
        complete: () => {
          this.setData({
            taskTimeLeft: 0,
          });
        },
      });
      this.updatePoints(plazaTaskInfo.points, plazaTaskInfo.type);
    }
  },
  // 修改原有的更新积分方法
  updatePoints(change, type) {
    // 更新缓存中的积分
    const oldPoints = wx.getStorageSync('points');
    const newPoints = oldPoints + change;
    wx.setStorageSync('points', newPoints);
    // 记录积分历史
    let changeSource = 1; // 默认为任务中心奖励
    let changeSourceText = '逛逛广场奖励';
    this.recordPointsHistory({
      red_user_id: wx.getStorageSync('openid') || 'unknown',
      point_num: newPoints,
      change_points: change,
      change_source: changeSource,
      change_source_text: changeSourceText,
      type: type,
    });
  },

  // 记录积分历史的方法
  recordPointsHistory(data) {
    wx.cloud
      .callFunction({
        name: 'create-point-his',
        data: data,
      })
      .then((res) => {
        console.log('积分历史记录成功', res);
      })
      .catch((err) => {
        console.error('积分历史记录失败', err);
      });
  },

  handleBackToPoints() {
    wx.navigateTo({
      url: '/pages/usercenter/daily-attendance/index',
    });
  },

  onUnload() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
    const { taskTimeLeft } = this.data;
    // 离开页面时 更新 fromPageType 为 details 更新 taskTimeLeft
    const details = 'details';
    let plazaTaskInfo = wx.getStorageSync('currentPlazaTask');
    plazaTaskInfo.fromPageType = details;
    plazaTaskInfo.taskTimeLeft = taskTimeLeft;
    wx.setStorageSync('currentPlazaTask', plazaTaskInfo);
  },

  // 添加获取参与者信息的方法
  getJoinerNameAndAvatar(joinerIds) {
    if (!joinerIds || joinerIds.length === 0) {
      return;
    }

    console.log('正在获取参与者信息，joinerIds:', joinerIds);

    wx.cloud
      .callFunction({
        name: 'get-joins-list',
        data: { joinerIds },
      })
      .then((res) => {
        if (res.result.code === 200) {
          // 检查返回的数据结构，确保能正确提取参与者列表
          let joinersList = [];
          // 判断是否有records属性
          if (res.result.data.records && Array.isArray(res.result.data.records)) {
            joinersList = res.result.data.records;
          }
          // 或者data本身就是数组
          else if (Array.isArray(res.result.data)) {
            joinersList = res.result.data;
          }
          // 提取头像URL数组
          const avatarUrls = joinersList.map((joiner) => joiner.avatar_url || '/images/default-avatar.png');

          this.setData(
            {
              joinersList: joinersList,
              avatars: avatarUrls,
            },
            () => {
              // 设置完数据后检查用户是否已加入
              this.checkIfJoined();
            },
          );

          wx.setStorageSync('cacheJoinersList', joinersList);
        } else {
          console.error('获取参与者信息失败:', res.result.message);
        }
      })
      .catch((err) => {
        console.error('调用云函数失败:', err);
      });
  },

  // 页面显示时检查状态
  onShow() {
    // 检查用户是否已处于参与状态
    if (this.data.joinersList && this.data.joinersList.length > 0) {
      this.checkIfJoined();
    }
  },
});
