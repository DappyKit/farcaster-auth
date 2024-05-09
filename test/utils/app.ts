import { HDNodeWallet, Wallet } from 'ethers'
import { getConfigData, setConfigData } from '../../src/config'
import { upsertApp } from '../../src/db/app'
import { prepareEthAddress } from '../../src/utils/eth'

export interface IInitAppMock {
  authServiceWallet: HDNodeWallet | Wallet
  userMainWallet: HDNodeWallet
  userDelegatedWallet: HDNodeWallet
  appWallet: HDNodeWallet
  interactorFid: number
}

export async function insertMockedApp(
  mockInteractorCallback: (interactorFid: number, custodyAddress: string, frameUrl: string) => void,
): Promise<IInitAppMock> {
  const frameUrl = 'https://3rd-party-frame.com'
  const userMainWallet = Wallet.createRandom()
  const userDelegatedWallet = Wallet.createRandom()
  const appWallet = Wallet.createRandom()

  const signer = getConfigData().signer
  const authServiceWallet = signer ? new Wallet(signer) : Wallet.createRandom()
  const interactorFid = 123
  const appFid = 777
  setConfigData({ ...getConfigData(), authorizedFrameUrl: frameUrl, signer: authServiceWallet.privateKey })
  mockInteractorCallback(interactorFid, prepareEthAddress(userMainWallet.address), frameUrl)

  await upsertApp({
    fid: appFid,
    frame_url: frameUrl,
    signer_address: prepareEthAddress(appWallet.address),
    callback_url: '',
  })

  return {
    userMainWallet,
    userDelegatedWallet,
    appWallet,
    authServiceWallet,
    interactorFid,
  }
}
