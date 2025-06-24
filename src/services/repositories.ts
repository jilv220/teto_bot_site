import { serverOnly } from '@tanstack/react-start'
import { Layer } from 'effect'
import { ChannelRepositoryLive } from '../repositories/channel'
import { GuildRepositoryLive } from '../repositories/guild'
import { UserRepositoryLive } from '../repositories/user'
import { UserGuildRepositoryLive } from '../repositories/userGuild'
import { DatabaseLive } from './database'

export const AllRepositoriesLive = serverOnly(() =>
  Layer.mergeAll(
    UserRepositoryLive,
    GuildRepositoryLive,
    ChannelRepositoryLive,
    UserGuildRepositoryLive
  ).pipe(Layer.provide(DatabaseLive()))
)
