import { Request, Response, NextFunction } from 'express'
import { IGetProofResponse } from './interface/IGetProofResponse'
import { getGetProofParams } from './utils/get-proof'
import { findSuccessfulRequestByAddresses } from '../../../db/authorization-request'

/**
 * Get proof action
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export default async (req: Request, res: Response<IGetProofResponse>, next: NextFunction): Promise<void> => {
  try {
    const { userAddress, applicationAddress } = getGetProofParams(req)
    const authorizationRequest = await findSuccessfulRequestByAddresses(userAddress, applicationAddress)

    if (!authorizationRequest) {
      throw new Error('Successful authorization request not found')
    }

    if (!authorizationRequest.proof_signature) {
      throw new Error('Auth proof signature not found')
    }

    res.json({
      status: 'ok',
      userMainAddress: authorizationRequest.user_main_address,
      userDelegatedAddress: authorizationRequest.user_delegated_address,
      applicationAddress,
      authServiceProof: authorizationRequest.proof_signature,
      serviceProof: authorizationRequest.service_signature,
    })
  } catch (e) {
    next(e)
  }
}
