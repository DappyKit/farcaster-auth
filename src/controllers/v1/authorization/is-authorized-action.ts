import { Request, Response, NextFunction } from 'express'
import { getRequestIsAuthorizedData } from './utils/request-create-utils'
import { findSuccessfulRequest } from '../../../db/authorization-request'
import { IIsAuthorizedRequest } from './interface/IIsAuthorizedRequest'
import { IIsAuthorizedResponse } from './interface/IIsAuthorizedResponse'

export default async (
  req: Request<IIsAuthorizedRequest>,
  res: Response<IIsAuthorizedResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fid, appSignerAddress } = getRequestIsAuthorizedData(req.body)
    const isAuthorized = Boolean(await findSuccessfulRequest(fid, appSignerAddress))

    res.json({
      status: isAuthorized ? 'ok' : 'not-authorized',
      isAuthorized,
    })
  } catch (e) {
    next(e)
  }
}
