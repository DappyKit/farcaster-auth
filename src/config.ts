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

  /**
   * Private key for signing delegated addresses
   */
  signer: string

  /**
   * Pinata JWT key
   */
  pinataJWT: string

  /**
   * IPFS URL
   */
  ipfsUrl: string

  /**
   * Clickcaster export URL
   */
  clickcasterExportUrl: string
}

/**
 * Config data
 */
let configData: IConfigData = {
  neynarApiKey: '',
  publicUrl: '',
  authorizedFrameUrl: '',
  signer: '',
  pinataJWT: '',
  ipfsUrl: '',
  clickcasterExportUrl: '',
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

  if (!process.env.AUTHORIZED_FRAME_URL) {
    throw new Error('AUTHORIZED_FRAME_URL env variable not set')
  }

  if (!process.env.SIGNER) {
    throw new Error('SIGNER env variable not set')
  }

  if (!process.env.PINATA_JWT) {
    throw new Error('PINATA_JWT env variable not set')
  }

  if (!process.env.IPFS_URL) {
    throw new Error('IPFS_URL env variable not set')
  }

  if (!process.env.CLICKCASTER_EXPORT_URL) {
    throw new Error('CLICKCASTER_EXPORT_URL env variable not set')
  }

  configData.neynarApiKey = process.env.NEYNAR_API_KEY
  configData.publicUrl = process.env.PUBLIC_URL
  configData.authorizedFrameUrl = process.env.AUTHORIZED_FRAME_URL
  configData.signer = process.env.SIGNER
  configData.pinataJWT = process.env.PINATA_JWT
  configData.ipfsUrl = process.env.IPFS_URL
  configData.clickcasterExportUrl = process.env.CLICKCASTER_EXPORT_URL
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
