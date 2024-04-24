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

export default async (
  req: Request<IRejectRequest>,
  res: Response<IGeneralResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey, authorizedFrameUrl } = getConfigData()
    const { fid } = await getRequestListData(neynarApiKey, authorizedFrameUrl, req.body)
    const authRequest = await getActiveAuthorizationRequestByUser(fid)

    if (!authRequest) {
      throw new Error('No active authorization request found')
    }

    if (authRequest.status !== AuthorizationRequestStatus.PENDING) {
      throw new Error('The authorization request is not pending')
    }

    await updateAuthorizationRequestStatus(authRequest.id, AuthorizationRequestStatus.REJECTED)

    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
