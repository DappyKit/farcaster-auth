import { getConfigData } from '../config'

/**
 * Gets the public URL.
 * @param url URL
 */
export function getPublicUrl(url: string): string {
  const { publicUrl } = getConfigData()

  return new URL(url, publicUrl).toString()
}
