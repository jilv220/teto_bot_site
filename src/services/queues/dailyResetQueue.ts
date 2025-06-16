import Queue from 'bull'
import { Effect } from 'effect'
import { appConfig } from '../config'
import { DailyResetService, DailyResetServiceLive } from '../dailyResetService'

const createDailyResetQueue = Effect.gen(function* () {
  const config = yield* appConfig
  return new Queue('daily reset worker', config.redisUrl)
})

const queue = await Effect.runPromise(createDailyResetQueue)

queue.process(async (job, done) => {
  try {
    console.log('Processing daily reset job:', job.id)

    const task = Effect.gen(function* () {
      const dailyResetService = yield* DailyResetService
      return Effect.runPromise(dailyResetService.performDailyReset())
    }).pipe(Effect.provide(DailyResetServiceLive))
    const result = await Effect.runPromise(task)

    console.log('Daily reset completed:', result)
    done(null, result)
  } catch (error) {
    console.error('Daily reset failed:', error)
    done(error instanceof Error ? error : new Error(String(error)))
  }
})

// Every day at 00:00 UTC
const cronExpression = '0 0 * * *'
queue.add(
  {},
  {
    repeat: { cron: cronExpression },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 5, // Keep last 5 completed jobs
    removeOnFail: 10, // Keep last 10 failed jobs
  }
)
