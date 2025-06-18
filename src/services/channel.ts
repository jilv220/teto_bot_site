import { Context, Effect, Layer } from 'effect'
import {
  type Channel,
  ChannelRepository,
  type ChannelRepositoryError,
  ChannelRepositoryLive,
  type NewChannel,
} from '../repositories/channel'
import { DatabaseError, DatabaseLive } from './database'

export class ChannelServiceError extends DatabaseError {}

/**
 * Business logic layer - uses repository for data access
 * Similar to Elixir contexts
 */
export class ChannelService extends Context.Tag('ChannelService')<
  ChannelService,
  {
    /**
     * Simple delegations to repository
     */
    getChannel: (
      channelId: bigint
    ) => Effect.Effect<Channel | null, ChannelRepositoryError>
    getChannels: () => Effect.Effect<Channel[], ChannelRepositoryError>
    getChannelsByGuild: (
      guildId: bigint
    ) => Effect.Effect<Channel[], ChannelRepositoryError>
    createChannel: (
      channelData: NewChannel
    ) => Effect.Effect<Channel, ChannelRepositoryError>
    updateChannel: (
      channelId: bigint,
      updates: Partial<Channel>
    ) => Effect.Effect<Channel, ChannelRepositoryError>
    deleteChannel: (
      channelId: bigint
    ) => Effect.Effect<void, ChannelRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const channelRepo = yield* ChannelRepository

  return ChannelService.of({
    getChannel: (channelId: bigint) => channelRepo.findById(channelId),
    getChannels: () => channelRepo.findAll(),
    getChannelsByGuild: (guildId: bigint) => channelRepo.findByGuildId(guildId),
    createChannel: (channelData: NewChannel) =>
      Effect.gen(function* () {
        const newChannel: NewChannel = {
          ...channelData,
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return yield* channelRepo.create(newChannel)
      }),
    updateChannel: (channelId: bigint, updates: Partial<Channel>) =>
      channelRepo.update(channelId, updates),
    deleteChannel: (channelId: bigint) => channelRepo.delete(channelId),
  })
})

export const ChannelServiceLive = Layer.effect(ChannelService, make).pipe(
  Layer.provide(ChannelRepositoryLive),
  Layer.provide(DatabaseLive)
)
