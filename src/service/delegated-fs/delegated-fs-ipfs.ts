import { IDecentralizedStorage } from './interfaces'
import PinataClient from '@pinata/sdk'

export class DelegatedFsIpfs implements IDecentralizedStorage {
  private client: PinataClient
  constructor(
    private pinataJWTKey: string,
    private ipfsUrl: string,
  ) {
    this.client = new PinataClient({ pinataJWTKey: this.pinataJWTKey })
  }

  async downloadData(hash: string): Promise<string> {
    const url = new URL(hash, this.ipfsUrl).toString()

    return (await fetch(url)).text()
  }

  async uploadData(key: string, data: string): Promise<string> {
    const result = await this.client.pinJSONToIPFS(JSON.parse(data))

    return result.IpfsHash
  }
}
