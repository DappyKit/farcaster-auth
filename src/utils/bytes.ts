import { isHexString } from 'ethers'

export interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length
}

/**
 * Checks if the given value is a valid hex string with 0x prefix.
 * @param s Value to check
 * @param len Expected length of the hex string
 */
export function is0xHexString(s: unknown, len?: number): s is string {
  if (typeof s !== 'string') {
    return false
  }

  return isHexString(s, len)
}
