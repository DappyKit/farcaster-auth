import { Request, Response, NextFunction } from 'express'
import { getConfigData } from '../../../config'
import { getRequestListData } from './utils/request-create-utils'
import { IListRequest } from './interface/IListRequest'
import { getActiveAuthorizationRequestByUser, getChallengeOptions } from '../../../db/authorization-request'
import { IListResponse } from './interface/IListResponse'

export default async (req: Request<IListRequest>, res: Response<IListResponse>, next: NextFunction): Promise<void> => {
  try {
    const { neynarApiKey, authorizedFrameUrl } = getConfigData()
    const { fid } = await getRequestListData(neynarApiKey, authorizedFrameUrl, req.body)
    const authRequest = await getActiveAuthorizationRequestByUser(fid)

    if (!authRequest) {
      throw new Error('No active authorization request found')
    }

    res.json({
      status: 'ok',
      requestId: authRequest.id,
      options: getChallengeOptions(authRequest.challenge),
    })
  } catch (e) {
    next(e)
  }
}
