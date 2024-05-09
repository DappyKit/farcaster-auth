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
  // address w/o 0x, lowercased
  const signerAddress = process.env.TEST_SIGNER_ADDRESS
  const userMainSigner = process.env.TEST_USER_MAIN_SIGNER
  const targetUserId = 354669

  if (!frameUrl || !callbackUrl || !signerAddress || !userMainSigner) {
    throw new Error('Please provide all required env variables')
  }

  await upsertApp({
    fid: 1,
    frame_url: frameUrl,
    callback_url: callbackUrl,
    signer_address: signerAddress,
    is_active: true,
  })

  await rejectAllPendingAuthorizationRequests(targetUserId, signerAddress)
  const challenge = createChallenge()
  const userSigner = Wallet.createRandom()
  await insertAuthorizationRequest({
    app_signer_address: signerAddress,
    user_fid: targetUserId,
    status: AuthorizationRequestStatus.PENDING,
    challenge: challenge.serialized,
    user_main_address: prepareEthAddress(userMainSigner),
    user_delegated_address: prepareEthAddress(userSigner.address),
    service_signature: '',
  })

  process.exit(0)
}

start().then()
