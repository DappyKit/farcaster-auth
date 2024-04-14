import { db } from './index'
import { formatDate } from './utils'

export const TABLE_NAME = 'authorization_request'
export const EXPIRATION_TIME_MINUTES = 2

export enum AuthorizationRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface IAuthorizationRequest {
  id: number
  app_fid: number
  user_fid: number
  status: AuthorizationRequestStatus
  challenge: string
  created_at: string
  updated_at: string
  valid_until: string
}

export function createChallenge(): string {
  const options = [1, 2, 3].map(() => Math.floor(Math.random() * 100) + 1)
  const correct = Math.floor(Math.random() * options.length) + 1

  return JSON.stringify({ options, correct })
}

export function checkChallenge(challenge: string, answer: number): boolean {
  const { options, correct } = JSON.parse(challenge)

  return options[correct - 1] === answer
}

export async function insertAuthorizationRequest(
  authorizationRequestData: Omit<IAuthorizationRequest, 'id' | 'created_at' | 'updated_at' | 'valid_until'>,
  validUntil?: string,
): Promise<void> {
  const date = db.fn.now()

  if (!validUntil) {
    const date = new Date()
    date.setMinutes(date.getMinutes() + EXPIRATION_TIME_MINUTES)
    validUntil = formatDate(date)
  }
  const newItem = { ...authorizationRequestData, updated_at: date, valid_until: validUntil }

  await db(TABLE_NAME).insert({ ...newItem, created_at: date })
}
