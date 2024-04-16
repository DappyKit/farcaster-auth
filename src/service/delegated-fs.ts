import { verifyMessage } from 'ethers'
import { prepareEthAddress, prepareEthSignature } from '../utils/eth'
import { safeJsonParse } from '../utils/json'

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
 * Asserts that the data is a valid user app hashes.
 * @param data Data to check
 */
export function assertIsUserAppHashes(data: unknown): asserts data is IUserAppHashes {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data is not an object.')
  }

  const entries = Object.entries(data as Record<string, unknown>)
  for (const [key, value] of entries) {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Data at key '${key}' is not an object.`)
    }

    const nestedEntries = Object.entries(value)
    for (const [nestedKey, nestedValue] of nestedEntries) {
      if (typeof nestedValue !== 'string') {
        throw new Error(`Value at key '${key}.${nestedKey}' is not a string.`)
      }
    }
  }
}

/**
 * Asserts that the data is a valid stored data.
 * @param data Data to check
 */
export function assertIsStoredData(data: unknown): asserts data is IStoredData {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data is not an object.')
  }

  if (typeof (data as IStoredData).data !== 'string') {
    throw new Error('Data.data is not a string.')
  }

  if (typeof (data as IStoredData).proof !== 'object' || (data as IStoredData).proof === null) {
    throw new Error('Data.proof is not an object.')
  }

  const proof = (data as IStoredData).proof

  if (typeof proof.nonce !== 'number') {
    throw new Error('Proof.nonce is not a number.')
  }

  if (typeof proof.applicationAddress !== 'string') {
    throw new Error('Proof.applicationAddress is not a string.')
  }

  if (typeof proof.authServiceProof !== 'string') {
    throw new Error('Proof.authServiceProof is not a string.')
  }

  if (typeof proof.applicationDelegateDataSignature !== 'string') {
    throw new Error('Proof.applicationDelegateDataSignature is not a string.')
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

/**
 * Delegated file system.
 */
export class DelegatedFs {
  public readonly KEY_RESULT_DATA = 'result-data'
  public readonly KEY_USER_APP_DATA_ITEM = 'user-app-data-item'
  private options: Required<IDelegatedFsOptions>

  constructor(
    public localDataManager: ILocalDataManager,
    public decentralizedStorage: IDecentralizedStorage,
    public authServiceAddress: string,
    options?: IDelegatedFsOptions,
  ) {
    this.authServiceAddress = prepareEthAddress(authServiceAddress)
    this.options = { ...DEFAULT_DELEGATED_FS_OPTIONS, ...options }
  }

  /**
   * Signs the data with the nonce and returns the signature.
   * @param data Data
   * @param nonce Nonce
   * @param signer Signer
   */
  static async getDataSignature(data: string, nonce: number, signer: ISigner): Promise<string> {
    const messageToSign = `${nonce}${data}`
    const signature = await signer.signMessage(messageToSign)

    return prepareEthSignature(signature)
  }

  /**
   * Returns the text to sign for the delegated address.
   * @param userAddress User address
   * @param userDelegatedAddress User delegated address
   * @param applicationAddress Application address
   */
  static getDelegatedText(userAddress: string, userDelegatedAddress: string, applicationAddress: string): string {
    return `${prepareEthAddress(userAddress)}${prepareEthAddress(userDelegatedAddress)}${prepareEthAddress(applicationAddress)}`
  }

  /**
   * Creates a signature for the delegated address.
   * @param userAddress User address
   * @param userDelegatedAddress User delegated address
   * @param applicationAddress Application address
   * @param signer Signer
   */
  static async createDelegateSignature(
    userAddress: string,
    userDelegatedAddress: string,
    applicationAddress: string,
    signer: ISigner,
  ): Promise<string> {
    return prepareEthSignature(
      await signer.signMessage(DelegatedFs.getDelegatedText(userAddress, userDelegatedAddress, applicationAddress)),
    )
  }

  /**
   * Extracts the signer address from the data and signature.
   * @param data Data
   * @param signature Signature
   * @private
   */
  private extractSignerAddress(data: string, signature: string): string {
    return prepareEthAddress(verifyMessage(data, `0x${signature}`))
  }

  /**
   * Checks the proof of the data.
   * @param userAddress User address
   * @param data Data
   * @param proof Proof
   * @private
   */
  private async checkProof(userAddress: string, data: string, proof: IDelegatedProof) {
    const userDelegatedAddress = this.extractSignerAddress(
      `${proof.nonce}${data}`,
      proof.applicationDelegateDataSignature,
    )
    const extractedAddress = this.extractSignerAddress(
      DelegatedFs.getDelegatedText(userAddress, userDelegatedAddress, proof.applicationAddress),
      proof.authServiceProof,
    )

    if (extractedAddress !== this.authServiceAddress) {
      throw new Error('Invalid auth service proof')
    }
  }

  /**
   * Returns the key for the user data for the application.
   * @param userAddress User address
   * @param applicationAddress Application address
   * @private
   */
  private getUserAppKey(userAddress: string, applicationAddress: string): string {
    return `${this.KEY_USER_APP_DATA_ITEM}_${prepareEthAddress(userAddress)}_${prepareEthAddress(applicationAddress)}`
  }

  /**
   * Prepares the delegated proof for the storage.
   * @param proof Delegated proof
   * @private
   */
  private prepareDelegatedProof(proof: IDelegatedProof): IDelegatedProof {
    return {
      nonce: proof.nonce,
      applicationAddress: prepareEthAddress(proof.applicationAddress),
      authServiceProof: prepareEthSignature(proof.authServiceProof),
      applicationDelegateDataSignature: prepareEthSignature(proof.applicationDelegateDataSignature),
    }
  }

  /**
   * Returns the hashes of users.
   */
  public async getUserAppHashes(): Promise<IUserAppHashes> {
    return this.localDataManager.getUserAppHashes()
  }

  /**
   * Returns the nonce of the user data for the application.
   * @param userAddress User address
   * @param applicationAddress Application address
   */
  public async getUserAppNonce(userAddress: string, applicationAddress: string): Promise<number> {
    return this.localDataManager.getUserAppNonce(prepareEthAddress(userAddress), prepareEthAddress(applicationAddress))
  }

  /**
   * Sets the user data for the application.
   * @param userAddress User address
   * @param data Data to set
   * @param proof Proof of the data
   */
  public async setUserAppData(userAddress: string, data: string, proof: IDelegatedProof): Promise<void> {
    if (data.length > this.options.maxDataLength) {
      throw new Error('Data is too long')
    }

    userAddress = prepareEthAddress(userAddress)
    proof = this.prepareDelegatedProof(proof)

    const userAppNonce = await this.localDataManager.getUserAppNonce(userAddress, proof.applicationAddress)

    if (proof.nonce !== userAppNonce + 1) {
      throw new Error(`Invalid nonce. Expected: ${userAppNonce + 1}`)
    }

    await this.checkProof(userAddress, data, proof)
    const uploadData: IStoredData = {
      data,
      proof,
    }
    const hash = await this.decentralizedStorage.uploadData(
      this.getUserAppKey(userAddress, proof.applicationAddress),
      JSON.stringify(uploadData),
    )
    await this.localDataManager.setUserAppData(userAddress, data, proof, hash)
  }

  /**
   * Returns the user data for the application.
   * @param userAddress User address
   * @param applicationAddress Application address
   */
  public async getUserAppData(userAddress: string, applicationAddress: string): Promise<IStoredData> {
    return this.localDataManager.getUserAppData(userAddress, applicationAddress)
  }

  /**
   * Uploads the data to the decentralized storage and returns the root hash.
   */
  public async uploadRootData(): Promise<string> {
    const data = JSON.stringify(await this.localDataManager.getUserAppHashes())

    return this.decentralizedStorage.uploadData(this.KEY_RESULT_DATA, data)
  }

  /**
   * Recovers the data from the root hash by downloading the data and storing it locally.
   * @param hash Root hash
   */
  public async recoverFromRootHash(hash: string): Promise<void> {
    const userAppHashes = safeJsonParse(
      await this.decentralizedStorage.downloadData(hash),
      'Data under the root hash is invalid',
    )
    assertIsUserAppHashes(userAppHashes)
    for (const [userAddress, applicationAddresses] of Object.entries(userAppHashes)) {
      for (const [, hash] of Object.entries(applicationAddresses)) {
        const data = safeJsonParse(
          await this.decentralizedStorage.downloadData(hash),
          `Data under the hash ${hash} is invalid`,
        )
        assertIsStoredData(data)

        if (this.options.verifyOnRecover) {
          await this.checkProof(userAddress, data.data, data.proof)
        }

        await this.localDataManager.setUserAppData(userAddress, data.data, data.proof, hash)
      }
    }
  }
}
