import {
  DelegatedFs,
  IDecentralizedStorage,
  IDelegatedProof,
  ILocalDataManager,
  IStoredData,
  IUserAppHashes,
} from '../../src/service/delegated-fs'
import { Wallet } from 'ethers'
import { prepareEthAddress } from '../../src/utils/eth'

interface ILocalData {
  [key: string]: {
    [key: string]: {
      data: string
      proof: IDelegatedProof
      hash: string
    }
  }
}

function createDecentralizedStorage(): IDecentralizedStorage {
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

function createLocalDataManager(): ILocalDataManager {
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

describe('Delegated FS', () => {
  it('should build root hash and recover from it', async () => {
    const USERS_COUNT = 4
    const APPLICATIONS_COUNT = 4
    const OPERATIONS_COUNT = 4

    const localDataManager = createLocalDataManager()
    const decentralizedStorage = createDecentralizedStorage()
    const authServiceWallet = Wallet.createRandom()
    const fs = new DelegatedFs(localDataManager, decentralizedStorage, authServiceWallet.address)

    const users = new Array(USERS_COUNT).fill(null).map(() => Wallet.createRandom())
    const applications = new Array(APPLICATIONS_COUNT).fill(null).map(() => Wallet.createRandom())

    for (const userWallet of users) {
      for (const applicationWallet of applications) {
        for (let i = 0; i < OPERATIONS_COUNT; i++) {
          const data = `data from user ${userWallet.address} app ${applicationWallet.address} change ${i}`
          const nonce = (await fs.getUserAppNonce(userWallet.address, applicationWallet.address)) + 1
          const authServiceProofSignature = await DelegatedFs.createDelegateSignature(
            userWallet.address,
            userWallet.address,
            applicationWallet.address,
            authServiceWallet,
          )

          await fs.setUserAppData(userWallet.address, data, {
            nonce,
            applicationAddress: applicationWallet.address,
            authServiceProof: authServiceProofSignature,
            applicationDelegateDataSignature: await DelegatedFs.getDataSignature(data, nonce, userWallet),
          })
        }
      }
    }

    const resultHash = await fs.uploadRootData()
    expect(resultHash).toEqual((USERS_COUNT * APPLICATIONS_COUNT * OPERATIONS_COUNT + 1).toString())

    expect(decentralizedStorage.downloadData).toHaveBeenCalledTimes(0)
    const localDataManager2 = createLocalDataManager()
    const fs2 = new DelegatedFs(localDataManager2, decentralizedStorage, authServiceWallet.address)
    await fs2.recoverFromRootHash(resultHash)
    // it downloads only the last changes of the user in the app + 1 for the root hash
    expect(decentralizedStorage.downloadData).toHaveBeenCalledTimes(USERS_COUNT * APPLICATIONS_COUNT + 1)

    const userAppHashes2 = await fs.getUserAppHashes()
    const users2 = Object.keys(userAppHashes2)
    expect(users2).toHaveLength(4)
    for (const userWallet of users) {
      const addressToCheck = prepareEthAddress(userWallet.address)
      expect(users2).toContain(addressToCheck)
      const applications2 = Object.keys(userAppHashes2[addressToCheck])
      expect(applications2).toHaveLength(4)
      for (const applicationWallet of applications) {
        const addressToCheck = prepareEthAddress(applicationWallet.address)
        expect(applications2).toContain(addressToCheck)
      }
    }
  })

  it('should throw nonce error', async () => {
    const localDataManager = createLocalDataManager()
    const decentralizedStorage = createDecentralizedStorage()
    const authServiceWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()
    const userWallet = Wallet.createRandom()
    const userDelegatedWallet = Wallet.createRandom()
    const fs = new DelegatedFs(localDataManager, decentralizedStorage, authServiceWallet.address)

    const authServiceProofSignature = await DelegatedFs.createDelegateSignature(
      userWallet.address,
      userDelegatedWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    const data = 'hi'
    const nonce = 0
    await fs.setUserAppData(userWallet.address, data, {
      nonce,
      applicationAddress: applicationWallet.address,
      authServiceProof: authServiceProofSignature,
      applicationDelegateDataSignature: await DelegatedFs.getDataSignature(data, nonce, userDelegatedWallet),
    })

    await expect(
      fs.setUserAppData(userWallet.address, data, {
        nonce,
        applicationAddress: applicationWallet.address,
        authServiceProof: authServiceProofSignature,
        applicationDelegateDataSignature: await userDelegatedWallet.signMessage(`${nonce}${data}`),
      }),
    ).rejects.toThrow('Invalid nonce. Expected: 1')
  })

  it('should accept updates from a legitimate user and reject updates from a fake user', async () => {
    const localDataManager = createLocalDataManager()
    const decentralizedStorage = createDecentralizedStorage()
    const authServiceWallet = Wallet.createRandom()
    const fs = new DelegatedFs(localDataManager, decentralizedStorage, authServiceWallet.address)

    // Create legitimate and fake users
    const legitimateUserWallet = Wallet.createRandom()
    const fakeUserWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()

    // First update from legitimate user
    const legitimateData = 'legitimate data update'
    const legitimateNonce = (await fs.getUserAppNonce(legitimateUserWallet.address, applicationWallet.address)) + 1
    const legitimateAuthServiceProofSignature = await DelegatedFs.createDelegateSignature(
      legitimateUserWallet.address,
      legitimateUserWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    await fs.setUserAppData(legitimateUserWallet.address, legitimateData, {
      nonce: legitimateNonce,
      applicationAddress: applicationWallet.address,
      authServiceProof: legitimateAuthServiceProofSignature,
      applicationDelegateDataSignature: await DelegatedFs.getDataSignature(
        legitimateData,
        legitimateNonce,
        legitimateUserWallet,
      ),
    })

    // Attempt to update from fake user
    const fakeData = 'fake data update'
    const fakeNonce = (await fs.getUserAppNonce(legitimateUserWallet.address, applicationWallet.address)) + 1
    const fakeAuthServiceProofSignature = await DelegatedFs.createDelegateSignature(
      fakeUserWallet.address,
      fakeUserWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    await expect(
      fs.setUserAppData(legitimateUserWallet.address, fakeData, {
        nonce: fakeNonce,
        applicationAddress: applicationWallet.address,
        authServiceProof: fakeAuthServiceProofSignature,
        applicationDelegateDataSignature: await DelegatedFs.getDataSignature(fakeData, fakeNonce, fakeUserWallet),
      }),
    ).rejects.toThrow('Invalid auth service proof')
  })
})
