import { db } from './index'

export const TABLE_NAME = 'app'

export const MAX_URL_LENGTH = 255

export interface IApp {
  fid: number
  frame_url: string
  callback_url: string
  signer_address: string
  data?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

/**
 * Gets all apps.
 */
export async function getAllApps(): Promise<IApp[]> {
  return db(TABLE_NAME).select('*')
}

export async function upsertApp(userData: Omit<IApp, 'created_at' | 'updated_at'>): Promise<void> {
  const date = db.fn.now()
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

export async function getAppBySignerAddress(signerAddress: string): Promise<IApp | null> {
  const result = await db(TABLE_NAME).where('signer_address', signerAddress).first()

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
