import knex from 'knex'
import configurations from '../../knexfile'
import { db } from '../../src/db'
import supertest from 'supertest'
import app from '../../src/app'
import { getInteractorInfo, InteractorInfo } from '../../src/utils/farcaster'
import { upsertApp } from '../../src/db/app'
import { ICreateAuthRequest } from '../../src/controllers/v1/authorization/interface/ICreateAuthRequest'
import { Wallet } from 'ethers'
import { prepareEthAddress } from '../../src/utils/eth'
import { ICreateResponse } from '../../src/controllers/v1/authorization/interface/ICreateResponse'
import { IAnswerRequest } from '../../src/controllers/v1/authorization/interface/IAnswerRequest'
import { IAnswerResponse } from '../../src/controllers/v1/authorization/interface/IAnswerResponse'
import { callbackFrameUrl, ICallbackResponse, ICallbackSuccessRequest } from '../../src/utils/http'
import { getConfigData, setConfigData } from '../../src/config'
import { AuthorizationRequestStatus, getAuthorizationRequestById } from '../../src/db/authorization-request'
import { extractSignerAddress, SIGNATURE_LENGTH_WITHOUT_0x } from '../../src/utils/crypto'

const testDb = knex(configurations.development)

jest.mock('../../src/utils/farcaster', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    getInteractorInfo: jest.fn().mockResolvedValue({}),
  }
})

jest.mock('../../src/utils/http', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    callbackFrameUrl: jest.fn().mockResolvedValue({}),
  }
})

const getInteractorInfoMock = getInteractorInfo as jest.Mock
const callbackFrameUrlMock = callbackFrameUrl as jest.Mock

function mockInteractorInfo(data: InteractorInfo) {
  getInteractorInfoMock.mockReturnValue(data)
}

function mockCallbackFrameUrl(data: ICallbackResponse) {
  callbackFrameUrlMock.mockReturnValue(data)
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

  it('should create authorization request', async () => {
    const frameUrl = 'https://3rd-party-frame.com'
    const serviceWallet = Wallet.createRandom()
    const userWallet = Wallet.createRandom()
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
      signer_address: prepareEthAddress(serviceWallet.address),
      callback_url: '',
    })
    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await serviceWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', answer: data.answer, requestId: data.requestId })
  })

  it('should answer to authorization request', async () => {
    mockCallbackFrameUrl({ success: true })
    const frameUrl = 'https://3rd-party-frame.com'
    const authServiceWallet = Wallet.createRandom()
    const appWallet = Wallet.createRandom()
    const userWallet = Wallet.createRandom()
    setConfigData({ ...getConfigData(), authorizedFrameUrl: frameUrl, signer: authServiceWallet.privateKey })
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
      signer_address: prepareEthAddress(appWallet.address),
      callback_url: '',
    })
    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await appWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', requestId: 1, answer: data.answer })

    const answerData1: IAnswerRequest = {
      requestId: data.requestId,
      messageBytesProof: '0x123',
      answer: data.answer,
    }
    expect(callbackFrameUrlMock).toHaveBeenCalledTimes(0)
    const answer1 = (await supertestApp.post(`/v1/authorization/answer`).send(answerData1)).body as IAnswerResponse
    expect(answer1.status).toBe('ok')
    expect(callbackFrameUrlMock).toHaveBeenCalledTimes(1)
    const callbackData = callbackFrameUrlMock.mock.calls[0][1] as ICallbackSuccessRequest
    expect(callbackData.userSignerAddress).toEqual(prepareEthAddress(userWallet.address))

    expect(extractSignerAddress(prepareEthAddress(userWallet.address), `0x${callbackData.proof}`)).toStrictEqual(
      prepareEthAddress(authServiceWallet.address),
    )

    callbackFrameUrlMock.mockReset()
    expect(callbackFrameUrlMock).toHaveBeenCalledTimes(0)
    const answer2 = (await supertestApp.post(`/v1/authorization/answer`).send(answerData1)).body as IAnswerResponse
    expect(answer2).toStrictEqual({ status: 'error', message: 'Authorization request not found' })
    expect(callbackFrameUrlMock).toHaveBeenCalledTimes(0)

    const authRequest = await getAuthorizationRequestById(data.requestId)
    expect(authRequest?.status).toBe(AuthorizationRequestStatus.ACCEPTED)
    expect(authRequest?.proof_signature).toHaveLength(SIGNATURE_LENGTH_WITHOUT_0x)
    expect(authRequest?.proof_signature).toStrictEqual(callbackData.proof)
    // todo check that the service can get the proof by some url
  })

  // todo when create new challenge for user - REJECT other challenges
})
