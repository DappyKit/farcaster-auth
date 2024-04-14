import path from 'path'

/**
 * Checks if the value is a string
 *
 * @param value Value to check
 */
export function isString(value: unknown): boolean {
  return typeof value === 'string'
}

/**
 * Asserts that the data is a string
 *
 * @param data Data to check
 */
export function assertString(data: unknown): asserts data is string {
  if (!isString(data)) {
    throw new Error('Data is not a string')
  }
}

/**
 * Asserts that the data length is equal to the specified length
 *
 * @param data Data to check
 * @param length Length to check
 */
export function assertStringLength(data: unknown, length: number): asserts data is string {
  assertString(data)

  if (data.length !== length) {
    throw new Error(`Data length is not equal to ${length}`)
  }
}

/**
 * Checks if the value is a hex string
 *
 * @param value Value to check
 */
export function isHexString(value: string): boolean {
  const hexRegEx = /^[0-9A-Fa-f]*$/

  return hexRegEx.test(value)
}

/**
 * Asserts that the data is a hex string
 *
 * @param data Data to check
 */
export function assertHex(data: unknown): asserts data is string {
  assertString(data)

  if (!isHexString(data)) {
    throw new Error('Data is not a hex string')
  }
}

/**
 * Gets path parts
 *
 * @param path Path to get parts from
 */
export function getPathParts(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/**
 * Checks if the data is an object
 *
 * @param data Data to check
 */
export function isObject(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && !Array.isArray(data) && data !== null
}

/**
 * Asserts that the data is an object
 *
 * @param data Data to check
 * @param customError Custom error message
 */
export function assertObject(data: unknown, customError?: string): asserts data is Record<string, unknown> {
  if (!isObject(data)) {
    throw new Error(customError ? customError : 'Data is not an object')
  }
}

/**
 * Bytes to string
 *
 * @param data Bytes to convert
 */
export function bytesToString(data: Uint8Array): string {
  const decoder = new TextDecoder()

  return decoder.decode(data)
}

/**
 * Asserts that the data is a JSON string
 *
 * @param data Data to check
 */
export function assertJson(data: unknown): asserts data is string {
  if (typeof data !== 'string') {
    throw new Error('JSON assert: data is not a string')
  }

  try {
    JSON.parse(data)
  } catch (e) {
    throw new Error(`JSON assert: data is not a valid JSON: ${(e as Error).message}`)
  }
}

/**
 * Converts relative path to absolute
 *
 * @param paths Paths to convert
 */
export function toAbsolutePath(...paths: string[]): string {
  return path.resolve(...paths)
}

/**
 * Delays the execution
 *
 * @param ms Delay in milliseconds
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Converts base64 string to uppercase hex string
 */
export function base64ToHex(base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex').toUpperCase()
}
