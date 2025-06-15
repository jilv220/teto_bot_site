import { Config, Effect } from 'effect'

import dotenv from 'dotenv'

dotenv.config()

export const appConfig = Effect.gen(function* () {
  return {
    port: yield* Config.number('PORT').pipe(Config.withDefault(3000)),
    topggWebAuthToken: yield* Config.string('TOPGG_WEB_AUTH_TOKEN'),
    databaseUrl: yield* Config.string('DATABASE_URL'),
    voteCreditBonus: 30,
  }
})
