import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import { ICreateResponse } from './interface/ICreateResponse'
import {
  AuthorizationRequestStatus,
  createChallenge,
  insertAuthorizationRequest,
} from '../../../db/authorizationRequest'
import { ICreateAuthRequest } from './interface/ICreateAuthRequest'
import { getRequestCreateData } from './utils/request-create-utils'

export default async (
  req: Request<ICreateAuthRequest>,
  res: Response<ICreateResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { neynarApiKey } = getConfigData()
    const { fid, appFid } = await getRequestCreateData(neynarApiKey, req.body)

    await insertAuthorizationRequest({
      app_fid: appFid,
      user_fid: fid,
      status: AuthorizationRequestStatus.PENDING,
      challenge: createChallenge(),
    })

    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
