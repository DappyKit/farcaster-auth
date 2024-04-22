import { db } from '../../src/db'
import knex from 'knex'
import configurations from '../../knexfile'
import { DelegatedFsMySQL } from '../../src/service/delegated-fs/delegated-fs-mysql'
import { getTotalItemCount } from '../../src/db/data-content'
import { ILocalDataManager, IUserAppHashes } from '../../src/service/delegated-fs/interfaces'
import { createDecentralizedStorage } from '../utils/storage'
import { runStressTest } from '../utils/stress-test'

const testDb = knex(configurations.development)

function createMySQLDataManager(): ILocalDataManager {
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
    await runStressTest(createMySQLDataManager, createDecentralizedStorage)
  })
})
