import { Wallet } from 'ethers'
import supertest from 'supertest'
import app from '../../src/app'
import { db } from '../../src/db'
import knex from 'knex'
import configurations from '../../knexfile'
import { createDecentralizedStorage } from '../utils/storage'
import { IUserInfo } from '../../src/controllers/v1/delegated-fs/interface/IUserInfo'
import { ILightFsSaveRequest } from '../../src/controllers/v1/delegated-fs/interface/ILightFsSaveRequest'
import { getInteractorInfo } from '../../src/utils/farcaster'
import { insertMockedApp } from '../utils/app'
import { AuthorizationRequestStatus, insertAuthorizationRequest } from '../../src/db/authorization-request'
import { prepareEthAddress } from '../../src/utils/eth'
import { DelegatedFs } from '../../src/service/delegated-fs/delegated-fs'
import { delegatedFs } from '../../src/delegated-fs'
import { DEFAULT_DELEGATED_FS_OPTIONS } from '../../src/service/delegated-fs/interfaces'

const testDb = knex(configurations.development)

jest.mock('../../src/service/delegated-fs/delegated-fs-ipfs', () => {
  return {
    DelegatedFsIpfs: jest.fn().mockImplementation(() => ({ hello: 'w' })),
  }
})

jest.mock('../../src/utils/farcaster', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    getInteractorInfo: jest.fn().mockResolvedValue({}),
  }
})

function mockInteractor(interactorFid: number, frameUrl: string): void {
  ;(getInteractorInfo as jest.Mock).mockReturnValue({
    isValid: true,
    fid: interactorFid,
    username: '',
    display_name: '',
    pfp_url: '',
    inputValue: '',
    url: frameUrl,
    timestamp: new Date().toISOString(),
  })
}

describe('Delegated FS', () => {
  const supertestApp = supertest(app)

  beforeAll(() => {
    delegatedFs.decentralizedStorage = createDecentralizedStorage()
  })

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

  it('should return correct nonce for non-existent user and app', async () => {
    const userWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()
    const answer1 = (
      await supertestApp
        .get(
          `/v1/delegated-fs/get-user-info?userAddress=${userWallet.address}&applicationAddress=${applicationWallet.address}`,
        )
        .send()
    ).body as IUserInfo
    expect(answer1.nonce).toBe(-1)
  })

  it('should throw error in case of storing data with non-existent application', async () => {
    const userWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()
    const data: ILightFsSaveRequest = {
      data: 'test',
      userAddress: userWallet.address,
      proof: {
        nonce: 0,
        applicationAddress: applicationWallet.address,
        authServiceProof: await applicationWallet.signMessage('test'),
        applicationDelegateDataSignature: await applicationWallet.signMessage('test1'),
      },
    }
    const answer = (await supertestApp.post(`/v1/delegated-fs/save`).send(data)).body
    expect(answer).toEqual({ status: 'error', message: 'Invalid auth service proof' })
  })

  it('should throw error in case of getting data with non-existent user', async () => {
    const userWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()
    const answer = (
      await supertestApp
        .get(
          `/v1/delegated-fs/get-by-address?userAddress=${userWallet.address}&applicationAddress=${applicationWallet.address}`,
        )
        .send()
    ).body
    expect(answer).toEqual({ status: 'error', message: 'DataContent item not found' })
  })

  it('should store and get data', async () => {
    const { authServiceWallet, userWallet, appWallet, interactorFid } = await insertMockedApp(mockInteractor)
    const delegatedWallet = Wallet.createRandom()
    await insertAuthorizationRequest({
      app_signer_address: prepareEthAddress(appWallet.address),
      user_fid: interactorFid,
      status: AuthorizationRequestStatus.ACCEPTED,
      challenge: '',
      user_signer_address: '',
      service_signature: '',
    })

    const authServiceProof = await DelegatedFs.createDelegateSignature(
      userWallet.address,
      delegatedWallet.address,
      appWallet.address,
      authServiceWallet,
    )
    const dataContent0 = 'Hello, world!'
    const dataContent1 = 'Peace labor may!'
    const data0: ILightFsSaveRequest = {
      data: dataContent0,
      userAddress: userWallet.address,
      proof: {
        nonce: 0,
        applicationAddress: appWallet.address,
        authServiceProof,
        applicationDelegateDataSignature: await DelegatedFs.getDataSignature(dataContent0, 0, delegatedWallet),
      },
    }
    const data1: ILightFsSaveRequest = {
      data: dataContent1,
      userAddress: userWallet.address,
      proof: {
        nonce: 1,
        applicationAddress: appWallet.address,
        authServiceProof,
        applicationDelegateDataSignature: await DelegatedFs.getDataSignature(dataContent1, 1, delegatedWallet),
      },
    }
    const answer1 = (await supertestApp.post(`/v1/delegated-fs/save`).send(data0)).body
    expect(answer1).toEqual({ status: 'ok' })

    const answer2 = (
      await supertestApp
        .get(
          `/v1/delegated-fs/get-by-address?userAddress=${userWallet.address}&applicationAddress=${appWallet.address}`,
        )
        .send()
    ).text
    expect(answer2).toBe(dataContent0)

    // check that update with the same nonce is rejected
    const answer3 = (await supertestApp.post(`/v1/delegated-fs/save`).send(data0)).body
    expect(answer3).toEqual({ status: 'error', message: 'Invalid nonce. Expected: 1' })

    const answer4 = (
      await supertestApp
        .get(`/v1/delegated-fs/get-user-info?userAddress=${userWallet.address}&applicationAddress=${appWallet.address}`)
        .send()
    ).body as IUserInfo
    expect(answer4.nonce).toBe(0)

    const answer5 = (await supertestApp.post(`/v1/delegated-fs/save`).send(data1)).body
    expect(answer5).toEqual({ status: 'ok' })

    const answer6 = (
      await supertestApp
        .get(`/v1/delegated-fs/get-user-info?userAddress=${userWallet.address}&applicationAddress=${appWallet.address}`)
        .send()
    ).body as IUserInfo
    expect(answer6.nonce).toBe(1)
  })

  it('should throw error in case of storing too big data', async () => {
    const { authServiceWallet, userWallet, appWallet, interactorFid } = await insertMockedApp(mockInteractor)
    const delegatedWallet = Wallet.createRandom()
    await insertAuthorizationRequest({
      app_signer_address: prepareEthAddress(appWallet.address),
      user_fid: interactorFid,
      status: AuthorizationRequestStatus.ACCEPTED,
      challenge: '',
      user_signer_address: '',
      service_signature: '',
    })

    const authServiceProof = await DelegatedFs.createDelegateSignature(
      userWallet.address,
      delegatedWallet.address,
      appWallet.address,
      authServiceWallet,
    )
    const dataContent = 'a'.repeat(DEFAULT_DELEGATED_FS_OPTIONS.maxDataLength + 1)
    const data: ILightFsSaveRequest = {
      data: dataContent,
      userAddress: userWallet.address,
      proof: {
        nonce: 0,
        applicationAddress: appWallet.address,
        authServiceProof,
        applicationDelegateDataSignature: await DelegatedFs.getDataSignature(dataContent, 0, delegatedWallet),
      },
    }
    const answer = (await supertestApp.post(`/v1/delegated-fs/save`).send(data)).body
    expect(answer).toEqual({ status: 'error', message: 'Data is too long' })
  })
})
