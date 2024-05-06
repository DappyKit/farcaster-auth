import { ILightFsSaveRequest } from '../interface/ILightFsSaveRequest'

export async function getSaveActionData(requestData: ILightFsSaveRequest): Promise<ILightFsSaveRequest> {
  const { userAddress, data } = requestData
  const { nonce, applicationAddress, authServiceProof, applicationDelegateDataSignature } = requestData.proof

  if (!userAddress) {
    throw new Error('"userAddress" is required')
  }

  if (!data) {
    throw new Error('"data" is required')
  }

  if (Number.isNaN(nonce)) {
    throw new Error('"nonce" is required')
  }

  if (!applicationAddress) {
    throw new Error('"applicationAddress" is required')
  }

  if (!authServiceProof) {
    throw new Error('"authServiceProof" is required')
  }

  if (!applicationDelegateDataSignature) {
    throw new Error('"applicationDelegateDataSignature" is required')
  }

  return requestData
}
