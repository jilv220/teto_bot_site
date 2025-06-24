import { serverOnly } from '@tanstack/react-start'
import { Context, Effect, Layer } from 'effect'
import Redis from 'ioredis'
import { appConfig } from './config'

const LLM_SYS_PROMPT_KEY = 'llm_sys_prompt'

export class RedisService extends Context.Tag('RedisService')<
  RedisService,
  {
    /**
     * System prompt operations
     */
    getSystemPrompt: () => Effect.Effect<string | null, never>
    setSystemPrompt: (prompt: string) => Effect.Effect<boolean, never>

    /**
     * Generic Redis operations
     */
    get: (key: string) => Effect.Effect<string | null, never>
    set: (key: string, value: string) => Effect.Effect<'OK', never>
    del: (key: string) => Effect.Effect<number, never>
    exists: (key: string) => Effect.Effect<number, never>
    keys: (pattern: string) => Effect.Effect<string[], never>
    mget: (...keys: string[]) => Effect.Effect<(string | null)[], never>
    close: () => Effect.Effect<void, never>
  }
>() {}

const make = Effect.gen(function* () {
  const config = yield* appConfig
  const redis = new Redis(config.redisUrl)

  const close = () =>
    Effect.gen(function* () {
      yield* Effect.promise(() => redis.quit())
    })

  // Add finalizer for cleanup
  yield* Effect.addFinalizer(() => close())

  return RedisService.of({
    getSystemPrompt: () =>
      Effect.gen(function* () {
        const prompt = yield* Effect.promise(() =>
          redis.get(LLM_SYS_PROMPT_KEY)
        )
        return prompt
      }),

    setSystemPrompt: (prompt: string) =>
      Effect.gen(function* () {
        yield* Effect.promise(() => redis.set(LLM_SYS_PROMPT_KEY, prompt))
        return true
      }),

    get: (key: string) => Effect.promise(() => redis.get(key)),
    set: (key: string, value: string) =>
      Effect.promise(() => redis.set(key, value)),
    del: (key: string) => Effect.promise(() => redis.del(key)),
    exists: (key: string) => Effect.promise(() => redis.exists(key)),
    keys: (pattern: string) => Effect.promise(() => redis.keys(pattern)),
    mget: (...keys: string[]) => Effect.promise(() => redis.mget(...keys)),
    close: () => close(),
  })
})

export const RedisServiceLive = serverOnly(() =>
  Layer.effect(RedisService, make)
)
