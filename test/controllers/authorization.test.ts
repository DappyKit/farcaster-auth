import knex from 'knex'
import configurations from '../../knexfile'
import { db } from '../../src/db'
import supertest from 'supertest'
import app from '../../src/app'
import { getInteractorInfo, InteractorInfo } from '../../src/utils/farcaster'
import { upsertApp } from '../../src/db/app'
import { ICreateAuthRequest } from '../../src/controllers/v1/authorization/interface/ICreateAuthRequest'

const testDb = knex(configurations.development)

jest.mock('../../src/utils/farcaster', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    getInteractorInfo: jest.fn().mockResolvedValue({}),
  }
})

const getInteractorInfoMock = getInteractorInfo as jest.Mock

function mockInteractorInfo(data: InteractorInfo) {
  getInteractorInfoMock.mockReturnValue(data)
}

describe('Authorization', () => {
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

  it('should create authorization', async () => {
    const frameUrl = 'https://3rd-party-frame.com'

    const interactorFid = 123
    const appFid = 777
    mockInteractorInfo({
      isValid: true,
      fid: interactorFid,
      username: '',
      display_name: '',
      pfp_url: '',
      inputValue: '',
      url: frameUrl,
      timestamp: new Date().toISOString(),
    })

    await upsertApp({
      fid: appFid,
      username: '',
      display_name: '',
      profile_image: '',
      frame_url: frameUrl,
      callback_url: '',
    })
    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
    }
    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body
    expect(data).toEqual({ status: 'ok' })
  })
})
