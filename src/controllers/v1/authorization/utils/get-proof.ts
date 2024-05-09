import { IGetProofRequest } from '../interface/IGetProofRequest'
import { Request } from 'express'
import { is0xEthAddress, prepareEthAddress } from '../../../../utils/eth'

export function getGetProofParams(req: Request): IGetProofRequest {
  const { userAddress, applicationAddress } = req.query

  if (!is0xEthAddress(userAddress)) {
    throw new Error('Invalid "userAddress"')
  }

  if (!is0xEthAddress(applicationAddress)) {
    throw new Error('Invalid "applicationAddress"')
  }

  return {
    userAddress: prepareEthAddress(userAddress),
    applicationAddress: prepareEthAddress(applicationAddress),
  }
}
