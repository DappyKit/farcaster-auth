import { HDNodeWallet, Wallet } from 'ethers'
import { getConfigData, setConfigData } from '../../src/config'
import { upsertApp } from '../../src/db/app'
import { prepareEthAddress } from '../../src/utils/eth'

export interface IInitAppMock {
  authServiceWallet: HDNodeWallet | Wallet
  userWallet: HDNodeWallet
  appWallet: HDNodeWallet
  interactorFid: number
}

export async function insertMockedApp(
  mockInteractorCallback: (interactorFid: number, frameUrl: string) => void,
): Promise<IInitAppMock> {
  const frameUrl = 'https://3rd-party-frame.com'
  const userWallet = Wallet.createRandom()
  const appWallet = Wallet.createRandom()

  const signer = getConfigData().signer
  const authServiceWallet = signer ? new Wallet(signer) : Wallet.createRandom()
  const interactorFid = 123
  const appFid = 777
  setConfigData({ ...getConfigData(), authorizedFrameUrl: frameUrl, signer: authServiceWallet.privateKey })
  mockInteractorCallback(interactorFid, frameUrl)

  await upsertApp({
    fid: appFid,
    frame_url: frameUrl,
    signer_address: prepareEthAddress(appWallet.address),
    callback_url: '',
  })

  return {
    userWallet,
    appWallet,
    authServiceWallet,
    interactorFid,
  }
}
