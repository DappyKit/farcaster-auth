import { ICreateRequest } from '../interface/ICreateRequest'
import { getInteractorInfo } from '../../../../utils/farcaster'
import { validateFrameUrl } from '../../../../utils/frame'
import { isWithinMaxMinutes } from '../../../../utils/time'
import { prepareEthAddress } from '../../../../utils/eth'
import { prepareUrl } from '../../../../utils/url'
import { ISigner } from '../../../../service/delegated-fs/interfaces'
import { postJsonData } from '../../../../utils/http'

export const MAX_REQUESTS_TIME_MINUTES = 10

export interface IAppCreateData {
  /**
   * Frame URL
   */
  frameUrl: string
  /**
   * Frame callback URL to receive info about authorization
   */
  frameCallbackUrl: string
  /**
   * Signer address of the Frame service
   */
  signerAddress: string
  /**
   * Frame owner FID
   */
  frameOwnerFid: number
  /**
   * Username of the Frame owner
   */
  username: string
  /**
   * Display name of the Frame owner
   */
  displayName: string
  /**
   * Profile image of the Frame owner
   */
  profileImage: string
}

export async function getAppCreateData(
  neynarApiKey: string,
  authorizedFrameUrl: string,
  data: ICreateRequest,
): Promise<IAppCreateData> {
  const { frameUrlBytes, frameCallbackUrlBytes, frameSignerAddressBytes } = data

  if (!frameUrlBytes) {
    throw new Error('Invalid request. "frameUrlBytes" is required')
  }

  if (!frameCallbackUrlBytes) {
    throw new Error('Invalid request. "frameCallbackUrlBytes" is required')
  }

  if (!frameSignerAddressBytes) {
    throw new Error('Invalid request. "frameSignerAddressBytes" is required')
  }

  const items = [frameUrlBytes, frameCallbackUrlBytes, frameSignerAddressBytes]
  const interactorResponses = []
  for (const item of items) {
    interactorResponses.push(await getInteractorInfo(neynarApiKey, item))
  }

  const frameUrlData = interactorResponses[0]
  const frameCallbackData = interactorResponses[1]
  const frameSignerAddressData = interactorResponses[2]

  interactorResponses.forEach((response, index) => {
    if (!response.isValid) {
      throw new Error(`Interactor data is not correct. Item under "${index}" is not valid`)
    }

    if (!response.url) {
      throw new Error(`Interactor data is not correct. Item under "${index}" should have a URL`)
    }

    if (response.url !== authorizedFrameUrl) {
      throw new Error(
        `Interactor data is not correct. Item under "${index}" should have a URL equal to the authorized Frame URL`,
      )
    }

    if (!response.timestamp) {
      throw new Error(`Interactor data is not correct. Item under "${index}" should have a timestamp`)
    }

    if (!isWithinMaxMinutes(response.timestamp, MAX_REQUESTS_TIME_MINUTES)) {
      throw new Error(
        `Interactor data is not correct. Item under "${index}" has an outdated timestamp. Max ${MAX_REQUESTS_TIME_MINUTES} minutes allowed`,
      )
    }
  })

  if (new Set(interactorResponses.map(response => response.fid)).size > 1) {
    throw new Error('Invalid request. All interactor data should belong to the same user')
  }

  if (new Set(interactorResponses.map(response => response.url)).size > 1) {
    throw new Error('Invalid request. All interactor data should belong to the same Frame')
  }

  const signerAddress = prepareEthAddress(frameSignerAddressData.inputValue)
  const frameUrl = prepareUrl(frameUrlData.inputValue)
  const frameCallbackUrl = prepareUrl(frameCallbackData.inputValue)

  try {
    await validateFrameUrl(frameUrl, frameUrlData.fid)
  } catch (e) {
    throw new Error(`Validation frame error: ${(e as Error).message}`)
  }

  return {
    frameUrl,
    frameCallbackUrl,
    frameOwnerFid: frameUrlData.fid,
    username: frameUrlData.username,
    displayName: frameUrlData.display_name,
    profileImage: frameUrlData.pfp_url,
    signerAddress,
  }
}

/**
 * Exports the frame to Clickcaster.
 * @param clickcasterExportUrl Clickcaster export URL
 * @param fid Frame owner FID
 * @param frameUrl Frame URL
 * @param signerAddress Signer address
 * @param signer Signer
 */
export async function exportFrameToClickcaster(
  clickcasterExportUrl: string,
  fid: number,
  frameUrl: string,
  signerAddress: string,
  signer: ISigner,
): Promise<Response> {
  const signature = await signer.signMessage(`${fid.toString()}${frameUrl}${prepareEthAddress(signerAddress)}`)

  return postJsonData(clickcasterExportUrl, {
    fid,
    frameUrl,
    signerAddress,
    signature,
  })
}
