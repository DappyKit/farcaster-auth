export interface ICreateRequest {
  /**
   * Farcaster signed message with entered URL of a Frame
   */
  frameUrlBytes: string
  /**
   * Farcaster signed message with entered callback URL of a Frame
   */
  frameCallbackUrlBytes: string
  /**
   * Farcaster signed message with entered signer address of a Frame
   */
  frameSignerAddressBytes: string
}
