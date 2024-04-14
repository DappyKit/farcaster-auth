import { ICreateAuthRequest } from '../interface/ICreateAuthRequest'
import { getInteractorInfo } from '../../../../utils/farcaster'
import { isWithinMaxMinutes } from '../../../../utils/time'
import { MAX_REQUESTS_TIME_MINUTES } from '../../app/utils/app-create-utils'
import { getAppByUrl } from '../../../../db/app'

export interface IRequestCreateData {
  fid: number
  appFid: number
}

export async function getRequestCreateData(
  neynarApiKey: string,
  data: ICreateAuthRequest,
): Promise<IRequestCreateData> {
  const { messageBytesProof } = data

  if (!messageBytesProof) {
    throw new Error('"messageBytesProof" is required')
  }

  const proofData = await getInteractorInfo(neynarApiKey, messageBytesProof)

  if (!proofData.isValid) {
    throw new Error('"frameUrlBytes" is invalid')
  }

  if (!proofData.url) {
    throw new Error('Url of the interacted Frame should be defined')
  }

  const appData = await getAppByUrl(proofData.url)

  if (!appData) {
    throw new Error(`App not found by the provided url "${proofData.url}"`)
  }

  if (!isWithinMaxMinutes(proofData.timestamp, MAX_REQUESTS_TIME_MINUTES)) {
    throw new Error(`Timestamp is outdated. Max ${MAX_REQUESTS_TIME_MINUTES} minutes allowed`)
  }

  return {
    fid: proofData.fid,
    appFid: appData.fid,
  }
}
