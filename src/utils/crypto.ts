import { verifyMessage, Wallet } from 'ethers'
import { prepareEthAddress, prepareEthSignature } from './eth'

/**
 * Signature length
 */
export const SIGNATURE_LENGTH = 132
export const SIGNATURE_LENGTH_WITHOUT_0x = 130

/**
 * Extract the signer address from the data and signature
 * @param data Data to extract the signer address from
 * @param signature Signature to extract the signer address from
 */
export function extractSignerAddress(data: string, signature: string): string {
  return verifyMessage(data, signature).replace('0x', '').toLowerCase()
}

/**
 * Validate the signature length
 * @param signature Signature to validate
 */
export function validateSignatureLength(signature: string): void {
  if (signature.length !== SIGNATURE_LENGTH) {
    throw new Error('Invalid signature length')
  }
}

export async function signDelegatedAddress(privateKey: string, address: string): Promise<string> {
  address = prepareEthAddress(address)
  const wallet = new Wallet(privateKey)

  return prepareEthSignature(await wallet.signMessage(address))
}
