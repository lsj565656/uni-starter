import { store } from '@/uni_modules/uni-id-pages/common/store.js'

export async function fetchUserScore() {
  if (!store.userInfo || !store.userInfo._id) return 0
  const db = uniCloud.database()
  const res = await db.collection('uni-id-scores')
    .where('user_id == $env.uid')
    .orderBy('create_date', 'desc')
    .limit(1)
    .get()
  const data = res.result.data[0]
  const score = data ? data.balance : 0
  store.userInfo.score = score
  return score
} 