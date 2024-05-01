export interface IIsAuthorizedRequest {
  /**
   * Farcaster ID of the user
   */
  fid: number
  /**
   * Address of the application signer. With 0x prefix
   */
  appSignerAddress: string
}
