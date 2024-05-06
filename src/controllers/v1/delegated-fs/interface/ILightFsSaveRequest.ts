import { IStoredData } from '../../../../service/delegated-fs/interfaces'

export type ILightFsSaveRequest = IStoredData & { userAddress: string }
