import { NeynarAPIClient } from '@neynar/nodejs-sdk'
import { prepareEthAddress } from './eth'

export interface InteractorInfo {
  isValid: boolean
  fid: number
  username: string
  display_name: string
  pfp_url: string
  inputValue: string
  url: string
  timestamp: string
  custodyAddress: string
}

export async function getInteractorInfo(neynarApiKey: string, clickData: string): Promise<InteractorInfo> {
  const neynarClient = new NeynarAPIClient(neynarApiKey)
  const result = await neynarClient.validateFrameAction(clickData)

  if (result.valid) {
    const { fid, username, display_name, pfp_url, custody_address } = result.action.interactor
    const { url, timestamp } = result.action
    const inputValue = result.action.input?.text || ''

    return {
      isValid: result.valid,
      fid,
      username,
      display_name,
      pfp_url,
      url,
      timestamp,
      inputValue,
      custodyAddress: prepareEthAddress(custody_address),
    }
  } else {
    throw new Error('Click data is not valid')
  }
}
