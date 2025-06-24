import { Config, Effect } from 'effect'

export const appConfig = Effect.gen(function* () {
  return {
    port: yield* Config.number('PORT').pipe(Config.withDefault(3000)),
    topggWebAuthToken: yield* Config.string('TOPGG_WEB_AUTH_TOKEN'),
    botApiKey: yield* Config.string('BOT_API_KEY'),
    databaseUrl: yield* Config.string('DATABASE_URL'),
    redisUrl: yield* Config.string('REDIS_URL'),
    // Discord OAuth
    discordClientId: yield* Config.string('DISCORD_CLIENT_ID'),
    discordClientSecret: yield* Config.string('DISCORD_CLIENT_SECRET'),
    discordRedirectUri: yield* Config.string('DISCORD_REDIRECT_URI'),
    jwtSecret: yield* Config.string('JWT_SECRET'),
    // App config
    voteCreditBonus: 30,
    dailyCreditRefillCap: 30,
    messageCreditCost: 1,
  }
})

export const siteConfig = {
  title: 'Kasane Teto Bot',
} as const
