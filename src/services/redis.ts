import { Effect } from 'effect'
import Redis from 'ioredis'
import { appConfig } from './config'

const LLM_SYS_PROMPT_KEY = 'llm_sys_prompt'

export class RedisService extends Effect.Service<RedisService>()(
  'RedisService',
  {
    effect: Effect.gen(function* () {
      const config = yield* appConfig
      const redis = new Redis(config.redisUrl)

      const getSystemPrompt = () =>
        Effect.gen(function* () {
          const prompt = yield* Effect.promise(() =>
            redis.get(LLM_SYS_PROMPT_KEY)
          )
          return prompt
        })

      const setSystemPrompt = (prompt: string) =>
        Effect.gen(function* () {
          yield* Effect.promise(() => redis.set(LLM_SYS_PROMPT_KEY, prompt))
          return true
        })

      const close = () =>
        Effect.gen(function* () {
          yield* Effect.promise(() => redis.quit())
        })

      // Add finalizer for cleanup
      yield* Effect.addFinalizer(() => close())

      return {
        getSystemPrompt,
        setSystemPrompt,
        close,
      } as const
    }),
  }
) {}

export const RedisServiceLive = RedisService.Default
