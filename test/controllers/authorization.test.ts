import knex from 'knex'
import configurations from '../../knexfile'
import { db } from '../../src/db'
import supertest from 'supertest'
import app from '../../src/app'
import { getInteractorInfo } from '../../src/utils/farcaster'
import { ICreateAuthRequest } from '../../src/controllers/v1/authorization/interface/ICreateAuthRequest'
import { prepareEthAddress } from '../../src/utils/eth'
import { ICreateResponse } from '../../src/controllers/v1/authorization/interface/ICreateResponse'
import { IAnswerRequest } from '../../src/controllers/v1/authorization/interface/IAnswerRequest'
import { IAnswerResponse } from '../../src/controllers/v1/authorization/interface/IAnswerResponse'
import { callbackFrameUrl, ICallbackResponse, ICallbackSuccessRequest } from '../../src/utils/http'
import { AuthorizationRequestStatus, getAuthorizationRequestById } from '../../src/db/authorization-request'
import { extractSignerAddress, SIGNATURE_LENGTH_WITHOUT_0x } from '../../src/utils/crypto'
import { IListRequest } from '../../src/controllers/v1/authorization/interface/IListRequest'
import { IListResponse } from '../../src/controllers/v1/authorization/interface/IListResponse'
import { IIsAuthorizedRequest } from '../../src/controllers/v1/authorization/interface/IIsAuthorizedRequest'
import { IIsAuthorizedResponse } from '../../src/controllers/v1/authorization/interface/IIsAuthorizedResponse'
import { insertMockedApp } from '../utils/app'

const testDb = knex(configurations.development)

jest.mock('../../src/utils/http', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    callbackFrameUrl: jest.fn().mockResolvedValue({}),
  }
})

jest.mock('../../src/utils/farcaster', () => {
  const originalModule = jest.requireActual('../../src/utils/farcaster')

  return {
    ...originalModule,
    getInteractorInfo: jest.fn().mockResolvedValue({}),
  }
})

const callbackFrameUrlMock = callbackFrameUrl as jest.Mock

function mockCallbackFrameUrl(data: ICallbackResponse) {
  callbackFrameUrlMock.mockReturnValue(data)
}

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
    const { userWallet, appWallet } = await insertMockedApp(mockInteractor)

    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await appWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', answer: data.answer, requestId: data.requestId })
  })

  it('should answer to authorization request', async () => {
    mockCallbackFrameUrl({ success: true })
    const { userWallet, appWallet, authServiceWallet } = await insertMockedApp(mockInteractor)
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
  })

  it('should return active authorization request', async () => {
    const { userWallet, appWallet } = await insertMockedApp(mockInteractor)

    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await appWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const postDataList: IListRequest = {
      messageBytesProof: '0x123',
    }

    const listResponse0 = (await supertestApp.post(`/v1/authorization/list`).send(postDataList)).body as IListResponse
    expect(listResponse0).toStrictEqual({ status: 'error', message: 'No active authorization request found' })

    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', answer: data.answer, requestId: data.requestId })

    const listResponse1 = (await supertestApp.post(`/v1/authorization/list`).send(postDataList)).body as IListResponse
    expect(listResponse1.requestId).toBe(data.requestId)
  })

  it('should reject authorization request', async () => {
    const { userWallet, appWallet } = await insertMockedApp(mockInteractor)
    const createData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await appWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const postData: IListRequest = {
      messageBytesProof: '0x123',
    }

    const listResponse0 = (await supertestApp.post(`/v1/authorization/list`).send(postData)).body as IListResponse
    expect(listResponse0).toStrictEqual({ status: 'error', message: 'No active authorization request found' })

    const data = (await supertestApp.post(`/v1/authorization/create`).send(createData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', answer: data.answer, requestId: data.requestId })

    const listResponse1 = (await supertestApp.post(`/v1/authorization/list`).send(postData)).body as IListResponse
    expect(listResponse1.requestId).toBe(data.requestId)

    const rejectResponse = (await supertestApp.post(`/v1/authorization/reject`).send(postData)).body as ICreateResponse
    expect(rejectResponse).toStrictEqual({ status: 'ok' })

    const listResponse2 = (await supertestApp.post(`/v1/authorization/list`).send(postData)).body as IListResponse
    expect(listResponse2).toStrictEqual({ status: 'error', message: 'No active authorization request found' })
  })

  it('should return correct status of the user', async () => {
    mockCallbackFrameUrl({ success: true })
    const { userWallet, appWallet, authServiceWallet, interactorFid } = await insertMockedApp(mockInteractor)

    const isAuthorizedData: IIsAuthorizedRequest = {
      fid: interactorFid,
      appSignerAddress: appWallet.address,
    }
    const userStatus1 = (await supertestApp.post(`/v1/authorization/is-authorized`).send(isAuthorizedData))
      .body as IIsAuthorizedResponse
    expect(userStatus1).toStrictEqual({ status: 'not-authorized', isAuthorized: false })

    const postData: ICreateAuthRequest = {
      messageBytesProof: '0x123',
      userSignerAddress: userWallet.address,
      serviceSignature: await appWallet.signMessage(prepareEthAddress(userWallet.address)),
    }
    const data = (await supertestApp.post(`/v1/authorization/create`).send(postData)).body as ICreateResponse
    expect(data).toEqual({ status: 'ok', requestId: 1, answer: data.answer })

    const userStatus2 = (await supertestApp.post(`/v1/authorization/is-authorized`).send(isAuthorizedData))
      .body as IIsAuthorizedResponse
    expect(userStatus2).toStrictEqual({ status: 'not-authorized', isAuthorized: false })

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

    const userStatus3 = (await supertestApp.post(`/v1/authorization/is-authorized`).send(isAuthorizedData))
      .body as IIsAuthorizedResponse
    expect(userStatus3).toStrictEqual({ status: 'ok', isAuthorized: true })
  })
})
