import { lt } from 'drizzle-orm'
import { Console, Context, Effect, Layer } from 'effect'
import { users } from '../db'
import { UserRepository, UserRepositoryLive } from '../repositories/user'
import {
  UserGuildRepository,
  UserGuildRepositoryLive,
} from '../repositories/userGuild'
import { appConfig } from './config'
import { Database, DatabaseError, DatabaseLive } from './database'

export class DailyResetServiceError extends DatabaseError {}

export class DailyResetService extends Context.Tag('DailyResetService')<
  DailyResetService,
  {
    performDailyReset: () => Effect.Effect<
      { creditCount: number; resetCount: number },
      DailyResetServiceError
    >
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database
  const userRepository = yield* UserRepository
  const userGuildRepository = yield* UserGuildRepository

  const config = yield* appConfig

  const refillAllCredits = Effect.gen(function* () {
    yield* Effect.logInfo(
      'DailyResetService: Refilling message credits for users below the daily cap'
    )

    const refillCap = BigInt(config.dailyCreditRefillCap)

    // Find all users with credits below the refill cap
    const usersNeedingRefill = yield* Effect.tryPromise({
      try: () =>
        db.select().from(users).where(lt(users.messageCredits, refillCap)),
      catch: (error) =>
        new DailyResetServiceError({
          message: `Failed to fetch users needing credit refill: ${error}`,
        }),
    })

    yield* Effect.logInfo(
      `Found ${usersNeedingRefill.length} users needing credit refill`
    )

    let creditCount = 0

    // Process users in batches to avoid overwhelming the database
    for (const user of usersNeedingRefill) {
      const updateResult = yield* Effect.gen(function* () {
        yield* userRepository.update(user.userId, {
          messageCredits: refillCap,
        })
        return Effect.succeed(1)
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Console.error(
              `Failed to refill credits for user ${user.userId}: ${error.message}`
            )
            return Effect.succeed(0)
          })
        )
      )

      creditCount += yield* updateResult
    }

    return { creditCount }
  })

  const resetAllDailyMetrics = Effect.gen(function* () {
    yield* Effect.logInfo(
      'DailyResetService: Resetting daily message counts and feed cooldowns'
    )

    // Find all user guilds that need reset (daily_message_count > 0 or last_feed is not null)
    const userGuildsNeedingReset =
      yield* userGuildRepository.findAllWithResetNeeded()

    yield* Effect.logInfo(
      `Found ${userGuildsNeedingReset.length} user guilds needing daily metrics reset`
    )

    let resetCount = 0

    // Process user guilds in batches
    for (const userGuild of userGuildsNeedingReset) {
      const resetResult = yield* Effect.gen(function* () {
        yield* userGuildRepository.resetDailyMetrics(
          userGuild.userId,
          userGuild.guildId
        )
        return Effect.succeed(1)
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Console.error(
              `Failed to reset daily metrics for user ${userGuild.userId} in guild ${userGuild.guildId}: ${error.message}`
            )
            return Effect.succeed(0)
          })
        )
      )

      resetCount += yield* resetResult
    }

    return { resetCount }
  })

  return DailyResetService.of({
    performDailyReset: () =>
      Effect.gen(function* () {
        yield* Effect.logInfo(
          'DailyResetService: Starting daily credit refill and metric reset'
        )

        const startTime = Date.now()

        const { creditCount } = yield* refillAllCredits
        const { resetCount } = yield* resetAllDailyMetrics

        const endTime = Date.now()
        const duration = endTime - startTime

        yield* Effect.logInfo(
          `DailyResetService: Successfully refilled ${creditCount} users and reset ${resetCount} daily metrics in ${duration}ms`
        )

        return { creditCount, resetCount }
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Console.error(
              `DailyResetService: Failed to complete daily reset. Reason: ${error.message}`
            )
            return yield* Effect.fail(
              new DailyResetServiceError({
                message: `Daily reset failed: ${error.message}`,
              })
            )
          })
        )
      ),
  })
})

export const DailyResetServiceLive = Layer.effect(DailyResetService, make).pipe(
  Layer.provide(UserRepositoryLive),
  Layer.provide(UserGuildRepositoryLive),
  Layer.provide(DatabaseLive)
)
