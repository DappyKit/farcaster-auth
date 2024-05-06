import { Request, Response, NextFunction } from 'express'
import { delegatedFs } from '../../../delegated-fs'
import { getUserAppParams } from './utils/get'

export default async (req: Request, res: Response<string>, next: NextFunction): Promise<void> => {
  try {
    const { userAddress, applicationAddress } = getUserAppParams(req)

    res.send((await delegatedFs.getUserAppData(userAddress, applicationAddress)).data)
  } catch (e) {
    next(e)
  }
}
