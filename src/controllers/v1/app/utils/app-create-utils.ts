import { ICreateRequest } from '../interface/ICreateRequest'
import { getInteractorInfo } from '../../../../utils/farcaster'
import { validateFrameUrl } from '../../../../utils/frame'
import { isWithinMaxMinutes } from '../../../../utils/time'

export const MAX_REQUESTS_TIME_MINUTES = 10

export interface IAppCreateData {
  frameUrl: string
  frameCallbackUrl: string
  frameOwnerFid: number
  username: string
  displayName: string
  profileImage: string
}

export async function getAppCreateData(
  neynarApiKey: string,
  authorizedFrameUrl: string,
  data: ICreateRequest,
): Promise<IAppCreateData> {
  const { frameUrlBytes, frameCallbackUrlBytes } = data

  if (!frameUrlBytes) {
    throw new Error('Invalid request. "frameUrlBytes" is required')
  }

  if (!frameCallbackUrlBytes) {
    throw new Error('Invalid request. "frameCallbackBytes" is required')
  }

  const frameUrlData = await getInteractorInfo(neynarApiKey, frameUrlBytes)

  if (!frameUrlData.isValid) {
    throw new Error('Invalid request. "frameUrlBytes" is invalid')
  }

  const frameCallbackData = await getInteractorInfo(neynarApiKey, frameCallbackUrlBytes)

  if (!frameCallbackData.isValid) {
    throw new Error('Invalid request. "frameCallbackBytes" is invalid')
  }

  if (frameUrlData.fid !== frameCallbackData.fid) {
    throw new Error('Invalid request. "frameUrlBytes" and "frameCallbackBytes" should belong to the same user')
  }

  if (!frameUrlData.url) {
    throw new Error('Invalid request. Url of the interacted Frame should be defined')
  }

  if (frameUrlData.url !== frameCallbackData.url) {
    throw new Error('Invalid request. "frameUrlBytes" and "frameCallbackBytes" should belong to the same Frame')
  }

  if (frameUrlData.url !== authorizedFrameUrl) {
    throw new Error('Invalid request. "frameUrlBytes" should belong to the authorized Frame')
  }

  if (!frameUrlData.timestamp || !frameCallbackData.timestamp) {
    throw new Error('Invalid request. Timestamp should be defined')
  }

  if (!isWithinMaxMinutes(frameUrlData.timestamp, MAX_REQUESTS_TIME_MINUTES)) {
    throw new Error(`Invalid request. Timestamp is outdated. Max ${MAX_REQUESTS_TIME_MINUTES} minutes allowed`)
  }

  try {
    await validateFrameUrl(frameUrlData.inputValue, frameUrlData.fid)
  } catch (e) {
    throw new Error(`Validation frame error: ${(e as Error).message}`)
  }

  return {
    frameUrl: frameUrlData.inputValue,
    frameCallbackUrl: frameCallbackData.inputValue,
    frameOwnerFid: frameUrlData.fid,
    username: frameUrlData.username,
    displayName: frameUrlData.display_name,
    profileImage: frameUrlData.pfp_url,
  }
}
