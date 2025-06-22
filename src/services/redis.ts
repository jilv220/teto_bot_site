import { Effect } from 'effect'
import { appConfig } from './config'

import Redis from 'ioredis'

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

      // Generic Redis operations
      const get = (key: string) => Effect.promise(() => redis.get(key))

      const set = (key: string, value: string) =>
        Effect.promise(() => redis.set(key, value))

      const del = (key: string) => Effect.promise(() => redis.del(key))

      const exists = (key: string) => Effect.promise(() => redis.exists(key))

      const keys = (pattern: string) =>
        Effect.promise(() => redis.keys(pattern))

      const mget = (...keys: string[]) =>
        Effect.promise(() => redis.mget(...keys))

      // Add finalizer for cleanup
      yield* Effect.addFinalizer(() => close())

      return {
        getSystemPrompt,
        setSystemPrompt,
        get,
        set,
        del,
        exists,
        keys,
        mget,
        close,
      } as const
    }),
  }
) {}

export const RedisServiceLive = RedisService.Default
