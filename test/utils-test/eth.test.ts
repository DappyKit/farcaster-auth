import { isEthAddress } from '../../src/utils/eth'

describe('eth', () => {
  it('isEthAddress', async () => {
    expect(isEthAddress('0x123')).toBeFalsy()
    expect(isEthAddress('1f1cf52bcb17acab0e3222d535a94495d656650e')).toBeTruthy()
  })
})
