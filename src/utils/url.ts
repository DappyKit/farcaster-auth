import { getConfigData } from '../config'
import { MAX_URL_LENGTH } from '../db/app'

/**
 * Prepares the URL.
 * @param url URL
 */
export function prepareUrl(url: string): string {
  const trimmedUrl = url.trim()
  const parsedUrl = new URL(trimmedUrl)

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Invalid URL. Only HTTPS URLs are supported')
  }

  if (trimmedUrl.length > MAX_URL_LENGTH) {
    throw new Error(`Invalid URL. URL length should be less or equal than ${MAX_URL_LENGTH}`)
  }

  return trimmedUrl
}

/**
 * Gets the public URL.
 * @param url URL
 */
export function getPublicUrl(url: string): string {
  const { publicUrl } = getConfigData()

  return new URL(url, publicUrl).toString()
}
