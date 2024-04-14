import { ethers, isHexString } from 'ethers'
import { Bytes, is0xHexString } from './bytes'

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
