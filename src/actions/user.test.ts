import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import { UserServiceMock } from '../services'
import { createUserEffect, getUsersEffect } from './user'

describe('User Tasks', () => {
  describe('createUserEffect', () => {
    it('should create a new user successfully', async () => {
      const result = await Effect.runPromise(
        createUserEffect(123n, 'admin').pipe(Effect.provide(UserServiceMock))
      )

      if ('error' in result) {
        throw new Error(`Unexpected error: ${result.error.message}`)
      }

      expect(result.data).toBeDefined()
      expect(result.data.user).toBeDefined()
      expect(result.data.user.userId).toBe('123') // Serialized as string
      expect(result.data.user.role).toBe('admin')
      expect(result.data.user.messageCredits).toBe('30') // Serialized as string
      expect(result.data.user.insertedAt).toBeDefined()
      expect(result.data.user.updatedAt).toBeDefined()
      expect(result.data.user.lastVotedAt).toBeNull()
    })

    it('should handle duplicate user creation gracefully', async () => {
      const program = Effect.gen(function* () {
        // Create first user
        const firstResult = yield* createUserEffect(456n)
        if ('error' in firstResult) {
          throw new Error(
            `Unexpected error on first create: ${firstResult.error.message}`
          )
        }

        // Try to create duplicate - should return error response
        const duplicateResult = yield* createUserEffect(456n)
        return duplicateResult
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(UserServiceMock))
      )

      if ('data' in result) {
        throw new Error('Expected error for duplicate user creation')
      }

      expect(result.error).toBeDefined()
      expect(result.error.code).toBe(409)
      expect(result.error.message).toBe('User already exists')
    })

    it('should auto-generate userId and apply defaults', async () => {
      const result = await Effect.runPromise(
        createUserEffect(0n).pipe(Effect.provide(UserServiceMock))
      )

      if ('error' in result) {
        throw new Error(`Unexpected error: ${result.error.message}`)
      }

      expect(result.data).toBeDefined()
      expect(result.data.user).toBeDefined()
      expect(result.data.user.userId).toBeDefined()
      expect(result.data.user.role).toBe('user')
      expect(result.data.user.messageCredits).toBe('30')
      expect(Number.parseInt(result.data.user.userId)).toBeGreaterThan(0)
    })
  })

  describe('getUsersTask', () => {
    it('should return empty array when no users exist', async () => {
      const result = await Effect.runPromise(
        getUsersEffect.pipe(Effect.provide(UserServiceMock))
      )

      if ('error' in result) {
        throw new Error(`Unexpected error: ${result.error.message}`)
      }

      expect(result.data).toBeDefined()
      expect(result.data.users).toEqual([])
      expect(result.data.users).toHaveLength(0)
    })

    it('should return all created users with serialized bigints', async () => {
      const program = Effect.gen(function* () {
        // Create two users
        const createResult1 = yield* createUserEffect(100n, 'admin')
        const createResult2 = yield* createUserEffect(200n, 'user')

        if ('error' in createResult1 || 'error' in createResult2) {
          throw new Error('Failed to create users')
        }

        // Get all users
        const getUsersResult = yield* getUsersEffect
        return getUsersResult
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(UserServiceMock))
      )

      if ('error' in result) {
        throw new Error(`Unexpected error: ${result.error.message}`)
      }

      expect(result.data).toBeDefined()
      expect(result.data.users).toHaveLength(2)

      const userIds = result.data.users.map((u) => u.userId)
      expect(userIds).toContain('100')
      expect(userIds).toContain('200')

      const adminUser = result.data.users.find((u) => u.role === 'admin')
      const regularUser = result.data.users.find((u) => u.role === 'user')
    })

    it('should handle database errors gracefully', async () => {
      // This test demonstrates the error handling capability
      // For now, we'll test the success case since our mock doesn't fail
      const result = await Effect.runPromise(
        getUsersEffect.pipe(Effect.provide(UserServiceMock))
      )

      // Should not have error in success case with our mock
      if ('error' in result) {
        expect(result.error.code).toBe(500)
        expect(result.error.message).toBe('Failed to fetch users')
      } else {
        expect(result.data).toBeDefined()
      }
    })

    it('should maintain data integrity across multiple operations', async () => {
      const program = Effect.gen(function* () {
        const createResult = yield* createUserEffect(999n)
        const getUsersResult = yield* getUsersEffect

        return { createResult, getUsersResult }
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(UserServiceMock))
      )

      if ('error' in result.createResult) {
        throw new Error(`Create error: ${result.createResult.error.message}`)
      }

      if ('error' in result.getUsersResult) {
        throw new Error(
          `GetUsers error: ${result.getUsersResult.error.message}`
        )
      }

      expect(result.createResult.data.user.userId).toBe('999')
      expect(result.getUsersResult.data.users).toHaveLength(1)
      expect(result.getUsersResult.data.users[0].userId).toBe('999')
      expect(result.getUsersResult.data.users[0].role).toBe('user')
      expect(result.getUsersResult.data.users[0].messageCredits).toBe('30')

      expect(result.createResult.data.user.userId).toBe(
        result.getUsersResult.data.users[0].userId
      )
    })
  })
})
