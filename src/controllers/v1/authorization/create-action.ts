import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import { ICreateResponse } from './interface/ICreateResponse'
import {
  AuthorizationRequestStatus,
  createChallenge,
  insertAuthorizationRequest,
  rejectAllPendingAuthorizationRequests,
} from '../../../db/authorization-request'
import { ICreateAuthRequest } from './interface/ICreateAuthRequest'
import { getRequestCreateData } from './utils/request-create-utils'

/**
 * Creates an authorization request. Called from the 3rd party Frame's service.
 * It creates a challenge and inserts the info about user's delegated signer created by the service into the database.
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export default async (
  req: Request<ICreateAuthRequest>,
  res: Response<ICreateResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey } = getConfigData()
    const { fid, appSignerAddress, userDelegatedAddress, serviceSignature, userMainAddress } =
      await getRequestCreateData(neynarApiKey, req.body)

    await rejectAllPendingAuthorizationRequests(fid, appSignerAddress)
    const challenge = createChallenge()
    const requestId = await insertAuthorizationRequest({
      app_signer_address: appSignerAddress,
      user_fid: fid,
      status: AuthorizationRequestStatus.PENDING,
      challenge: challenge.serialized,
      user_main_address: userMainAddress,
      user_delegated_address: userDelegatedAddress,
      service_signature: serviceSignature,
    })

    res.json({
      status: 'ok',
      answer: challenge.answer,
      requestId,
    })
  } catch (e) {
    next(e)
  }
}
