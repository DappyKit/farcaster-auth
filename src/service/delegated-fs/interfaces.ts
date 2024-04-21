/**
 * Delegated proof interface.
 */
export interface IDelegatedProof {
  /**
   * Nonce of the user data. It should be increased by 1 for each new data. It is used to prevent replay attacks.
   */
  nonce: number
  /**
   * Address of application that manages the user data. Without 0x prefix.
   */
  applicationAddress: string
  /**
   * Auth service proof signature that the service can manage the user data using delegated address. Without 0x prefix.
   */
  authServiceProof: string
  /**
   * Data signature by the application delegate signer of the user. Without 0x prefix.
   */
  applicationDelegateDataSignature: string
}

/**
 * Stored data interface.
 */
export interface IStoredData {
  /**
   * Data to store.
   */
  data: string
  /**
   * Proof of the data belongs to the user.
   */
  proof: IDelegatedProof
}

/**
 * Asserts that the data is a valid user app hashes.
 */
export interface IUserAppHashes {
  /**
   * User address.
   */
  [key: string]: {
    /**
     * Application address => Hash of stored data.
     */
    [key: string]: string
  }
}

/**
 * Local data manager interface.
 */
export interface ILocalDataManager {
  /**
   * Returns the user data for the application.
   * @param userAddress User address
   * @param applicationAddress Application address
   */
  getUserAppData(userAddress: string, applicationAddress: string): Promise<IStoredData>

  /**
   * Sets the user data for the application.
   * @param userAddress User address
   * @param data Data to set
   * @param proof Proof of the data
   * @param hash Hash of the data
   */
  setUserAppData(userAddress: string, data: string, proof: IDelegatedProof, hash: string): Promise<void>

  /**
   * Returns the nonce of the user data for the application.
   * @param userAddress User address
   * @param applicationAddress Application address
   */
  getUserAppNonce(userAddress: string, applicationAddress: string): Promise<number>

  /**
   * Returns the hashes of the user data for each application.
   */
  getUserAppHashes(): Promise<IUserAppHashes>
}

/**
 * Decentralized storage interface.
 */
export interface IDecentralizedStorage {
  /**
   * Uploads data to the decentralized storage and returns the hash of the data.
   * @param key Key of the data
   * @param data Data to upload
   */
  uploadData(key: string, data: string): Promise<string>

  /**
   * Downloads data from the decentralized storage.
   * @param hash Hash of the data
   */
  downloadData(hash: string): Promise<string>
}

/**
 * Options for the delegated file system.
 */
export interface IDelegatedFsOptions {
  /**
   * Maximum length of the data.
   */
  maxDataLength?: number
  /**
   * Verify the proof of the data when recovering from the root hash.
   */
  verifyOnRecover?: boolean
}

/**
 * Default options for the delegated file system.
 */
export const DEFAULT_DELEGATED_FS_OPTIONS: Required<IDelegatedFsOptions> = {
  maxDataLength: 10000,
  verifyOnRecover: true,
}

/**
 * Signer interface.
 */
export interface ISigner {
  signMessage: (message: string | Uint8Array) => Promise<string>
}
