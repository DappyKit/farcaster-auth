import {
  IDecentralizedStorage,
  IDelegatedProof,
  ILocalDataManager,
  IStoredData,
  IUserAppHashes,
} from '../../src/service/delegated-fs/interfaces'

export interface ILocalData {
  [key: string]: {
    [key: string]: {
      data: string
      proof: IDelegatedProof
      hash: string
    }
  }
}

export function createLocalDataManager(): ILocalDataManager {
  const localData: ILocalData = {}

  return {
    async getUserAppData(userAddress: string, applicationAddress: string): Promise<IStoredData> {
      const data = localData[userAddress]?.[applicationAddress]

      if (!data) {
        throw new Error('getUserAppData: Data not found')
      }

      return data
    },

    async setUserAppData(userAddress: string, data: string, proof: IDelegatedProof, hash: string): Promise<void> {
      if (!localData[userAddress]) {
        localData[userAddress] = {}
      }

      localData[userAddress][proof.applicationAddress] = { data, proof, hash }
    },

    async getUserAppNonce(userAddress: string, applicationAddress: string): Promise<number> {
      return localData[userAddress]?.[applicationAddress]?.proof.nonce ?? -1
    },

    async getUserAppHashes(): Promise<IUserAppHashes> {
      const hashes: IUserAppHashes = {}
      for (const userAddress in localData) {
        if (localData.hasOwnProperty(userAddress)) {
          hashes[userAddress] = {}
          for (const applicationAddress in localData[userAddress]) {
            if (localData[userAddress].hasOwnProperty(applicationAddress)) {
              hashes[userAddress][applicationAddress] = localData[userAddress][applicationAddress].hash
            }
          }
        }
      }

      return hashes
    },
  }
}

export function createDecentralizedStorage(): IDecentralizedStorage {
  let counter = 1
  const dataItems: { [key: string]: string } = {}

  return {
    uploadData: jest.fn(async (key: string, data: string): Promise<string> => {
      const result = counter.toString()
      counter++
      dataItems[result] = data

      return result
    }),

    downloadData: jest.fn(async (hash: string): Promise<string> => {
      return dataItems[hash] ?? ''
    }),
  }
}
