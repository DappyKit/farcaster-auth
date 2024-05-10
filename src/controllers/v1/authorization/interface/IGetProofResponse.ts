export interface IGetProofResponse {
  /**
   * Status of the response
   */
  status: string
  /**
   * User main address in the form of hex without 0x prefix
   */
  userMainAddress: string
  /**
   * Delegated address which created by 3rd party application for the user
   */
  userDelegatedAddress: string
  /**
   * Application address in the form of hex without 0x prefix
   */
  applicationAddress: string
  /**
   * Authentication service proof in the form of hex without 0x prefix
   */
  authServiceProof: string
  /**
   * Proof signature from 3rd party service in the form of hex without 0x prefix
   */
  serviceProof: string
}
