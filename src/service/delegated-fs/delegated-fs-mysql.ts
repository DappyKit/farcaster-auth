import { IDelegatedProof, ILocalDataManager, IStoredData, IUserAppHashes } from './interfaces'
import { getAllUsersAppsHashes, getDataContentByUserAndApp, upsertDataContent } from '../../db/data-content'

export class DelegatedFsMySQL implements ILocalDataManager {
  async getUserAppHashes(): Promise<IUserAppHashes> {
    return getAllUsersAppsHashes()
  }

  async getUserAppNonce(userAddress: string, applicationAddress: string): Promise<number> {
    try {
      return (await getDataContentByUserAndApp(userAddress, applicationAddress)).nonce
    } catch (e) {
      return -1
    }
  }

  async getUserAppData(userAddress: string, applicationAddress: string): Promise<IStoredData> {
    const data = await getDataContentByUserAndApp(userAddress, applicationAddress)

    return {
      data: data.data,
      proof: JSON.parse(data.proof),
    }
  }

  async setUserAppData(userAddress: string, data: string, proof: IDelegatedProof, hash: string): Promise<void> {
    await upsertDataContent({
      user_address: userAddress,
      app_address: proof.applicationAddress,
      data,
      hash,
      proof: JSON.stringify(proof),
      nonce: proof.nonce,
    })
  }
}
