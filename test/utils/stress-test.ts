import { Wallet } from 'ethers'
import { DelegatedFs } from '../../src/service/delegated-fs/delegated-fs'
import { prepareEthAddress } from '../../src/utils/eth'
import { IDecentralizedStorage, ILocalDataManager } from '../../src/service/delegated-fs/interfaces'

export interface IRunStressTest {
  usersCount: number
  applicationsCount: number
  operationsCount: number
}

export async function runStressTest(
  createLocalDataManager: () => ILocalDataManager,
  createDecentralizedStorage: () => IDecentralizedStorage,
  options?: IRunStressTest,
) {
  const USERS_COUNT = options?.usersCount || 4
  const APPLICATIONS_COUNT = options?.applicationsCount || 4
  const OPERATIONS_COUNT = options?.operationsCount || 4

  const decentralizedStorage = createDecentralizedStorage()
  expect(decentralizedStorage.downloadData).toHaveBeenCalledTimes(0)
  const authServiceWallet = Wallet.createRandom()
  const fs = new DelegatedFs(createLocalDataManager(), decentralizedStorage, authServiceWallet.address)
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
  expect(decentralizedStorage.downloadData).toHaveBeenCalledTimes(0)
  const localDataManager2 = createLocalDataManager()
  const fs2 = new DelegatedFs(localDataManager2, decentralizedStorage, authServiceWallet.address)
  await fs2.recoverFromRootHash(resultHash)
  // it downloads only the last changes of the user in the app + 1 for the root hash
  expect(decentralizedStorage.downloadData).toHaveBeenCalledTimes(USERS_COUNT * APPLICATIONS_COUNT + 1)

  const userAppHashes2 = await fs.getUserAppHashes()
  const users2 = Object.keys(userAppHashes2)
  expect(users2).toHaveLength(USERS_COUNT)
  for (const userWallet of users) {
    const addressToCheck = prepareEthAddress(userWallet.address)
    expect(users2).toContain(addressToCheck)
    const applications2 = Object.keys(userAppHashes2[addressToCheck])
    expect(applications2).toHaveLength(APPLICATIONS_COUNT)
    for (const applicationWallet of applications) {
      const addressToCheck = prepareEthAddress(applicationWallet.address)
      expect(applications2).toContain(addressToCheck)
    }
  }
}
