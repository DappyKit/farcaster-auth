import { isAnyEthAddress, prepareEthAddress } from '../../../../utils/eth'
import { Request } from 'express'

/**
 * Get user address with 0x and application address with 0x from request query.
 * @param req Request object.
 */
export function getUserAppParams(req: Request): { userAddress: string; applicationAddress: string } {
  const { userAddress, applicationAddress } = req.query

  if (!userAddress) {
    throw new Error('"userAddress" is required')
  }

  if (!isAnyEthAddress(userAddress)) {
    throw new Error('Invalid "userAddress"')
  }

  if (!applicationAddress) {
    throw new Error('"applicationAddress" is required')
  }

  if (!isAnyEthAddress(applicationAddress)) {
    throw new Error('Invalid "applicationAddress"')
  }

  return { userAddress: prepareEthAddress(userAddress), applicationAddress: prepareEthAddress(applicationAddress) }
}
