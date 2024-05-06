import { DelegatedFs } from '../service/delegated-fs/delegated-fs'
import { DelegatedFsMySQL } from '../service/delegated-fs/delegated-fs-mysql'
import { DelegatedFsIpfs } from '../service/delegated-fs/delegated-fs-ipfs'
import { getConfigData, loadConfig } from '../config'
import { Wallet } from 'ethers'

loadConfig()
const { signer, pinataJWT, ipfsUrl } = getConfigData()
const delegatedFsDataManager = new DelegatedFsMySQL()
const delegatedFsStorage = new DelegatedFsIpfs(pinataJWT, ipfsUrl)
const authServiceWallet = new Wallet(signer)

export const delegatedFs = new DelegatedFs(delegatedFsDataManager, delegatedFsStorage, authServiceWallet.address)
