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
    mockInteractorFunc((neynarApiKey: string, clickData: string) => {
      if (clickData === postData.frameUrlBytes) {
        return {
          isValid: true,
          fid,
          username: '',
          display_name: '',
          pfp_url: '',
          inputValue: frameUrl,
          url: authorizedFrameUrl,
          timestamp: new Date().toISOString(),
        }
      } else if (clickData === postData.frameCallbackUrlBytes) {
        return {
          isValid: true,
          fid,
          username: '',
          display_name: '',
          pfp_url: '',
          inputValue: callbackUrl,
          url: authorizedFrameUrl,
          timestamp: new Date().toISOString(),
        }
      } else if (clickData === postData.frameSignerAddressBytes) {
        return {
          isValid: true,
          fid,
          username: '',
          display_name: '',
          pfp_url: '',
          inputValue: wallet.address,
          url: authorizedFrameUrl,
          timestamp: new Date().toISOString(),
        }
      } else {
        throw new Error('Unrecognized mocked click data')
      }
    })
    expect(await getAppByFid(fid)).toBeNull()
    expect(await getAppsCount()).toEqual(0)

    const data = (await supertestApp.post(`/v1/app/create`).send(postData)).body
    expect(data).toEqual({ status: 'ok' })
    expect(await getAppByFid(fid)).toBeDefined()
    expect(await getAppsCount()).toEqual(1)

    const data1 = (await supertestApp.post(`/v1/app/create`).send(postData)).body
    expect(data1).toEqual({ status: 'ok' })
    expect(await getAppsCount()).toEqual(1)
  })
})
