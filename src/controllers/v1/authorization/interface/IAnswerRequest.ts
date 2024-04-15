export interface IAnswerRequest {
  /**
   * Authorization request ID
   */
  requestId: number
  /**
   * Message signed by user as a proof of the answer
   */
  messageBytesProof: string
  /**
   * Answer to the challenge
   */
  answer: number
}
