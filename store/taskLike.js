import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * useTaskLikeStore
 * 全局管理任务点赞状态的 pinia store。
 *
 * likeMap 只存当前“我喜欢的”任务（即 isLiked 为 true 的任务）。
 * 取消喜欢后会 removeLike，从 likeMap 移除。
 *
 * 数据结构：
 * likeMap = {
 *   [taskId]: {
 *     isLiked: Boolean,      // 是否已点赞（一般恒为 true，取消点赞会 remove）
 *     likeCount: Number,     // 当前点赞数
 *     taskData: Object       // 任务主数据快照（可用于渲染）
 *   },
 *   ...
 * }
 */
export const useTaskLikeStore = defineStore('taskLike', () => {
  // 任务点赞状态映射：{ [taskId]: { isLiked, likeCount, taskData } }
  const likeMap = ref({})

  /**
   * setLike
   * 设置某个任务为已点赞（或更新点赞数/数据）。
   * @param {String} taskId - 任务ID，必填
   * @param {Boolean} isLiked - 是否已点赞，必填（一般为 true）
   * @param {Number} likeCount - 点赞数，必填
   * @param {Object} taskData - 任务主数据快照，必填
   */
  function setLike(taskId, isLiked, likeCount, taskData) {
    likeMap.value[taskId] = { isLiked, likeCount, taskData }
  }

  /**
   * removeLike
   * 取消某个任务的点赞（从 likeMap 移除）。
   * @param {String} taskId - 任务ID，必填
   */
  function removeLike(taskId) {
    delete likeMap.value[taskId]
  }

  /**
   * getLike
   * 获取某个任务的点赞信息。
   * @param {String} taskId - 任务ID，必填
   * @returns {Object|undefined} - 点赞信息对象或 undefined
   */
  function getLike(taskId) {
    return likeMap.value[taskId]
  }

  /**
   * getAllLikes
   * 获取所有已点赞任务的映射对象。
   * @returns {Object} - likeMap
   */
  function getAllLikes() {
    return likeMap.value
  }

  return { likeMap, setLike, removeLike, getLike, getAllLikes }
}) 