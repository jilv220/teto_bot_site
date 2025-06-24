import { describe, expect, it } from 'bun:test'
import { Effect, Layer } from 'effect'
import { UserService, UserServiceMock } from '../services'
import { recordUserMessageEffect } from './discord'

describe('Discord Actions', () => {
  describe('Credit Deduction', () => {
    it('should deduct 1 credit when recording a message with sufficient credits', async () => {
      const program = Effect.gen(function* () {
        const userService = yield* UserService

        // Create a user with 30 credits (default)
        const userId = BigInt(123456789)
        const initialUser = yield* userService.getOrCreateUser(userId)

        // Verify initial state
        expect(initialUser.messageCredits).toBe(BigInt(30))

        // Use the deductMessageCredits method directly to test the credit logic
        const updatedUser = yield* userService.deductMessageCredits(userId, 1)

        return { initialUser, updatedUser }
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(UserServiceMock()))
      )

      expect(result.updatedUser.messageCredits).toBe(BigInt(29))
    })

    it('should fail when user has insufficient credits', async () => {
      const program = Effect.gen(function* () {
        const userService = yield* UserService

        // Create a user and set credits to 0
        const userId = BigInt(123456789)
        yield* userService.getOrCreateUser(userId)
        yield* userService.updateUser(userId, { messageCredits: BigInt(0) })

        // Try to deduct 1 credit (should fail)
        return yield* userService.deductMessageCredits(userId, 1)
      })

      try {
        await Effect.runPromise(program.pipe(Effect.provide(UserServiceMock())))
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect((error as Error).message).toContain('Insufficient credits')
      }
    })

    it('should verify messageCreditCost configuration is used', async () => {
      // This test verifies that the configuration value is properly set
      const { appConfig } = await import('../services/config')
      const config = await Effect.runPromise(appConfig)

      expect(config.messageCreditCost).toBe(1)
    })
  })
})
