import discordBotApi, {
  isApiError,
  isValidationError,
  getErrorMessage,
  handleApiResponse,
  type UsersResponse,
  type UserResponse,
  type GuildsResponse,
  type GuildResponse,
  type ChannelsResponse,
  type ChannelResponse,
  type UserGuildsResponse,
  type UserGuildResponse,
  type TokenResponse,
  type EnsureUserGuildExistsResponse,
  type RecordUserMessageResponse,
  type LeaderboardResponse,
} from './api'

// Example usage of the Discord Bot API Client

/**
 * Helper function to check if a response is successful
 */
function isSuccessResponse<T>(response: T | unknown): response is T {
  return !isApiError(response) && !isValidationError(response)
}

/**
 * Example: User Management
 */
async function exampleUserOperations() {
  try {
    // Get all users
    const usersResponse = await discordBotApi.users.getUsers()
    if (!isSuccessResponse<UsersResponse>(usersResponse)) {
      console.error('Failed to fetch users:', getErrorMessage(usersResponse))
      return
    }
    console.log('Users:', usersResponse.data.users)

    // Create a new user
    const newUserResponse = await discordBotApi.users.createUser({
      userId: '123456789012345678',
      role: 'user',
    })

    if (!isSuccessResponse<UserResponse>(newUserResponse)) {
      console.error('Failed to create user:', getErrorMessage(newUserResponse))
      return
    }
    console.log('Created user:', newUserResponse.data.user)

    // Update the user
    const updateResponse = await discordBotApi.users.updateUser(
      '123456789012345678',
      {
        messageCredits: '50',
        role: 'admin',
      }
    )

    if (!isSuccessResponse<UserResponse>(updateResponse)) {
      console.error('Failed to update user:', getErrorMessage(updateResponse))
      return
    }
    console.log('Updated user:', updateResponse.data.user)

    // Get specific user
    const userResponse = await discordBotApi.users.getUser('123456789012345678')
    if (!isSuccessResponse<UserResponse>(userResponse)) {
      console.error('Failed to get user:', getErrorMessage(userResponse))
      return
    }
    console.log('User details:', userResponse.data.user)
  } catch (error) {
    console.error(
      'Unexpected error:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Guild Management
 */
async function exampleGuildOperations() {
  try {
    // Using the helper function for cleaner error handling
    const guildsResponse = await handleApiResponse(() =>
      discordBotApi.guilds.getGuilds()
    )
    console.log('Guilds:', guildsResponse.data.guilds)

    // Create a guild
    const newGuild = await handleApiResponse(() =>
      discordBotApi.guilds.createGuild({
        guildId: '987654321098765432',
      })
    )
    console.log('Created guild:', newGuild.data.guild)
  } catch (error) {
    console.error(
      'Guild operations failed:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Channel Management
 */
async function exampleChannelOperations() {
  try {
    // Create a channel
    const channelResponse = await discordBotApi.channels.createChannel({
      channelId: '111222333444555666',
      guildId: '987654321098765432',
    })

    if (!isSuccessResponse<ChannelResponse>(channelResponse)) {
      console.error(
        'Failed to create channel:',
        getErrorMessage(channelResponse)
      )
      return
    }
    console.log('Created channel:', channelResponse.data.channel)

    // Get all channels
    const channelsResponse = await discordBotApi.channels.getChannels()
    if (!isSuccessResponse<ChannelsResponse>(channelsResponse)) {
      console.error(
        'Failed to get channels:',
        getErrorMessage(channelsResponse)
      )
      return
    }
    console.log('All channels:', channelsResponse.data.channels)
  } catch (error) {
    console.error(
      'Channel operations failed:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: User-Guild Relationship Management
 */
async function exampleUserGuildOperations() {
  try {
    // Create user-guild relationship
    const userGuildResponse = await discordBotApi.userGuilds.createUserGuild({
      userId: '123456789012345678',
      guildId: '987654321098765432',
      intimacy: 10,
      dailyMessageCount: '5',
    })

    if (!isSuccessResponse<UserGuildResponse>(userGuildResponse)) {
      console.error(
        'Failed to create user-guild:',
        getErrorMessage(userGuildResponse)
      )
      return
    }
    console.log(
      'Created user-guild relationship:',
      userGuildResponse.data.userGuild
    )

    // Update user-guild relationship
    const updateResponse = await discordBotApi.userGuilds.updateUserGuild(
      '123456789012345678',
      '987654321098765432',
      {
        intimacy: 15,
        dailyMessageCount: '10',
        lastMessageAt: new Date().toISOString(),
      }
    )

    if (!isSuccessResponse<UserGuildResponse>(updateResponse)) {
      console.error(
        'Failed to update user-guild:',
        getErrorMessage(updateResponse)
      )
      return
    }
    console.log(
      'Updated user-guild relationship:',
      updateResponse.data.userGuild
    )

    // Get specific user-guild relationship
    const specificResponse = await discordBotApi.userGuilds.getUserGuild(
      '123456789012345678',
      '987654321098765432'
    )

    if (!isSuccessResponse<UserGuildResponse>(specificResponse)) {
      console.error(
        'Failed to get user-guild:',
        getErrorMessage(specificResponse)
      )
      return
    }
    console.log('User-guild details:', specificResponse.data.userGuild)
  } catch (error) {
    console.error(
      'User-guild operations failed:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Token Operations
 */
async function exampleTokenOperations() {
  try {
    const text = 'This is a sample text to count tokens for.'

    const tokenResponse = await discordBotApi.tokens.getTokenCount(text)

    if (!isSuccessResponse<TokenResponse>(tokenResponse)) {
      console.error(
        'Failed to get token count:',
        getErrorMessage(tokenResponse)
      )
      return
    }

    console.log(`Text: "${text}"`)
    console.log(`Character count: ${tokenResponse.text_length}`)
    console.log(`Token count: ${tokenResponse.token_count}`)
  } catch (error) {
    console.error(
      'Token operations failed:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Using in a Discord Bot Context
 */
async function handleDiscordMessage(
  userId: string,
  guildId: string,
  message: string
) {
  try {
    // Ensure user exists
    let userResponse = await discordBotApi.users.getUser(userId)

    if (!isSuccessResponse<UserResponse>(userResponse)) {
      if (isApiError(userResponse) && userResponse.error.code === 404) {
        // Create user if they don't exist
        const createResponse = await discordBotApi.users.createUser({
          userId: userId,
          role: 'user',
        })

        if (!isSuccessResponse<UserResponse>(createResponse)) {
          console.error(
            'Failed to create user:',
            getErrorMessage(createResponse)
          )
          return
        }

        userResponse = createResponse
      } else {
        console.error('Failed to get user:', getErrorMessage(userResponse))
        return
      }
    }

    // Get or create user-guild relationship
    let userGuildResponse = await discordBotApi.userGuilds.getUserGuild(
      userId,
      guildId
    )

    if (!isSuccessResponse<UserGuildResponse>(userGuildResponse)) {
      if (
        isApiError(userGuildResponse) &&
        userGuildResponse.error.code === 404
      ) {
        // Create relationship if it doesn't exist
        const createResponse = await discordBotApi.userGuilds.createUserGuild({
          userId: userId,
          guildId: guildId,
          intimacy: 1,
          dailyMessageCount: '1',
        })

        if (!isSuccessResponse<UserGuildResponse>(createResponse)) {
          console.error(
            'Failed to create user-guild:',
            getErrorMessage(createResponse)
          )
          return
        }

        userGuildResponse = createResponse
      } else {
        console.error(
          'Failed to get user-guild:',
          getErrorMessage(userGuildResponse)
        )
        return
      }
    } else {
      // Update existing relationship
      const currentCount = BigInt(
        userGuildResponse.data.userGuild.dailyMessageCount
      )
      const updateResponse = await discordBotApi.userGuilds.updateUserGuild(
        userId,
        guildId,
        {
          dailyMessageCount: (currentCount + BigInt(1)).toString(),
          lastMessageAt: new Date().toISOString(),
          intimacy: userGuildResponse.data.userGuild.intimacy + 1,
        }
      )

      if (!isSuccessResponse<UserGuildResponse>(updateResponse)) {
        console.error(
          'Failed to update user-guild:',
          getErrorMessage(updateResponse)
        )
        return
      }
    }

    // Get token count for the message
    const tokenResponse = await discordBotApi.tokens.getTokenCount(message)
    if (isSuccessResponse<TokenResponse>(tokenResponse)) {
      console.log(
        `Message from ${userId} has ${tokenResponse.token_count} tokens`
      )
    }

    console.log('Successfully processed Discord message')
  } catch (error) {
    console.error(
      'Error handling Discord message:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Optimized Discord Message Handling (Single API call)
 */
async function handleDiscordMessageOptimized(
  userId: string,
  guildId: string,
  message: string
) {
  try {
    // Single atomic operation that handles user creation, guild relationship, and message recording
    const result = await discordBotApi.discord.recordUserMessage({
      userId,
      guildId,
      messageLength: message.length,
      intimacyIncrement: 1,
      role: 'user',
    })

    if (!isSuccessResponse<RecordUserMessageResponse>(result)) {
      console.error('Failed to record user message:', getErrorMessage(result))
      return
    }

    const { user, userGuild } = result.data

    // Log what happened
    console.log(`Processed message for user: ${user.userId}`)

    if (userGuild) {
      console.log(
        `Updated user stats: intimacy=${userGuild.intimacy}, dailyMessages=${userGuild.dailyMessageCount}`
      )
    } else {
      console.log('Processed DM message (no guild stats updated)')
    }

    // Optional: Get token count for the message (separate call since it's a different concern)
    const tokenResponse = await discordBotApi.tokens.getTokenCount(message)
    if (isSuccessResponse<TokenResponse>(tokenResponse)) {
      console.log(
        `Message from ${userId} has ${tokenResponse.token_count} tokens`
      )
    }

    console.log(
      'Successfully processed Discord message in 1-2 API calls instead of 3-6!'
    )
  } catch (error) {
    console.error(
      'Error handling Discord message:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Ensure User-Guild Relationship Exists (useful for bot join events)
 */
async function handleUserJoinGuild(userId: string, guildId: string) {
  try {
    const result = await discordBotApi.discord.ensureUserGuildExists({
      userId,
      guildId,
      role: 'user',
    })

    if (!isSuccessResponse<EnsureUserGuildExistsResponse>(result)) {
      console.error(
        'Failed to ensure user-guild exists:',
        getErrorMessage(result)
      )
      return
    }

    const { user, userGuild } = result.data

    console.log(`User ${user.userId} joined guild ${userGuild.guildId}`)
    console.log('User-guild relationship ensured successfully')
  } catch (error) {
    console.error(
      'Error handling user join:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * Example: Get Intimacy Leaderboard for a Guild
 */
async function exampleLeaderboardOperations() {
  try {
    console.log('\n=== Leaderboard Operations ===')

    const guildId = '123456789012345678'

    // Get top 10 members by intimacy
    const leaderboardResponse =
      await discordBotApi.leaderboard.getIntimacyLeaderboard({
        guildId,
        limit: 10,
      })

    if (!isSuccessResponse<LeaderboardResponse>(leaderboardResponse)) {
      console.error(
        'Failed to get leaderboard:',
        getErrorMessage(leaderboardResponse)
      )
      return
    }

    const {
      leaderboard,
      guildId: returnedGuildId,
      limit,
    } = leaderboardResponse.data

    console.log(
      `\n🏆 Intimacy Leaderboard for Guild ${returnedGuildId} (Top ${limit}):`
    )

    if (leaderboard.length === 0) {
      console.log('No users found in this guild.')
      return
    }

    leaderboard.forEach((entry, index) => {
      const rank = index + 1
      const medal =
        rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  '
      console.log(
        `${medal} ${rank.toString().padStart(2)}. User ${entry.userId.substring(0, 8)}... ` +
          `Intimacy: ${entry.intimacy.toString().padStart(3)} ` +
          `Daily Messages: ${entry.dailyMessageCount.padStart(3)} ` +
          `Last Message: ${entry.lastMessageAt ? new Date(entry.lastMessageAt).toLocaleDateString() : 'Never'}`
      )
    })

    // Get a smaller leaderboard (top 3)
    console.log('\n--- Getting Top 3 ---')
    const top3Response = await discordBotApi.leaderboard.getIntimacyLeaderboard(
      {
        guildId,
        limit: 3,
      }
    )

    if (isSuccessResponse<LeaderboardResponse>(top3Response)) {
      console.log(
        `Top 3 users have intimacy levels: ${top3Response.data.leaderboard.map((u) => u.intimacy).join(', ')}`
      )
    }
  } catch (error) {
    console.error(
      'Error in leaderboard operations:',
      error instanceof Error ? error.message : String(error)
    )
  }
}

// Export examples for use
export {
  exampleUserOperations,
  exampleGuildOperations,
  exampleChannelOperations,
  exampleUserGuildOperations,
  exampleTokenOperations,
  exampleLeaderboardOperations,
  handleDiscordMessage,
  handleDiscordMessageOptimized,
  handleUserJoinGuild,
}
