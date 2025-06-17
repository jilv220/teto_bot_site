import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { ChannelRepository } from '../../../../repositories/channel'
import { AllRepositoriesLive } from '../../../../services/repositories'
import { serializeBigInt } from '../../../../utils/bigint'

export const ServerRoute = createServerFileRoute(
  '/api/guilds/$guildId/channels'
).methods({
  // Get all channels for a specific guild
  GET: async ({ params }) => {
    const program = Effect.gen(function* () {
      const channelRepo = yield* ChannelRepository
      const guildId = BigInt(params.guildId)
      const channels = yield* channelRepo.findByGuildId(guildId)
      const serializedChannels = serializeBigInt(channels)

      return json({ channels: serializedChannels })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to fetch channels' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },
})
