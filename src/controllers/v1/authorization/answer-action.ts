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
import { signDelegatedAddress } from '../../../utils/crypto'
import { callbackFrameUrl, ICallbackFailRequest, ICallbackSuccessRequest } from '../../../utils/http'

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
      const errorMessage = 'Invalid answer for the challenge'
      const data: ICallbackFailRequest = {
        success: false,
        requestId,
        userSignerAddress: authRequest.user_signer_address,
        errorMessage,
      }
      await callbackFrameUrl(app.callback_url, data)
      throw new Error(errorMessage)
    }

    const proof = await signDelegatedAddress(signer, authRequest.user_signer_address)
    await setProofSignature(authRequest.id, proof)
    const data: ICallbackSuccessRequest = {
      success: true,
      requestId,
      userSignerAddress: authRequest.user_signer_address,
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
