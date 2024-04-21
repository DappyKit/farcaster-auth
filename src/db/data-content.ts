import { db } from './index'
import { IUserAppHashes } from '../service/delegated-fs/interfaces'

export const TABLE_NAME_CONTENT = 'data_content'

export interface IDataContent {
  user_address: string
  app_address: string
  data: string
  hash: string
  proof: string
  nonce: number
  created_at: string
  updated_at: string
}

export async function upsertDataContent(contentData: Omit<IDataContent, 'created_at' | 'updated_at'>): Promise<void> {
  const date = db.fn.now()
  const newItem = { ...contentData, updated_at: date }

  await db(TABLE_NAME_CONTENT)
    .insert({ ...newItem, created_at: date })
    .onConflict(['user_address', 'app_address'])
    .merge(newItem)
}

export async function getDataContentByUserAndApp(userAddress: string, appAddress: string): Promise<IDataContent> {
  const result = await db(TABLE_NAME_CONTENT)
    .where({
      user_address: userAddress,
      app_address: appAddress,
    })
    .first()

  if (!result) {
    throw new Error('Date Content item not found')
  }

  return result
}

export async function getAllUsersAppsHashes(): Promise<IUserAppHashes> {
  const results = await db(TABLE_NAME_CONTENT).select('user_address', 'app_address', 'hash')
  const mapping: IUserAppHashes = {}

  results.forEach(({ user_address, app_address, hash }) => {
    if (!mapping[user_address]) {
      mapping[user_address] = {}
    }
    mapping[user_address][app_address] = hash
  })

  return mapping
}

/**
 * Gets the total count of all items in the data_content table.
 * @returns {Promise<number>} The total count of items.
 */
export async function getTotalItemCount(): Promise<number> {
  const result = await db(TABLE_NAME_CONTENT).count('* as total')

  return Number(result[0].total)
}
