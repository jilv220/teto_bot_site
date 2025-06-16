import { BunContext, BunRuntime } from '@effect/platform-bun'
import { Duration, Effect, Logger, Schedule } from 'effect'
import { appConfig } from '../config'
import { DailyResetService, DailyResetServiceLive } from '../dailyResetService'

import Queue from 'bull'

const createDailyResetQueue = Effect.gen(function* () {
  const config = yield* appConfig
  const queue = new Queue('daily reset worker', config.redisUrl)

  yield* Effect.logInfo('Creating daily reset queue')

  // Add finalizer for cleanup
  yield* Effect.addFinalizer(() =>
    Effect.gen(function* () {
      yield* Effect.logInfo('Closing daily reset queue')
      yield* Effect.promise(() => queue.close())
    })
  )

  return queue
})

const setupQueueProcessor = (queue: Queue.Queue) =>
  Effect.gen(function* () {
    yield* Effect.logInfo('Setting up queue processor')

    const task = Effect.gen(function* () {
      const dailyResetService = yield* DailyResetService
      const result = yield* dailyResetService
        .performDailyReset()
        .pipe(
          Effect.tap((result) =>
            Effect.logInfo('Daily reset completed', result)
          )
        )
      return result
    }).pipe(
      Effect.provide(DailyResetServiceLive),
      Effect.tapError((error) =>
        Effect.logError('Failed to process daily reset Service', error)
      )
    )

    queue.process(async (job, done) => {
      try {
        const result = await Effect.runPromise(
          task.pipe(Effect.provide(Logger.pretty))
        )
        done(null, result)
      } catch (error) {
        done(error instanceof Error ? error : new Error(String(error)))
      }
    })
  })

const cleanupAllJobs = (queue: Queue.Queue) =>
  Effect.gen(function* () {
    yield* Effect.logInfo('Starting complete cleanup of all jobs')

    // Remove ALL repeatable jobs
    const repeatableJobs = yield* Effect.promise(() =>
      queue.getRepeatableJobs()
    )
    yield* Effect.logInfo(
      `Found ${repeatableJobs.length} repeatable jobs to remove`
    )

    for (const job of repeatableJobs) {
      yield* Effect.gen(function* () {
        yield* Effect.logInfo(`Removing repeatable job: ${job.id || 'unnamed'}`)
        yield* Effect.promise(() => queue.removeRepeatableByKey(job.key))
      }).pipe(
        Effect.catchAll((error) =>
          Effect.logError(`Failed to remove repeatable job ${job.key}`, error)
        )
      )
    }

    // Clean ALL job states
    const states = ['completed', 'failed', 'active'] as const
    for (const state of states) {
      yield* Effect.gen(function* () {
        const cleaned = yield* Effect.promise(() => queue.clean(0, state))
        if (cleaned.length > 0) {
          yield* Effect.logInfo(`Cleaned ${cleaned.length} ${state} jobs`)
        }
      }).pipe(
        Effect.catchAll((error) =>
          Effect.logError(`Failed to clean ${state} jobs`, error)
        )
      )
    }

    // Also remove waiting and delayed jobs manually
    yield* Effect.gen(function* () {
      const waitingJobs = yield* Effect.promise(() => queue.getWaiting())
      const delayedJobs = yield* Effect.promise(() => queue.getDelayed())

      for (const job of [...waitingJobs, ...delayedJobs]) {
        yield* Effect.promise(() => job.remove())
      }

      if (waitingJobs.length > 0 || delayedJobs.length > 0) {
        yield* Effect.logInfo(
          `Removed ${waitingJobs.length} waiting and ${delayedJobs.length} delayed jobs`
        )
      }
    }).pipe(
      Effect.catchAll((error) =>
        Effect.logError('Failed to remove waiting/delayed jobs', error)
      )
    )

    yield* Effect.logInfo('Complete job cleanup finished - queue is now clean')
  })

const scheduleRepeatingJob = (queue: Queue.Queue) =>
  Effect.gen(function* () {
    yield* Effect.logInfo('Scheduling repeating daily reset job')

    const cronExpression = '0 0 * * *'
    const jobOptions = {
      repeat: { cron: cronExpression },
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    }

    const job = yield* Effect.promise(() => queue.add({}, jobOptions))

    yield* Effect.logInfo(`Daily reset job scheduled with ID: ${job.id}`)
    yield* Effect.logInfo(
      `Next run: ${cronExpression} (${new Date().toISOString()})`
    )
  })

const monitorQueueStatus = (queue: Queue.Queue) =>
  Effect.gen(function* () {
    const getQueueStatus = Effect.gen(function* () {
      const waiting = yield* Effect.promise(() => queue.getWaiting())
      const active = yield* Effect.promise(() => queue.getActive())
      const completed = yield* Effect.promise(() => queue.getCompleted())
      const failed = yield* Effect.promise(() => queue.getFailed())

      yield* Effect.logInfo(
        `Queue Status - Waiting: ${waiting.length}, Active: ${active.length}, Completed: ${completed.length}, Failed: ${failed.length}`
      )

      if (failed.length > 0) {
        yield* Effect.logInfo('Failed job details:')
        for (const [index, job] of failed.slice(0, 3).entries()) {
          yield* Effect.logInfo(
            `  ${index + 1}. Job ID: ${job.id}, Type: ${job.data.type || 'default'}, Error: ${job.failedReason}`
          )
        }
      }
    })

    const reportOnceEvery = 60 * 60 * 2
    yield* getQueueStatus.pipe(
      Effect.repeat(Schedule.fixed(Duration.seconds(reportOnceEvery))),
      Effect.fork
    )
  })

const initializeDailyResetQueue = Effect.gen(function* () {
  yield* Effect.logInfo('Initializing daily reset queue')

  const queue = yield* createDailyResetQueue

  yield* setupQueueProcessor(queue)
  yield* cleanupAllJobs(queue)
  yield* scheduleRepeatingJob(queue)
  yield* monitorQueueStatus(queue)

  yield* Effect.logInfo('Daily reset queue initialization completed')

  return queue
})

const main = Effect.gen(function* () {
  const queue = yield* initializeDailyResetQueue

  // Keep the app running
  yield* Effect.never
}).pipe(Effect.provide(BunContext.layer))

BunRuntime.runMain(Effect.scoped(main))
