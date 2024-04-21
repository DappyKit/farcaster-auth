import { db } from '../../src/db'
import knex from 'knex'
import configurations from '../../knexfile'
import { DelegatedFsMySQL } from '../../src/service/delegated-fs/delegated-fs-mysql'
import { getTotalItemCount } from '../../src/db/data-content'
import { ILocalDataManager, IUserAppHashes } from '../../src/service/delegated-fs/interfaces'
import { Wallet } from 'ethers'
import { DelegatedFs } from '../../src/service/delegated-fs/delegated-fs'
import { prepareEthAddress } from '../../src/utils/eth'
import { createDecentralizedStorage } from '../utils/storage'

const testDb = knex(configurations.development)

function createLocalDataManager(): ILocalDataManager {
  return new DelegatedFsMySQL()
}

describe('Delegated FS MySQL', () => {
  beforeEach(async () => {
    // Rollback the migration (if any)
    await testDb.migrate.rollback()
    // Run the migration
    await testDb.migrate.latest()
  })

  afterEach(async () => {
    // After each test, we can rollback the migration
    await testDb.migrate.rollback()
  })

  afterAll(async () => {
    // to prevent tests freezing after execution
    await testDb.destroy()
    await db.destroy()
  })

  it('should set and get user app data', async () => {
    const fsMySQL = new DelegatedFsMySQL()
    const data1 = 'data1'
    const hash1 = 'hash1'
    const userAddress = '0x1'
    const appAddress = '0x2'
    const proof = {
      nonce: 1,
      applicationAddress: '0x2',
      authServiceProof: 'proof1',
      applicationDelegateDataSignature: 'signature1',
    }

    await expect(fsMySQL.getUserAppData(userAddress, appAddress)).rejects.toThrow('Date Content item not found')
    await fsMySQL.setUserAppData(userAddress, data1, proof, hash1)
    const response1 = await fsMySQL.getUserAppData(userAddress, appAddress)
    expect(response1).toEqual({
      data: data1,
      proof,
    })
  })

  it('should update existing user app data without increasing count', async () => {
    const fsMySQL = new DelegatedFsMySQL()
    const userAddress = '0x1'
    const appAddress = '0x2'
    const initialData = 'initialData'
    const initialHash = 'initialHash'
    const updatedData = 'updatedData'
    const updatedHash = 'updatedHash'
    const proof = {
      nonce: 1,
      applicationAddress: '0x2',
      authServiceProof: 'proof1',
      applicationDelegateDataSignature: 'signature1',
    }

    await fsMySQL.setUserAppData(userAddress, initialData, proof, initialHash)
    expect(await getTotalItemCount()).toBe(1)
    await fsMySQL.setUserAppData(userAddress, updatedData, proof, updatedHash)
    const responseData = await fsMySQL.getUserAppData(userAddress, appAddress)

    expect(responseData).toEqual({
      data: updatedData,
      proof,
    })

    expect(await getTotalItemCount()).toBe(1)
  })

  it('should set data and check that it is set correctly, then set new data and check again for the same user and app', async () => {
    const fsMySQL = new DelegatedFsMySQL()
    const userAddress = '0x1'
    const appAddress = '0x2'
    const initialData = 'initialData'
    const initialHash = 'initialHash'
    const updatedData = 'updatedData'
    const updatedHash = 'updatedHash'
    const proof = {
      nonce: 1,
      applicationAddress: '0x2',
      authServiceProof: 'proof1',
      applicationDelegateDataSignature: 'signature1',
    }

    // Set initial data and verify
    await fsMySQL.setUserAppData(userAddress, initialData, proof, initialHash)
    let responseData = await fsMySQL.getUserAppData(userAddress, appAddress)
    expect(responseData).toEqual({
      data: initialData,
      proof,
    })

    // Update data and verify
    await fsMySQL.setUserAppData(userAddress, updatedData, proof, updatedHash)
    responseData = await fsMySQL.getUserAppData(userAddress, appAddress)
    expect(responseData).toEqual({
      data: updatedData,
      proof,
    })
  })

  it('should return user app hashes', async () => {
    const fsMySQL = new DelegatedFsMySQL()
    const userAddress = '0x1'
    const appAddress = '0x2'
    const data1 = 'data1'
    const hash1 = 'hash1'
    const proof = {
      nonce: 1,
      applicationAddress: '0x2',
      authServiceProof: 'proof1',
      applicationDelegateDataSignature: 'signature1',
    }

    await fsMySQL.setUserAppData(userAddress, data1, proof, hash1)
    const response = await fsMySQL.getUserAppHashes()
    expect(response).toEqual({
      [userAddress]: {
        [appAddress]: hash1,
      },
    })
  })

  it('should return user app hashes for multiple users and apps', async () => {
    const fsMySQL = new DelegatedFsMySQL()
    const expectedHashes: IUserAppHashes = {}

    // Set up data for 20 users, each with 5 apps
    for (let userIndex = 1; userIndex <= 20; userIndex++) {
      const userAddress = `0x${userIndex}`
      expectedHashes[userAddress] = {}

      for (let appIndex = 1; appIndex <= 5; appIndex++) {
        const appAddress = `0x${userIndex * 10 + appIndex}`
        const data = `data${userIndex}-${appIndex}`
        const hash = `hash${userIndex}-${appIndex}`
        const proof = {
          nonce: userIndex + appIndex,
          applicationAddress: appAddress,
          authServiceProof: `proof${userIndex}`,
          applicationDelegateDataSignature: `signature${userIndex}`,
        }

        await fsMySQL.setUserAppData(userAddress, data, proof, hash)
        expectedHashes[userAddress][appAddress] = hash
      }
    }

    // Retrieve hashes for all users and apps
    const response = await fsMySQL.getUserAppHashes()
    expect(response).toEqual(expectedHashes)
  })

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
})
