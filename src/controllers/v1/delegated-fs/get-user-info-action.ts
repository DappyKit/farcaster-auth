import { Request, Response, NextFunction } from 'express'
import { delegatedFs } from '../../../delegated-fs'
import { IUserInfo } from './interface/IUserInfo'
import { getUserAppParams } from './utils/get'

export default async (req: Request, res: Response<IUserInfo>, next: NextFunction): Promise<void> => {
  try {
    const { userAddress, applicationAddress } = getUserAppParams(req)

    res.json({
      nonce: await delegatedFs.getUserAppNonce(userAddress, applicationAddress),
    })
  } catch (e) {
    next(e)
  }
}
