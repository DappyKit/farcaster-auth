import { verifyMessage } from 'ethers'
import { prepareEthAddress, prepareEthSignature } from '../../utils/eth'
import { safeJsonParse } from '../../utils/json'
import {
  DEFAULT_DELEGATED_FS_OPTIONS,
  IDecentralizedStorage,
  IDelegatedFsOptions,
  IDelegatedProof,
  ILocalDataManager,
  ISigner,
  IStoredData,
  IUserAppHashes,
} from './interfaces'
import { assertIsStoredData, assertIsUserAppHashes } from './utils'

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
   * @param errorText Error text
   */
  static getDelegatedText(
    userAddress: string,
    userDelegatedAddress: string,
    applicationAddress: string,
    errorText?: string,
  ): string {
    userAddress = prepareEthAddress(userAddress)
    userDelegatedAddress = prepareEthAddress(userDelegatedAddress)
    applicationAddress = prepareEthAddress(applicationAddress)
    const addresses = new Set([userAddress, userDelegatedAddress, applicationAddress])

    if (addresses.size !== 3) {
      throw new Error('Delegated text addresses must be unique')
    }

    let text = `${userAddress}${userDelegatedAddress}${applicationAddress}`

    if (errorText) {
      text = `ERROR${text}${errorText}`
    }

    return text
  }

  /**
   * Creates a signature for the delegated address.
   * @param userAddress User address
   * @param userDelegatedAddress User delegated address
   * @param applicationAddress Application address
   * @param signer Signer
   * @param errorText Error text
   */
  static async createDelegateSignature(
    userAddress: string,
    userDelegatedAddress: string,
    applicationAddress: string,
    signer: ISigner,
    errorText?: string,
  ): Promise<string> {
    return prepareEthSignature(
      await signer.signMessage(
        DelegatedFs.getDelegatedText(userAddress, userDelegatedAddress, applicationAddress, errorText),
      ),
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
    return this.localDataManager.getUserAppData(prepareEthAddress(userAddress), prepareEthAddress(applicationAddress))
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
