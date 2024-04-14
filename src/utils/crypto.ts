import { verifyMessage } from 'ethers'

/**
 * Signature length
 */
export const SIGNATURE_LENGTH = 132

/**
 * Extract the address of the log provider
 * @param data Data with the click info
 * @param signature Signature of the data provider
 */
export function extractLogProvider(data: string, signature: string): string {
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
