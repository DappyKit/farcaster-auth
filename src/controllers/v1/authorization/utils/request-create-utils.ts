import { ICreateAuthRequest } from '../interface/ICreateAuthRequest'
import { getInteractorInfo } from '../../../../utils/farcaster'
import { isWithinMaxMinutes } from '../../../../utils/time'
import { MAX_REQUESTS_TIME_MINUTES } from '../../app/utils/app-create-utils'
import { getAppBySignerAddress, getAppByUrl, IApp } from '../../../../db/app'
import { extractSignerAddress } from '../../../../utils/crypto'
import { isAnyEthAddress, prepareEthAddress, prepareEthSignature } from '../../../../utils/eth'
import { IAnswerRequest } from '../interface/IAnswerRequest'
import {
  AuthorizationRequestStatus,
  getAuthorizationRequestByIdStatus,
  IAuthorizationRequest,
} from '../../../../db/authorization-request'
import { IIsAuthorizedRequest } from '../interface/IIsAuthorizedRequest'

export interface IRequestAnswerData {
  fid: number
  requestId: number
  answer: number
  authRequest: IAuthorizationRequest
  app: IApp
}

export interface IRequestCreateData {
  fid: number
  appSignerAddress: string
  userMainAddress: string
  userDelegatedAddress: string
  serviceSignature: string
}

export interface IRequestListData {
  fid: number
}

export async function getRequestAnswerData(
  neynarApiKey: string,
  authorizedFrameUrl: string,
  data: IAnswerRequest,
): Promise<IRequestAnswerData> {
  const { requestId, messageBytesProof, answer } = data

  if (!requestId) {
    throw new Error('"requestId" is required')
  }

  if (!messageBytesProof) {
    throw new Error('"messageBytesProof" is required')
  }

  if (!answer) {
    throw new Error('"answer" is required')
  }

  const proofData = await getInteractorInfo(neynarApiKey, messageBytesProof)

  if (!proofData.isValid) {
    throw new Error('"messageBytesProof" is invalid')
  }

  if (proofData.url !== authorizedFrameUrl) {
    throw new Error('Url of the interacted Frame does not match with the authorized url')
  }
  const authRequest = await getAuthorizationRequestByIdStatus(requestId, AuthorizationRequestStatus.PENDING)

  if (!authRequest) {
    throw new Error('Authorization request not found')
  }

  if (proofData.fid !== authRequest.user_fid) {
    throw new Error('User fid does not match with the proof data fid')
  }

  const app = await getAppBySignerAddress(authRequest.app_signer_address)

  if (!app) {
    throw new Error('App not found')
  }

  return {
    fid: authRequest.user_fid,
    requestId,
    answer,
    authRequest,
    app,
  }
}

export async function getRequestCreateData(
  neynarApiKey: string,
  data: ICreateAuthRequest,
): Promise<IRequestCreateData> {
  const { messageBytesProof, serviceSignature } = data
  let { userDelegatedAddress } = data

  if (!messageBytesProof) {
    throw new Error('"messageBytesProof" is required')
  }

  if (!userDelegatedAddress) {
    throw new Error('"userDelegatedAddress" is required')
  }

  if (!serviceSignature) {
    throw new Error('"serviceSignature" is required')
  }

  userDelegatedAddress = prepareEthAddress(userDelegatedAddress)
  const proofData = await getInteractorInfo(neynarApiKey, messageBytesProof)

  if (!proofData.isValid) {
    throw new Error('"messageBytesProof" is invalid')
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

  if (extractSignerAddress(userDelegatedAddress, serviceSignature) !== appData.signer_address) {
    throw new Error('Service signature is invalid')
  }

  return {
    fid: proofData.fid,
    appSignerAddress: appData.signer_address,
    userDelegatedAddress,
    userMainAddress: proofData.custodyAddress,
    serviceSignature: prepareEthSignature(serviceSignature),
  }
}

export async function getRequestListData(
  neynarApiKey: string,
  authorizedFrameUrl: string,
  data: ICreateAuthRequest,
): Promise<IRequestListData> {
  const { messageBytesProof } = data

  if (!messageBytesProof) {
    throw new Error('"messageBytesProof" is required')
  }

  const proofData = await getInteractorInfo(neynarApiKey, messageBytesProof)

  if (!proofData.isValid) {
    throw new Error('"messageBytesProof" is invalid')
  }

  if (!proofData.url) {
    throw new Error('Url of the interacted Frame should be defined')
  }

  if (proofData.url !== authorizedFrameUrl) {
    throw new Error('Url of the interacted Frame does not match with the authorized url')
  }

  if (!isWithinMaxMinutes(proofData.timestamp, MAX_REQUESTS_TIME_MINUTES)) {
    throw new Error(`Timestamp is outdated. Max ${MAX_REQUESTS_TIME_MINUTES} minutes allowed`)
  }

  return {
    fid: proofData.fid,
  }
}

export function getRequestIsAuthorizedData(data: IIsAuthorizedRequest): { fid: number; appSignerAddress: string } {
  const { fid, appSignerAddress } = data

  if (!fid) {
    throw new Error('"uid" is required')
  }

  if (fid <= 0) {
    throw new Error('"uid" is invalid')
  }

  if (!appSignerAddress) {
    throw new Error('"appSignerAddress" is required')
  }

  if (!isAnyEthAddress(appSignerAddress)) {
    throw new Error('"appSignerAddress" is invalid ETH address')
  }

  return {
    fid,
    appSignerAddress: prepareEthAddress(appSignerAddress),
  }
}
