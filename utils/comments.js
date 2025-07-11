// 精准的楼中楼 mock 评论数据
const now = Date.now();
export const mockComments = [
  {
    id: 'c1', pid: '0', task_id: 't1', content: '任务很棒，已加入！', createdAt: now - 8 * 24 * 60 * 60 * 1000, // 8天前
    commenter_id: 'u1', commenter_name: '小明', commenter_avatar: '/static/avatar1.png', like_count: 2, is_liked: false,
    replies: [
      {
        id: 'c2', pid: 'c1', task_id: 't1', content: '谢谢支持！', createdAt: now - 7 * 24 * 60 * 60 * 1000, // 7天前
        commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_name: '小明', like_count: 1, is_liked: true,
        replies: [
          {
            id: 'c6', pid: 'c2', task_id: 't1', content: '我也来回复一下作者猫', createdAt: now - 5 * 24 * 60 * 60 * 1000, // 5天前
            commenter_id: 'u10', commenter_name: '小王', commenter_avatar: '/static/avatar10.png', target_name: '作者猫', like_count: 0, is_liked: false
          }
        ]
      },
      {
        id: 'c3', pid: 'c1', task_id: 't1', content: '我也加入了！', createdAt: now - 6 * 24 * 60 * 60 * 1000, // 6天前
        commenter_id: 'u3', commenter_name: '小红', commenter_avatar: '/static/avatar3.png', target_name: '小明', like_count: 0, is_liked: false
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
        commenter_id: 'u2', commenter_name: '作者猫', commenter_avatar: '/static/avatar2.png', target_name: '小红', like_count: 0, is_liked: false
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
        commenter_id: 'u5', commenter_name: '小刚', commenter_avatar: '/static/avatar5.png', target_name: '大壮', like_count: 1, is_liked: false,
        replies: [
          {
            id: 'c102', pid: 'c101', task_id: 't1', content: '我支持你！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2天前+2小时
            commenter_id: 'u6', commenter_name: '小雨', commenter_avatar: '/static/avatar6.png', target_name: '小刚', like_count: 0, is_liked: false
          }
        ]
      },
      {
        id: 'c103', pid: 'c100', task_id: 't1', content: '我觉得还好，大家一起加油！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000, // 2天前+3小时
        commenter_id: 'u6', commenter_name: '小雨', commenter_avatar: '/static/avatar6.png', target_name: '大壮', like_count: 0, is_liked: false,
        replies: [
          {
            id: 'c104', pid: 'c103', task_id: 't1', content: '我来围观一下，哈哈！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000, // 2天前+4小时
            commenter_id: 'u7', commenter_name: '小王', commenter_avatar: '/static/avatar7.png', target_name: '小雨', like_count: 0, is_liked: false
          },
          {
            id: 'c105', pid: 'c103', task_id: 't1', content: '有难度才有意思！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000, // 2天前+5小时
            commenter_id: 'u8', commenter_name: '小美', commenter_avatar: '/static/avatar8.png', target_name: '小雨', like_count: 0, is_liked: false
          }
        ]
      },
      {
        id: 'c106', pid: 'c100', task_id: 't1', content: '我支持你！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000, // 2天前+6小时
        commenter_id: 'u9', commenter_name: '小志', commenter_avatar: '/static/avatar9.png', target_name: '大壮', like_count: 0, is_liked: false
      },
      {
        id: 'c107', pid: 'c100', task_id: 't1', content: '加油加油！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000, // 2天前+7小时
        commenter_id: 'u10', commenter_name: '小芳', commenter_avatar: '/static/avatar10.png', target_name: '大壮', like_count: 0, is_liked: false
      },
      {
        id: 'c108', pid: 'c100', task_id: 't1', content: '我也来试试！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000, // 2天前+8小时
        commenter_id: 'u11', commenter_name: '小亮', commenter_avatar: '/static/avatar11.png', target_name: '大壮', like_count: 0, is_liked: false
      },
      {
        id: 'c109', pid: 'c100', task_id: 't1', content: '大家一起努力！', createdAt: now - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000, // 2天前+9小时
        commenter_id: 'u12', commenter_name: '小翠', commenter_avatar: '/static/avatar12.png', target_name: '大壮', like_count: 0, is_liked: false
      }
    ],
    reply_count: 8
  },
  // 测试层级关系优先的用例
  {
    id: 'c200', pid: '0', task_id: 't1', content: '测试层级关系优先', createdAt: now - 1 * 24 * 60 * 60 * 1000, // 1天前
    commenter_id: 'u1', commenter_name: '测试用户', commenter_avatar: '/static/avatar1.png', like_count: 0, is_liked: false,
    replies: [
      {
        id: 'c201', pid: 'c200', task_id: 't1', content: '这是较早的二级评论', createdAt: now - 12 * 60 * 60 * 1000, // 12小时前
        commenter_id: 'u2', commenter_name: '用户A', commenter_avatar: '/static/avatar2.png', target_name: '测试用户', like_count: 0, is_liked: false,
        replies: [
          {
            id: 'c203', pid: 'c201', task_id: 't1', content: '这是较晚的三级评论（应该跟在c201后面）', createdAt: now - 6 * 60 * 60 * 1000, // 6小时前
            commenter_id: 'u3', commenter_name: '用户B', commenter_avatar: '/static/avatar3.png', target_name: '用户A', like_count: 0, is_liked: false
          }
        ]
      },
      {
        id: 'c202', pid: 'c200', task_id: 't1', content: '这是较晚的二级评论', createdAt: now - 8 * 60 * 60 * 1000, // 8小时前
        commenter_id: 'u4', commenter_name: '用户C', commenter_avatar: '/static/avatar4.png', target_name: '测试用户', like_count: 0, is_liked: false
      }
    ],
    reply_count: 3
  },
  // 测试二级和三级评论显示格式的用例
  {
    id: 'c300', pid: '0', task_id: 't1', content: '测试二级和三级评论显示格式', createdAt: now - 30 * 60 * 60 * 1000, // 30小时前
    commenter_id: 'u1', commenter_name: '格式测试', commenter_avatar: '/static/avatar1.png', like_count: 0, is_liked: false,
    replies: [
      {
        id: 'c301', pid: 'c300', task_id: 't1', content: '这是二级评论（应该不显示回复前缀）', createdAt: now - 20 * 60 * 60 * 1000, // 20小时前
        commenter_id: 'u2', commenter_name: '用户D', commenter_avatar: '/static/avatar2.png', target_name: '格式测试', like_count: 0, is_liked: false
      },
      {
        id: 'c302', pid: 'c301', task_id: 't1', content: '这是三级评论（应该显示回复前缀）', createdAt: now - 10 * 60 * 60 * 1000, // 10小时前
        commenter_id: 'u3', commenter_name: '用户E', commenter_avatar: '/static/avatar3.png', target_name: '用户D', like_count: 0, is_liked: false
      }
    ],
    reply_count: 2
  }
];