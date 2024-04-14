import 'dotenv/config'

/**
 * Config data interface
 */
export interface IConfigData {
  /**
   * Neynar API key
   */
  neynarApiKey: string

  /**
   * Public URL
   */
  publicUrl: string

  /**
   * Authorized frame URL
   */
  authorizedFrameUrl: string
}

/**
 * Config data
 */
let configData: IConfigData = {
  neynarApiKey: '',
  publicUrl: '',
  authorizedFrameUrl: '',
}

/**
 * Gets config data from environment variables
 */
export function loadConfig(): void {
  if (!process.env.NEYNAR_API_KEY) {
    throw new Error('NEYNAR_API_KEY env variable not set')
  }

  if (!process.env.PUBLIC_URL) {
    throw new Error('PUBLIC_URL env variable not set')
  }

  if (!process.env.PINATA_JWT) {
    throw new Error('PINATA_JWT env variable not set')
  }

  if (!process.env.APP_FID) {
    throw new Error('APP_FID env variable not set')
  }

  if (!process.env.AUTHORIZED_FRAME_URL) {
    throw new Error('AUTHORIZED_FRAME_URL env variable not set')
  }

  configData.neynarApiKey = process.env.NEYNAR_API_KEY
  configData.publicUrl = process.env.PUBLIC_URL
  configData.authorizedFrameUrl = process.env.AUTHORIZED_FRAME_URL
}

/**
 * Gets config data
 */
export function getConfigData(): IConfigData {
  return configData
}

/**
 * Sets config data
 * @param data Config data
 */
export function setConfigData(data: IConfigData): void {
  configData = data
}
