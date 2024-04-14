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

export async function getCastInfo(neynarApiKey: string, clickData: string): Promise<ICastInfo> {
  const neynarClient = new NeynarAPIClient(neynarApiKey)
  const result = await neynarClient.validateFrameAction(clickData)

  if (result.valid) {
    const cast = await neynarClient.lookUpCastByHashOrWarpcastUrl(result.action.cast.hash, CastParamType.Hash)

    return {
      castId: result.action.cast.hash,
      initiatorFid: result.action.interactor.fid,
      fid: cast.cast.author.fid,
      username: cast.cast.author.username,
    }
  } else {
    throw new Error('Click data is not valid')
  }
}

export async function getCastByUrl(neynarApiKey: string, castUrl: string): Promise<CastResponse> {
  const client = new NeynarAPIClient(neynarApiKey)

  return client.lookUpCastByHashOrWarpcastUrl(castUrl, CastParamType.Url)
}
