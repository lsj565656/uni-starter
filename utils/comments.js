// 扁平化 mock 评论数据
const now = Date.now();
export const mockComments = [
  {
    id: 'c1', pid: '0', task_id: 't1', content: '任务很棒，已加入！', createdAt: now - 8 * 24 * 60 * 60 * 1000, // 8天前
    commenter_id: 'u1', commenter_name: '小明', commenter_avatar: '/static/avatar1.png', like_count: 2, is_liked: false,
    replies: [
      {
        id: 'c2', pid: 'c1', task_id: 't1', content: '谢谢支持！', createdAt: now - 7 * 24 * 60 * 60 * 1000, // 7天前
        commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_id: 'u1', target_name: '小明', target_avatar: '/static/avatar1.png', like_count: 1, is_liked: true
      },
      {
        id: 'c3', pid: 'c1', task_id: 't1', content: '我也加入了！', createdAt: now - 6 * 24 * 60 * 60 * 1000, // 6天前
        commenter_id: 'u3', commenter_name: '小红', commenter_avatar: '/static/avatar3.png', target_id: 'u1', target_name: '小明', target_avatar: '/static/avatar1.png', like_count: 0, is_liked: false
      },
      {
        id: 'c6', pid: 'c1', task_id: 't1', content: '回复 作者猫：我也来回复一下作者猫', createdAt: now - 5 * 24 * 60 * 60 * 1000, // 5天前
        commenter_id: 'u10', commenter_name: '小王', commenter_avatar: '/static/avatar10.png', target_id: 'u2', target_name: '作者猫', target_avatar: '/static/avatar2.png', like_count: 0, is_liked: false
      }
    ],
    reply_count: 3
  },
  {
    id: 'c4', pid: '0', task_id: 't1', content: '请问几点开始？', createdAt: now - 4 * 24 * 60 * 60 * 1000, // 4天前
    commenter_id: 'u3', commenter_name: '小红', commenter_avatar: '/static/avatar3.png', like_count: 0, is_liked: false,
    replies: [
      {
        id: 'c5', pid: 'c4', task_id: 't1', content: '明天早上8点哦', createdAt: now - 3 * 24 * 60 * 60 * 1000, // 3天前
        commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_id: 'u3', target_name: '小红', target_avatar: '/static/avatar3.png', like_count: 0, is_liked: false
      }
    ],
    reply_count: 1
  },
  {
    id: 'c100', pid: '0', task_id: 't1', content: '这个任务有点难度，大家怎么看？', createdAt: now - 2 * 24 * 60 * 60 * 1000, // 2天前
    commenter_id: 'u4', commenter_name: '大壮', commenter_avatar: '/static/avatar4.png', like_count: 5, is_liked: false,
    replies: [
      {
        id: 'c101', pid: 'c100', task_id: 't1', content: '确实有点难，不过有挑战才有收获！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000, // 2天前+1小时
        commenter_id: 'u5', commenter_name: '小刚', commenter_avatar: '/static/avatar5.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 1, is_liked: false
      },
      {
        id: 'c102', pid: 'c100', task_id: 't1', content: '我觉得还好，大家一起加油！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2天前+2小时
        commenter_id: 'u6', commenter_name: '小雨', commenter_avatar: '/static/avatar6.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c103', pid: 'c100', task_id: 't1', content: '我来围观一下，哈哈！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000, // 2天前+3小时
        commenter_id: 'u7', commenter_name: '小王', commenter_avatar: '/static/avatar7.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c104', pid: 'c100', task_id: 't1', content: '有难度才有意思！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000, // 2天前+4小时
        commenter_id: 'u8', commenter_name: '小美', commenter_avatar: '/static/avatar8.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c105', pid: 'c100', task_id: 't1', content: '我支持你！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000, // 2天前+5小时
        commenter_id: 'u9', commenter_name: '小志', commenter_avatar: '/static/avatar9.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c106', pid: 'c100', task_id: 't1', content: '加油加油！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000, // 2天前+6小时
        commenter_id: 'u10', commenter_name: '小芳', commenter_avatar: '/static/avatar10.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c107', pid: 'c100', task_id: 't1', content: '我也来试试！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000, // 2天前+7小时
        commenter_id: 'u11', commenter_name: '小亮', commenter_avatar: '/static/avatar11.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      },
      {
        id: 'c108', pid: 'c100', task_id: 't1', content: '大家一起努力！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000, // 2天前+8小时
        commenter_id: 'u12', commenter_name: '小翠', commenter_avatar: '/static/avatar12.png', target_id: 'u4', target_name: '大壮', target_avatar: '/static/avatar4.png', like_count: 0, is_liked: false
      }
    ],
    reply_count: 8
  }
];