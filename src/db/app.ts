import { db } from './index'

export const TABLE_NAME = 'app'

export interface IApp {
  fid: number
  username: string
  display_name: string
  profile_image: string
  frame_url: string
  callback_url: string
  data?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export async function upsertApp(userData: Omit<IApp, 'created_at' | 'updated_at'>): Promise<void> {
  const date = db.fn.now()
  // in the rare cases the data can be null
  userData.display_name = userData.display_name || ''
  userData.profile_image = userData.profile_image || ''
  userData.username = userData.username || ''
  const newItem = { ...userData, updated_at: date }

  await db(TABLE_NAME)
    .insert({ ...newItem, created_at: date })
    .onConflict('fid')
    .merge(newItem)
}

export async function getAppByFid(fid: number): Promise<IApp | null> {
  const result = await db(TABLE_NAME).where('fid', fid).first()

  return result || null
}

export async function getAppByUrl(frameUrl: string): Promise<IApp | null> {
  const result = await db(TABLE_NAME).where('frame_url', frameUrl).first()

  return result || null
}

export async function getAppsCount(): Promise<number> {
  const result = await db(TABLE_NAME).count({ count: '*' }).first()

  return Number(result?.count) || 0
}
