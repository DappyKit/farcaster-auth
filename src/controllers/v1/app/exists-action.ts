import { Request, Response, NextFunction } from 'express'
import { getAppBySignerAddress } from '../../../db/app'
import { is0xEthAddress, isEthAddress, prepareEthAddress } from '../../../utils/eth'
import { IExistsResponse } from './interface/IExistsResponse'

export function getAppExistsParams(req: Request): { applicationAddress: string } {
  const { applicationAddress } = req.query

  if (!applicationAddress) {
    throw new Error('"applicationAddress" is required')
  }

  if (!is0xEthAddress(applicationAddress) && !isEthAddress(applicationAddress)) {
    throw new Error('Invalid "applicationAddress"')
  }

  return { applicationAddress: prepareEthAddress(applicationAddress as string) }
}

/**
 * Checks if the app with the address already exists.
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export default async (req: Request, res: Response<IExistsResponse>, next: NextFunction): Promise<void> => {
  try {
    const { applicationAddress } = getAppExistsParams(req)

    const isExists = Boolean(await getAppBySignerAddress(applicationAddress))

    res.json({
      status: 'ok',
      isExists,
    })
  } catch (e) {
    next(e)
  }
}
