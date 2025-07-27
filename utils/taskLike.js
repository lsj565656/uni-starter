// utils/taskLike.js

/**
 * 统一处理任务点赞/取消点赞
 * @param {String} taskId 任务ID
 * @param {Boolean} isLiked 当前是否已点赞
 * @returns {Promise<{isLiked: Boolean, likeCount: Number}>}
 */
export async function toggleTaskLike(taskId, isLiked) {
  try {
    const res = await uniCloud.callFunction({
      name: 'likeTask',
      data: { task_id: taskId }
    })
    if (res.result && res.result.code === 0) {
      return {
        isLiked: res.result.data.isLiked,
        likeCount: res.result.data.likeCount
      }
    } else {
      throw new Error(res.result?.message || '操作失败')
    }
  } catch (error) {
    throw error
  }
}
