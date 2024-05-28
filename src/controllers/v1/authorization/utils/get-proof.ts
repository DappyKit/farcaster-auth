import { IGetProofRequest } from '../interface/IGetProofRequest'
import { Request } from 'express'
import { isAnyEthAddress, prepareEthAddress } from '../../../../utils/eth'

export function getGetProofParams(req: Request): IGetProofRequest {
  const { userAddress, applicationAddress } = req.query

  if (!isAnyEthAddress(userAddress)) {
    throw new Error('Invalid "userAddress"')
  }

  if (!isAnyEthAddress(applicationAddress)) {
    throw new Error('Invalid "applicationAddress"')
  }

  return {
    userAddress: prepareEthAddress(userAddress),
    applicationAddress: prepareEthAddress(applicationAddress),
  }
}
