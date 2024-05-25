import knex from 'knex'
import configurations from '../../knexfile'
import { db } from '../../src/db'
import { getInteractorInfo, InteractorInfo } from '../../src/utils/farcaster'
import app from '../../src/app'
import supertest from 'supertest'
import { getAppByFid, getAppsCount } from '../../src/db/app'
import { ICreateRequest } from '../../src/controllers/v1/app/interface/ICreateRequest'
import { getConfigData, setConfigData } from '../../src/config'
import { Wallet } from 'ethers'
import { prepareEthAddress } from '../../src/utils/eth'

export interface InputMock {
  /**
   * Click bytes
   */
  bytes: string
  /**
   * Extracted input from the click bytes
   */
  input: string
}

const testDb = knex(configurations.development)

jest.mock('../../src/utils/frame', () => {
  const originalModule = jest.requireActual('../../src/utils/frame')

  return {
    ...originalModule,
    validateFrameUrl: jest.fn().mockResolvedValue({}),
  }
})

jest.mock('../../src/utils/farcaster', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    getInteractorInfo: jest.fn().mockResolvedValue({}),
  }
})

const getInteractorInfoMock = getInteractorInfo as jest.Mock

function mockInteractorFunc(func: (neynarApiKey: string, clickData: string) => InteractorInfo) {
  getInteractorInfoMock.mockImplementation(func)
}

function mockInputData(fid: number, frameUrl: string, authorizedFrameUrl: string, data: InputMock[]) {
  mockInteractorFunc((neynarApiKey: string, clickData: string) => {
    const foundItem = data.find(item => item.bytes === clickData)

    if (!foundItem) {
      throw new Error('Unrecognized mocked click data: ' + clickData)
    }

    return {
      isValid: true,
      fid,
      username: '',
      display_name: '',
      pfp_url: '',
      inputValue: foundItem.input,
      url: authorizedFrameUrl,
      timestamp: new Date().toISOString(),
      custodyAddress: '',
    }
  })
}

describe('App', () => {
  const supertestApp = supertest(app)

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

  it('should create an app', async () => {
    const fid = 123
    const postData: ICreateRequest = {
      frameUrlBytes: '0x123',
      frameCallbackUrlBytes: '0x222',
      frameSignerAddressBytes: '0x333',
    }
    const wallet = Wallet.createRandom()
    const authorizedFrameUrl = 'https://auth-frame.com'
    const frameUrl = 'https://example.com'
    const callbackUrl = 'https://example.com/callback'
    setConfigData({
      ...getConfigData(),
      authorizedFrameUrl,
    })
    mockInputData(fid, frameUrl, authorizedFrameUrl, [
      {
        bytes: postData.frameUrlBytes,
        input: frameUrl,
      },
      {
        bytes: postData.frameCallbackUrlBytes,
        input: callbackUrl,
      },
      {
        bytes: postData.frameSignerAddressBytes,
        input: wallet.address,
      },
    ])
    expect(await getAppByFid(fid)).toBeNull()
    expect(await getAppsCount()).toEqual(0)

    const data = (await supertestApp.post(`/v1/app/create`).send(postData)).body
    expect(data).toEqual({ status: 'ok' })
    expect(await getAppByFid(fid)).toBeDefined()
    expect(await getAppsCount()).toEqual(1)

    const data1 = (await supertestApp.post(`/v1/app/create`).send(postData)).body
    expect(data1).toEqual({ status: 'error', message: 'App already exists' })
    expect(await getAppsCount()).toEqual(1)
  })

  it('should create multiple apps', async () => {
    const fid = 123
    const postData1: ICreateRequest = {
      frameUrlBytes: '0x111',
      frameCallbackUrlBytes: '0x222',
      frameSignerAddressBytes: '0x333',
    }
    const postData2: ICreateRequest = {
      frameUrlBytes: '0x444',
      frameCallbackUrlBytes: '0x555',
      frameSignerAddressBytes: '0x666',
    }

    const wallet1 = Wallet.createRandom()
    const wallet2 = Wallet.createRandom()

    const appInput1Mock: InputMock[] = [
      {
        bytes: postData1.frameUrlBytes,
        input: 'https://example.com',
      },
      {
        bytes: postData1.frameCallbackUrlBytes,
        input: 'https://example.com/callback',
      },
      {
        bytes: postData1.frameSignerAddressBytes,
        input: wallet1.address,
      },
    ]

    const appInput2Mock: InputMock[] = [
      {
        bytes: postData2.frameUrlBytes,
        input: 'https://example22.com',
      },
      {
        bytes: postData2.frameCallbackUrlBytes,
        input: 'https://example222.com/callback',
      },
      {
        bytes: postData2.frameSignerAddressBytes,
        input: wallet2.address,
      },
    ]

    const authorizedFrameUrl = 'https://auth-frame.com'
    const frameUrl = 'https://example.com'
    setConfigData({
      ...getConfigData(),
      authorizedFrameUrl,
    })
    expect(await getAppByFid(fid)).toBeNull()
    expect(await getAppsCount()).toEqual(0)

    mockInputData(fid, frameUrl, authorizedFrameUrl, appInput1Mock)
    const data = (await supertestApp.post(`/v1/app/create`).send(postData1)).body
    expect(data).toEqual({ status: 'ok' })
    expect(await getAppByFid(fid)).toBeDefined()
    expect(await getAppsCount()).toEqual(1)

    mockInputData(fid, frameUrl, authorizedFrameUrl, appInput2Mock)
    const data1 = (await supertestApp.post(`/v1/app/create`).send(postData2)).body
    expect(data1).toEqual({ status: 'ok' })
    expect(await getAppsCount()).toEqual(2)
  })

  it('should check app existence', async () => {
    const fid = 123
    const postData: ICreateRequest = {
      frameUrlBytes: '0x123',
      frameCallbackUrlBytes: '0x222',
      frameSignerAddressBytes: '0x333',
    }
    const wallet = Wallet.createRandom()
    const authorizedFrameUrl = 'https://auth-frame.com'
    const frameUrl = 'https://example.com'
    const callbackUrl = 'https://example.com/callback'
    setConfigData({
      ...getConfigData(),
      authorizedFrameUrl,
    })
    mockInputData(fid, frameUrl, authorizedFrameUrl, [
      {
        bytes: postData.frameUrlBytes,
        input: frameUrl,
      },
      {
        bytes: postData.frameCallbackUrlBytes,
        input: callbackUrl,
      },
      {
        bytes: postData.frameSignerAddressBytes,
        input: wallet.address,
      },
    ])

    const data = (await supertestApp.post(`/v1/app/create`).send(postData)).body
    expect(data).toEqual({ status: 'ok' })
    expect(await getAppByFid(fid)).toBeDefined()
    expect(await getAppsCount()).toEqual(1)

    // check with the full address
    const data1 = (await supertestApp.get(`/v1/app/exists?applicationAddress=${wallet.address}`).send()).body
    expect(data1).toEqual({ status: 'ok', isExists: true })

    // check with the prepared address
    const data2 = (
      await supertestApp.get(`/v1/app/exists?applicationAddress=${prepareEthAddress(wallet.address)}`).send()
    ).body
    expect(data2).toEqual({ status: 'ok', isExists: true })
  })
})
