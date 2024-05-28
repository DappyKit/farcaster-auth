import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import { IAnswerRequest } from './interface/IAnswerRequest'
import { IAnswerResponse } from './interface/IAnswerResponse'
import {
  AuthorizationRequestStatus,
  findAncCheckChallenge,
  setProofSignature,
  updateAuthorizationRequestStatus,
} from '../../../db/authorization-request'
import { getRequestAnswerData } from './utils/request-create-utils'
import { callbackFrameUrl, ICallbackFailRequest, ICallbackSuccessRequest } from '../../../utils/http'
import { DelegatedFs } from '../../../service/delegated-fs/delegated-fs'
import { Wallet } from 'ethers'
import { INVALID_CHALLENGE_ANSWER } from './utils/error-message'

/**
 * Handles the answer of the user's answer to the challenge. Called from trusted Frame's service.
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export default async (
  req: Request<IAnswerRequest>,
  res: Response<IAnswerResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey, signer, authorizedFrameUrl } = getConfigData()
    const { requestId, answer, authRequest, app } = await getRequestAnswerData(
      neynarApiKey,
      authorizedFrameUrl,
      req.body,
    )

    if (await findAncCheckChallenge(requestId, answer)) {
      await updateAuthorizationRequestStatus(requestId, AuthorizationRequestStatus.ACCEPTED)
    } else {
      await updateAuthorizationRequestStatus(requestId, AuthorizationRequestStatus.INCORRECT)
      const proof = await DelegatedFs.createDelegateSignature(
        authRequest.user_main_address,
        authRequest.user_delegated_address,
        authRequest.app_signer_address,
        new Wallet(signer),
        INVALID_CHALLENGE_ANSWER,
      )
      const data: ICallbackFailRequest = {
        success: false,
        requestId,
        userMainAddress: authRequest.user_main_address,
        userDelegatedAddress: authRequest.user_delegated_address,
        applicationAddress: authRequest.app_signer_address,
        errorMessage: INVALID_CHALLENGE_ANSWER,
        proof,
      }

      await callbackFrameUrl(app.callback_url, data)
      throw new Error(INVALID_CHALLENGE_ANSWER)
    }

    const proof = await DelegatedFs.createDelegateSignature(
      authRequest.user_main_address,
      authRequest.user_delegated_address,
      authRequest.app_signer_address,
      new Wallet(signer),
    )
    await setProofSignature(authRequest.id, proof)
    const data: ICallbackSuccessRequest = {
      success: true,
      requestId,
      userMainAddress: authRequest.user_main_address,
      userDelegatedAddress: authRequest.user_delegated_address,
      applicationAddress: authRequest.app_signer_address,
      proof,
    }
    await callbackFrameUrl(app.callback_url, data)

    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
