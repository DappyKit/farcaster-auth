import { ethers } from 'ethers'
import { Bytes, is0xHexString } from './bytes'
import { isHexString } from '../utils'

export type EthAddress = Bytes<20>
export const ETH_ADDR_HEX_LENGTH = 40
export const ETH_ADDR_0X_HEX_LENGTH = 42
export const ETH_SIGNATURE_0X_HEX_LENGTH = 132

/**
 * Checks if the given value is a valid Ethereum address without 0x.
 * @param value Value to check
 */
export function isEthAddress(value: unknown): value is EthAddress {
  return isHexString(value) && value.length === ETH_ADDR_HEX_LENGTH
}

/**
 * Checks if the given value is a valid Ethereum address with 0x prefix.
 * @param value Value to check
 */
export function is0xEthAddress(value: unknown): value is string {
  return is0xHexString(value) && value.length === ETH_ADDR_0X_HEX_LENGTH
}

/**
 * Checks if the given value is a valid Ethereum signature with 0x prefix.
 * @param value Value to check
 */
export function is0xEthSignature(value: unknown): value is string {
  return is0xHexString(value) && value.length === ETH_SIGNATURE_0X_HEX_LENGTH
}

/**
 * Gets the hash of the given data.
 * @param data Data to hash
 */
export function getBytes32Hash(data: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(data))
}

/**
 * Prepares the Ethereum address by removing the 0x prefix and converting it to lowercase.
 * @param address Ethereum address
 */
export function prepareEthAddress(address: string): string {
  if (is0xEthAddress(address)) {
    address = address.replace(/^0x/, '')
  }

  return address.toLowerCase()
}

/**
 * Prepares the Ethereum signature by removing the 0x prefix.
 * @param signature Ethereum signature
 */
export function prepareEthSignature(signature: string): string {
  if (is0xEthSignature(signature)) {
    signature = signature.replace(/^0x/, '')
  }

  return signature
}

/**
 * Checks if the value is any Ethereum address.
 * @param value Value to check
 */
export function isAnyEthAddress(value: unknown): value is string {
  return is0xEthAddress(value) || isEthAddress(value)
}
