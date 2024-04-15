import {
  createChallenge,
  IChallengeObject,
  MAX_CHALLENGE_NUMBER,
  MIN_CHALLENGE_NUMBER,
} from '../../src/db/authorization-request'

describe('Authorization Request', () => {
  it('createChallenge', async () => {
    for (let i = 0; i < 100; i++) {
      const challenge = createChallenge()
      const challengeObject = JSON.parse(challenge.serialized) as IChallengeObject
      expect(challengeObject.correct).toBe(challenge.answer)
      expect(challengeObject.correct).toBeGreaterThanOrEqual(MIN_CHALLENGE_NUMBER)
      expect(challengeObject.correct).toBeLessThanOrEqual(MAX_CHALLENGE_NUMBER)
      expect(challengeObject.options).toHaveLength(3)
      expect(challengeObject.options).toContain(challengeObject.correct)

      for (const option of challengeObject.options) {
        expect(option).toBeGreaterThanOrEqual(MIN_CHALLENGE_NUMBER)
        expect(option).toBeLessThanOrEqual(MAX_CHALLENGE_NUMBER)
      }
    }
  })
})
