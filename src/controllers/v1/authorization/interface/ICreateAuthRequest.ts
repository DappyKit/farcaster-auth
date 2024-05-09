export interface ICreateAuthRequest {
  /**
   * Proof of user's request to the app
   */
  messageBytesProof: string
  /**
   * Delegated address of a signer created for a user by the 3rd party service. With 0x prefix.
   */
  userDelegatedAddress: string
  /**
   * Signature of the service to verify the user address. Without 0x prefix.
   */
  serviceSignature: string
}
