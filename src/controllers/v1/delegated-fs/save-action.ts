import { Request, Response, NextFunction } from 'express'
import { getSaveActionData } from './utils/save'
import { delegatedFs } from '../../../delegated-fs'
import { IGeneralResponse } from '../authorization/interface/IGeneralResponse'
import { ILightFsSaveRequest } from './interface/ILightFsSaveRequest'

export default async (
  req: Request<ILightFsSaveRequest>,
  res: Response<IGeneralResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userAddress, data, proof } = await getSaveActionData(req.body)
    await delegatedFs.setUserAppData(userAddress, data, proof)
    res.json({
      status: 'ok',
    })
  } catch (e) {
    next(e)
  }
}
