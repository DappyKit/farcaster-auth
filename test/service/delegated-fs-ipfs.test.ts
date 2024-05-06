import { DelegatedFsIpfs } from '../../src/service/delegated-fs/delegated-fs-ipfs'
import { getConfigData, loadConfig } from '../../src/config'
import { runStressTest } from '../utils/stress-test'
import { createLocalDataManager } from '../utils/storage'

loadConfig()

export function createDecentralizedStorage() {
  const { pinataJWT, ipfsUrl } = getConfigData()

  const manager = new DelegatedFsIpfs(pinataJWT, ipfsUrl)
  const props = Object.getOwnPropertyNames(DelegatedFsIpfs.prototype)
  props.forEach(prop => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof manager[prop] === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      manager[prop] = jest.fn(manager[prop].bind(manager))
    }
  })

  return manager
}

describe('Delegated FS MySQL', () => {
  it('should upload and download data', async () => {
    const { pinataJWT, ipfsUrl } = getConfigData()
    const ipfs = new DelegatedFsIpfs(pinataJWT, ipfsUrl)
    const data = JSON.stringify({ data: Math.random().toString() })
    const hash = await ipfs.uploadData('', data)
    expect(await ipfs.downloadData(hash)).toEqual(data)
  })

  it('should pass stress test', async () => {
    await runStressTest(createLocalDataManager, createDecentralizedStorage, {
      usersCount: 3,
      applicationsCount: 2,
      operationsCount: 2,
    })
  }, 300000)
})
