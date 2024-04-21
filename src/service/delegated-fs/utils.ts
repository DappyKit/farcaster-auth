import { IStoredData, IUserAppHashes } from './interfaces'

/**
 * Asserts that the data is a valid user app hashes.
 * @param data Data to check
 */
export function assertIsUserAppHashes(data: unknown): asserts data is IUserAppHashes {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data is not an object.')
  }

  const entries = Object.entries(data as Record<string, unknown>)
  for (const [key, value] of entries) {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Data at key '${key}' is not an object.`)
    }

    const nestedEntries = Object.entries(value)
    for (const [nestedKey, nestedValue] of nestedEntries) {
      if (typeof nestedValue !== 'string') {
        throw new Error(`Value at key '${key}.${nestedKey}' is not a string.`)
      }
    }
  }
}

/**
 * Asserts that the data is a valid stored data.
 * @param data Data to check
 */
export function assertIsStoredData(data: unknown): asserts data is IStoredData {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data is not an object.')
  }

  if (typeof (data as IStoredData).data !== 'string') {
    throw new Error('Data.data is not a string.')
  }

  if (typeof (data as IStoredData).proof !== 'object' || (data as IStoredData).proof === null) {
    throw new Error('Data.proof is not an object.')
  }

  const proof = (data as IStoredData).proof

  if (typeof proof.nonce !== 'number') {
    throw new Error('Proof.nonce is not a number.')
  }

  if (typeof proof.applicationAddress !== 'string') {
    throw new Error('Proof.applicationAddress is not a string.')
  }

  if (typeof proof.authServiceProof !== 'string') {
    throw new Error('Proof.authServiceProof is not a string.')
  }

  if (typeof proof.applicationDelegateDataSignature !== 'string') {
    throw new Error('Proof.applicationDelegateDataSignature is not a string.')
  }
}
