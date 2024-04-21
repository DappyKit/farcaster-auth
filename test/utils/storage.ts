import { IDecentralizedStorage } from '../../src/service/delegated-fs/interfaces'

export function createDecentralizedStorage(): IDecentralizedStorage {
  let counter = 1
  const dataItems: { [key: string]: string } = {}

  return {
    uploadData: jest.fn(async (key: string, data: string): Promise<string> => {
      const result = counter.toString()
      counter++
      dataItems[result] = data

      return result
    }),

    downloadData: jest.fn(async (hash: string): Promise<string> => {
      return dataItems[hash] ?? ''
    }),
  }
}
