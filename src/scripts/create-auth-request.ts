import { loadConfig } from '../config'
import { upsertApp } from '../db/app'
import {
  AuthorizationRequestStatus,
  createChallenge,
  insertAuthorizationRequest,
  rejectAllPendingAuthorizationRequests,
} from '../db/authorization-request'
import { Wallet } from 'ethers'
import { prepareEthAddress } from '../utils/eth'

async function start() {
  loadConfig()

  const frameUrl = process.env.TEST_FRAME_URL
  const callbackUrl = process.env.TEST_CALLBACK_URL
  // address w/o 0x lowercased
  const signerAddress = process.env.TEST_SIGNER_ADDRESS
  const frameOwnerId = Number(process.env.TEST_FRAME_OWNER_ID) || 1
  const targetUserId = 354669

  if (!frameUrl || !callbackUrl || !signerAddress) {
    throw new Error('Please provide all required env variables')
  }

  await upsertApp({
    fid: frameOwnerId,
    username: '[TEST Username]',
    display_name: '[Test Name]',
    profile_image: 'https://test.com/test.png',
    frame_url: frameUrl,
    callback_url: callbackUrl,
    signer_address: signerAddress,
    is_active: true,
  })

  await rejectAllPendingAuthorizationRequests(targetUserId, frameOwnerId)
  const challenge = createChallenge()
  const userSigner = Wallet.createRandom()
  await insertAuthorizationRequest({
    app_fid: frameOwnerId,
    user_fid: targetUserId,
    status: AuthorizationRequestStatus.PENDING,
    challenge: challenge.serialized,
    user_signer_address: prepareEthAddress(userSigner.address),
    service_signature: '',
  })

  process.exit(0)
}

start().then()
