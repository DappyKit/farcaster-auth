import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import {
  AuthorizationRequestStatus,
  getActiveAuthorizationRequestByUser,
  updateAuthorizationRequestStatus,
} from '../../../db/authorization-request'
import { getRequestListData } from './utils/request-create-utils'
import { IGeneralResponse } from './interface/IGeneralResponse'
import { IRejectRequest } from './interface/IRejectRequest'
import { DelegatedFs } from '../../../service/delegated-fs/delegated-fs'
import { Wallet } from 'ethers'
import { USER_REJECTED_REQUEST } from './utils/error-message'
import { callbackFrameUrl, ICallbackFailRequest } from '../../../utils/http'
import { getAppBySignerAddress } from '../../../db/app'

export default async (
  req: Request<IRejectRequest>,
  res: Response<IGeneralResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey, authorizedFrameUrl, signer } = getConfigData()
    const { fid } = await getRequestListData(neynarApiKey, authorizedFrameUrl, req.body)
    const authRequest = await getActiveAuthorizationRequestByUser(fid)

    if (!authRequest) {
      throw new Error('No active authorization request found')
    }

    if (authRequest.status !== AuthorizationRequestStatus.PENDING) {
      throw new Error('The authorization request is not pending')
    }

    await updateAuthorizationRequestStatus(authRequest.id, AuthorizationRequestStatus.REJECTED)
    const proof = await DelegatedFs.createDelegateSignature(
      authRequest.user_main_address,
      authRequest.user_delegated_address,
      authRequest.app_signer_address,
      new Wallet(signer),
      USER_REJECTED_REQUEST,
    )
    const data: ICallbackFailRequest = {
      success: false,
      requestId: authRequest.id,
      userMainAddress: authRequest.user_main_address,
      userDelegatedAddress: authRequest.user_delegated_address,
      applicationAddress: authRequest.app_signer_address,
      errorMessage: USER_REJECTED_REQUEST,
      proof,
    }

    const app = await getAppBySignerAddress(authRequest.app_signer_address)

    if (!app) {
      throw new Error('App not found')
    }

    await callbackFrameUrl(app.callback_url, data)

    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
