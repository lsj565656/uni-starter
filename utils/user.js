import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'

export async function fetchUserScore() {
  if (!store.userInfo || !store.userInfo._id) return 0
  const database = uniCloud.database()
  const res = await database
    .collection('uni-id-scores')
    .where('user_id == $env.uid')
    .orderBy('create_date', 'desc')
    .limit(1)
    .get()
  const data = res.result.data[0]
  const score = data ? data.balance : 0
  // 使用 mutations 方法确保持久化
  mutations.setUserInfo({ score })
  return score
}

export async function fetchUserScoreAndCache(userId) {
  if (!userId) return 0
  const database = uniCloud.database()
  const res = await database
    .collection('uni-id-scores')
    .where(`user_id == "${userId}"`)
    .orderBy('create_date', 'desc')
    .limit(1)
    .get()
  const data = res.result.data[0]
  const score = data ? data.balance : 0
  // 使用 mutations 方法确保持久化
  mutations.setUserInfo({ score })
  return score
}
