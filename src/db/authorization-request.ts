import { db } from './index'
import { formatDate } from './utils'

export const TABLE_NAME = 'authorization_request'
export const EXPIRATION_TIME_MINUTES = 2
export const MIN_CHALLENGE_NUMBER = 1
export const MAX_CHALLENGE_NUMBER = 100

export enum AuthorizationRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  INCORRECT = 'incorrect',
}

export interface IAuthorizationRequest {
  id: number
  app_signer_address: string
  user_fid: number
  status: AuthorizationRequestStatus
  /**
   * Challenge for the user to choose the correct answer.
   */
  challenge: string
  /**
   * The address that controls the user's FID.
   */
  user_main_address: string
  /**
   * Signer created by 3rd party service for the user.
   */
  user_delegated_address: string
  /**
   * Signature of the user's address created by the 3rd party service. To verify that service initiated the request.
   */
  service_signature: string
  /**
   * Signature of the Auth service after user has passed the challenge. Proof required to make action on the user's behalf.
   */
  proof_signature?: string
  created_at: string
  updated_at: string
  valid_until: string
}

export interface IChallengeObject {
  options: number[]
  correct: number
}

export interface IChallengeData {
  serialized: string
  answer: number
}

export function createChallenge(): IChallengeData {
  const options = [1, 2, 3].map(() => Math.floor(Math.random() * MAX_CHALLENGE_NUMBER) + MIN_CHALLENGE_NUMBER)
  const correct = Math.floor(Math.random() * options.length)
  const object: IChallengeObject = { options, correct: options[correct] }

  return {
    serialized: JSON.stringify(object),
    answer: object.correct,
  }
}

export function getChallengeOptions(challenge: string): number[] {
  const { options } = JSON.parse(challenge)

  return options
}

export function checkChallenge(challenge: string, answer: number): boolean {
  const { correct } = JSON.parse(challenge)

  return correct === answer
}

export async function rejectAllPendingAuthorizationRequests(userFid: number, appSignerAddress: string): Promise<void> {
  await db(TABLE_NAME)
    .where({ user_fid: userFid, app_signer_address: appSignerAddress })
    .whereIn('status', [AuthorizationRequestStatus.PENDING])
    .update({ status: AuthorizationRequestStatus.REJECTED, updated_at: db.fn.now() })
}

export async function getActiveAuthorizationRequestByUser(userFid: number): Promise<IAuthorizationRequest | undefined> {
  return db<IAuthorizationRequest>(TABLE_NAME)
    .where({ user_fid: userFid })
    .whereIn('status', [AuthorizationRequestStatus.PENDING])
    .orderBy('id', 'desc')
    .first()
}

export async function getAuthorizationRequestById(id: number): Promise<IAuthorizationRequest | undefined> {
  return db<IAuthorizationRequest>(TABLE_NAME).where({ id }).first()
}

export async function getAuthorizationRequestByIdStatus(
  id: number,
  status: AuthorizationRequestStatus,
): Promise<IAuthorizationRequest | undefined> {
  return db<IAuthorizationRequest>(TABLE_NAME).where({ id, status }).first()
}

export async function updateAuthorizationRequestStatus(id: number, status: AuthorizationRequestStatus): Promise<void> {
  await db(TABLE_NAME).where({ id }).update({ status, updated_at: db.fn.now() })
}

export async function findAncCheckChallenge(id: number, answer: number): Promise<boolean> {
  const item = await db<IAuthorizationRequest>(TABLE_NAME)
    .where({ id, status: AuthorizationRequestStatus.PENDING })
    .first()

  if (!item) {
    throw new Error('Authorization request not found')
  }

  return checkChallenge(item.challenge, answer)
}

export async function setProofSignature(requestId: number, proofSignature: string): Promise<void> {
  await db(TABLE_NAME).where({ id: requestId }).update({ proof_signature: proofSignature, updated_at: db.fn.now() })
}

export async function findSuccessfulRequest(
  userFid: number,
  appSignerAddress: string,
): Promise<IAuthorizationRequest | undefined> {
  return db<IAuthorizationRequest>(TABLE_NAME)
    .where({ user_fid: userFid, app_signer_address: appSignerAddress, status: AuthorizationRequestStatus.ACCEPTED })
    .orderBy('id', 'desc')
    .first()
}

export async function findSuccessfulRequestByAddresses(
  userAddress: string,
  appSignerAddress: string,
): Promise<IAuthorizationRequest | undefined> {
  return db<IAuthorizationRequest>(TABLE_NAME)
    .where({
      user_main_address: userAddress,
      app_signer_address: appSignerAddress,
      status: AuthorizationRequestStatus.ACCEPTED,
    })
    .orderBy('id', 'desc')
    .first()
}

export async function insertAuthorizationRequest(
  authorizationRequestData: Omit<IAuthorizationRequest, 'id' | 'created_at' | 'updated_at' | 'valid_until'>,
  validUntil?: string,
): Promise<number> {
  const date = db.fn.now()

  if (!validUntil) {
    const date = new Date()
    date.setMinutes(date.getMinutes() + EXPIRATION_TIME_MINUTES)
    validUntil = formatDate(date)
  }
  const newItem = { ...authorizationRequestData, updated_at: date, valid_until: validUntil }

  const [id] = await db(TABLE_NAME).insert({ ...newItem, created_at: date })

  return id
}
