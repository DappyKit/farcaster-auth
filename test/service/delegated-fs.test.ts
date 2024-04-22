import { DelegatedFs } from '../../src/service/delegated-fs/delegated-fs'
import { Wallet } from 'ethers'
import { createDecentralizedStorage, createLocalDataManager } from '../utils/storage'
import { runStressTest } from '../utils/stress-test'

describe('Delegated FS', () => {
  it('should build root hash and recover from it', async () => {
    await runStressTest(createLocalDataManager, createDecentralizedStorage)
  })

  it('should throw nonce error', async () => {
    const localDataManager = createLocalDataManager()
    const decentralizedStorage = createDecentralizedStorage()
    const authServiceWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()
    const userWallet = Wallet.createRandom()
    const userDelegatedWallet = Wallet.createRandom()
    const fs = new DelegatedFs(localDataManager, decentralizedStorage, authServiceWallet.address)

    const authServiceProofSignature = await DelegatedFs.createDelegateSignature(
      userWallet.address,
      userDelegatedWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    const data = 'hi'
    const nonce = 0
    await fs.setUserAppData(userWallet.address, data, {
      nonce,
      applicationAddress: applicationWallet.address,
      authServiceProof: authServiceProofSignature,
      applicationDelegateDataSignature: await DelegatedFs.getDataSignature(data, nonce, userDelegatedWallet),
    })

    await expect(
      fs.setUserAppData(userWallet.address, data, {
        nonce,
        applicationAddress: applicationWallet.address,
        authServiceProof: authServiceProofSignature,
        applicationDelegateDataSignature: await userDelegatedWallet.signMessage(`${nonce}${data}`),
      }),
    ).rejects.toThrow('Invalid nonce. Expected: 1')
  })

  it('should accept updates from a legitimate user and reject updates from a fake user', async () => {
    const localDataManager = createLocalDataManager()
    const decentralizedStorage = createDecentralizedStorage()
    const authServiceWallet = Wallet.createRandom()
    const fs = new DelegatedFs(localDataManager, decentralizedStorage, authServiceWallet.address)

    // Create legitimate and fake users
    const legitimateUserWallet = Wallet.createRandom()
    const fakeUserWallet = Wallet.createRandom()
    const applicationWallet = Wallet.createRandom()

    // First update from legitimate user
    const legitimateData = 'legitimate data update'
    const legitimateNonce = (await fs.getUserAppNonce(legitimateUserWallet.address, applicationWallet.address)) + 1
    const legitimateAuthServiceProofSignature = await DelegatedFs.createDelegateSignature(
      legitimateUserWallet.address,
      legitimateUserWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    await fs.setUserAppData(legitimateUserWallet.address, legitimateData, {
      nonce: legitimateNonce,
      applicationAddress: applicationWallet.address,
      authServiceProof: legitimateAuthServiceProofSignature,
      applicationDelegateDataSignature: await DelegatedFs.getDataSignature(
        legitimateData,
        legitimateNonce,
        legitimateUserWallet,
      ),
    })

    // Attempt to update from fake user
    const fakeData = 'fake data update'
    const fakeNonce = (await fs.getUserAppNonce(legitimateUserWallet.address, applicationWallet.address)) + 1
    const fakeAuthServiceProofSignature = await DelegatedFs.createDelegateSignature(
      fakeUserWallet.address,
      fakeUserWallet.address,
      applicationWallet.address,
      authServiceWallet,
    )

    await expect(
      fs.setUserAppData(legitimateUserWallet.address, fakeData, {
        nonce: fakeNonce,
        applicationAddress: applicationWallet.address,
        authServiceProof: fakeAuthServiceProofSignature,
        applicationDelegateDataSignature: await DelegatedFs.getDataSignature(fakeData, fakeNonce, fakeUserWallet),
      }),
    ).rejects.toThrow('Invalid auth service proof')
  })
})
