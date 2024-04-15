import { CastParamType, NeynarAPIClient } from '@neynar/nodejs-sdk'
import { CastResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster'

export interface ICastInfo {
  castId: string
  initiatorFid: number
  fid: number
  username: string
}

export interface InteractorInfo {
  isValid: boolean
  fid: number
  username: string
  display_name: string
  pfp_url: string
  inputValue: string
  url: string
  timestamp: string
}

export async function getInteractorInfo(neynarApiKey: string, clickData: string): Promise<InteractorInfo> {
  const neynarClient = new NeynarAPIClient(neynarApiKey)
  const result = await neynarClient.validateFrameAction(clickData)

  if (result.valid) {
    const { fid, username, display_name, pfp_url } = result.action.interactor
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
    }
  } else {
    throw new Error('Click data is not valid')
  }
}
