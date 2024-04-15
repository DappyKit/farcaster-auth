export interface ICreateAuthRequest {
  /**
   * Proof of user's request to the app
   */
  messageBytesProof: string
  /**
   * Address of a signer created for a user
   */
  userSignerAddress: string
  /**
   * Signature of the service to verify the user address
   */
  serviceSignature: string
}
