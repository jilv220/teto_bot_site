import { type FetchOptions, ofetch } from 'ofetch'

// Base API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

// Create ofetch instance with default configuration
export const api = ofetch.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add authorization token if available
  onRequest({ options }) {
    const token = process.env.BOT_API_TOKEN
    if (token) {
      options.headers = new Headers({
        ...options.headers,
        Authorization: `Bearer ${token}`,
      })
    }
  },
  // Handle errors gracefully
  onResponseError({ response }) {
    console.error(`API Error: ${response.status} - ${response.statusText}`)
  },
})

// =====================
// TYPE DEFINITIONS
// =====================

// User Types
export interface User {
  userId: string
  insertedAt: string
  updatedAt: string
  role?: 'user' | 'admin'
  lastVotedAt?: string
  messageCredits: string
}

export interface CreateUserRequest {
  userId: string
  role?: 'user' | 'admin'
}

export interface UpdateUserRequest {
  userId: string
  role?: 'user' | 'admin'
  messageCredits?: string
  lastVotedAt?: string
}

export interface UserResponse {
  data: {
    user: User
  }
}

export interface UsersResponse {
  data: {
    users: User[]
  }
}

// Guild Types
export interface Guild {
  id: string
  guildId: string
  insertedAt: string
  updatedAt: string
}

export interface CreateGuildRequest {
  guildId: string
}

export interface GuildResponse {
  data: {
    guild: Guild
  }
}

export interface GuildsResponse {
  data: {
    guilds: Guild[]
  }
}

// Channel Types
export interface Channel {
  id: string
  channelId: string
  guildId: string
  insertedAt: string
  updatedAt: string
}

export interface CreateChannelRequest {
  channelId: string
  guildId: string
}

export interface ChannelResponse {
  data: {
    channel: Channel
  }
}

export interface ChannelsResponse {
  data: {
    channels: Channel[]
  }
}

// UserGuild Types
export interface UserGuild {
  userId: string
  guildId: string
  insertedAt: string
  updatedAt: string
  intimacy: number
  lastMessageAt?: string
  lastFeed?: string
  dailyMessageCount: string
}

export interface CreateUserGuildRequest {
  userId: string
  guildId: string
  intimacy?: number
  lastMessageAt?: string
  lastFeed?: string
  dailyMessageCount?: string
}

export interface UpdateUserGuildRequest {
  intimacy?: number
  lastMessageAt?: string
  lastFeed?: string
  dailyMessageCount?: string
}

export interface UserGuildResponse {
  data: {
    userGuild: UserGuild
  }
}

export interface UserGuildsResponse {
  data: {
    userGuilds: UserGuild[]
  }
}

// Leaderboard Types
export interface LeaderboardEntry extends UserGuild {}

export interface LeaderboardResponse {
  data: {
    leaderboard: LeaderboardEntry[]
    guildId: string
    limit: number
  }
}

export interface LeaderboardRequest {
  guildId: string
  limit?: number
}

// Token Types
export interface TokenRequest {
  text: string
}

export interface TokenResponse {
  token_count: number
  text_length: number
}

// System Prompt Types
export interface SetSystemPromptRequest {
  prompt: string
}

export interface SystemPromptResponse {
  prompt: string | null
}

export interface SetSystemPromptResponse {
  success: boolean
  message: string
}

// Lyrics Types
export interface Lyrics {
  artist: string
  title: string
  lyrics: string
  createdAt: string
  updatedAt: string
}

export interface CreateLyricsRequest {
  artist: string
  title: string
  lyrics: string
}

export interface UpdateLyricsRequest {
  lyrics: string
}

export interface LyricsResponse {
  data: {
    lyrics: Lyrics
  }
}

export interface LyricsListResponse {
  data: {
    lyrics: Lyrics[]
  }
}

export interface DeleteLyricsResponse {
  data: {
    message: string
  }
}

// Error Types
export interface ApiError {
  error: {
    code: number
    message: string
  }
}

export interface ValidationError {
  error: {
    message: string
    issues: Array<{
      path: string[]
      message: string
      code: string
    }>
  }
}

// Response union types
export type ApiResponse<T> = T | ApiError | ValidationError

// =====================
// API CLIENT FUNCTIONS
// =====================

// User API
export const userApi = {
  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<UsersResponse>> {
    return api<UsersResponse>('/users')
  },

  /**
   * Get a specific user by ID
   */
  async getUser(userId: string): Promise<ApiResponse<UserResponse>> {
    return api<UserResponse>(`/users/${userId}`)
  },

  /**
   * Create a new user
   */
  async createUser(
    userData: CreateUserRequest
  ): Promise<ApiResponse<UserResponse>> {
    return api<UserResponse>('/users', {
      method: 'POST',
      body: userData,
    })
  },

  /**
   * Update an existing user
   */
  async updateUser(
    userId: string,
    updateData: Omit<UpdateUserRequest, 'userId'>
  ): Promise<ApiResponse<UserResponse>> {
    return api<UserResponse>(`/users/${userId}`, {
      method: 'PUT',
      body: updateData,
    })
  },

  /**
   * Delete a user
   */
  async deleteUser(
    userId: string
  ): Promise<ApiResponse<{ data: { message: string } }>> {
    return api<{ data: { message: string } }>(`/users/${userId}`, {
      method: 'DELETE',
    })
  },
}

// Guild API
export const guildApi = {
  /**
   * Get all guilds
   */
  async getGuilds(): Promise<ApiResponse<GuildsResponse>> {
    return api<GuildsResponse>('/guilds')
  },

  /**
   * Get a specific guild by ID
   */
  async getGuild(guildId: string): Promise<ApiResponse<GuildResponse>> {
    return api<GuildResponse>(`/guilds/${guildId}`)
  },

  /**
   * Create a new guild
   */
  async createGuild(
    guildData: CreateGuildRequest
  ): Promise<ApiResponse<GuildResponse>> {
    return api<GuildResponse>('/guilds', {
      method: 'POST',
      body: guildData,
    })
  },
}

// Channel API
export const channelApi = {
  /**
   * Get all channels
   */
  async getChannels(): Promise<ApiResponse<ChannelsResponse>> {
    return api<ChannelsResponse>('/channels')
  },

  /**
   * Get a specific channel by ID
   */
  async getChannel(channelId: string): Promise<ApiResponse<ChannelResponse>> {
    return api<ChannelResponse>(`/channels/${channelId}`)
  },

  /**
   * Create a new channel
   */
  async createChannel(
    channelData: CreateChannelRequest
  ): Promise<ApiResponse<ChannelResponse>> {
    return api<ChannelResponse>('/channels', {
      method: 'POST',
      body: channelData,
    })
  },
}

// UserGuild API
export const userGuildApi = {
  /**
   * Get all user-guild relationships
   */
  async getUserGuilds(): Promise<ApiResponse<UserGuildsResponse>> {
    return api<UserGuildsResponse>('/user-guilds')
  },

  /**
   * Get a specific user-guild relationship
   */
  async getUserGuild(
    userId: string,
    guildId: string
  ): Promise<ApiResponse<UserGuildResponse>> {
    return api<UserGuildResponse>('/user-guilds', {
      query: { userId, guildId },
    })
  },

  /**
   * Create a new user-guild relationship
   */
  async createUserGuild(
    userGuildData: CreateUserGuildRequest
  ): Promise<ApiResponse<UserGuildResponse>> {
    return api<UserGuildResponse>('/user-guilds', {
      method: 'POST',
      body: userGuildData,
    })
  },

  /**
   * Update a user-guild relationship
   */
  async updateUserGuild(
    userId: string,
    guildId: string,
    updateData: UpdateUserGuildRequest
  ): Promise<ApiResponse<UserGuildResponse>> {
    return api<UserGuildResponse>('/user-guilds', {
      method: 'PUT',
      query: { userId, guildId },
      body: updateData,
    })
  },
}

// Leaderboard API
export const leaderboardApi = {
  /**
   * Get intimacy leaderboard for a guild
   */
  async getIntimacyLeaderboard(
    request: LeaderboardRequest
  ): Promise<ApiResponse<LeaderboardResponse>> {
    return api<LeaderboardResponse>('/leaderboard', {
      query: {
        guildId: request.guildId,
        ...(request.limit && { limit: request.limit.toString() }),
      },
    })
  },
}

// Token API
export const tokenApi = {
  /**
   * Get token count for text
   */
  async getTokenCount(text: string): Promise<ApiResponse<TokenResponse>> {
    return api<TokenResponse>('/tokens', {
      method: 'POST',
      body: { text },
    })
  },
}

// System Prompt API
export const systemPromptApi = {
  /**
   * Get the current system prompt
   */
  async getSystemPrompt(): Promise<ApiResponse<SystemPromptResponse>> {
    return api<SystemPromptResponse>('/system-prompt', {
      method: 'GET',
    })
  },

  /**
   * Set a new system prompt
   */
  async setSystemPrompt(
    prompt: string
  ): Promise<ApiResponse<SetSystemPromptResponse>> {
    return api<SetSystemPromptResponse>('/system-prompt', {
      method: 'POST',
      body: { prompt },
    })
  },
}

// Lyrics API
export const lyricsApi = {
  /**
   * Get all lyrics
   */
  async getAllLyrics(): Promise<ApiResponse<LyricsListResponse>> {
    return api<LyricsListResponse>('/lyrics', {
      method: 'GET',
    })
  },

  /**
   * Create new lyrics
   */
  async createLyrics(
    lyricsData: CreateLyricsRequest
  ): Promise<ApiResponse<LyricsResponse>> {
    return api<LyricsResponse>('/lyrics', {
      method: 'POST',
      body: lyricsData,
    })
  },

  /**
   * Get lyrics by artist
   */
  async getLyricsByArtist(
    artist: string
  ): Promise<ApiResponse<LyricsListResponse>> {
    return api<LyricsListResponse>(`/lyrics/${encodeURIComponent(artist)}`, {
      method: 'GET',
    })
  },

  /**
   * Get specific lyrics by artist and title
   */
  async getLyrics(
    artist: string,
    title: string
  ): Promise<ApiResponse<LyricsResponse>> {
    return api<LyricsResponse>(
      `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      {
        method: 'GET',
      }
    )
  },

  /**
   * Update lyrics by artist and title
   */
  async updateLyrics(
    artist: string,
    title: string,
    updates: UpdateLyricsRequest
  ): Promise<ApiResponse<LyricsResponse>> {
    return api<LyricsResponse>(
      `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      {
        method: 'PUT',
        body: updates,
      }
    )
  },

  /**
   * Delete lyrics by artist and title
   */
  async deleteLyrics(
    artist: string,
    title: string
  ): Promise<ApiResponse<DeleteLyricsResponse>> {
    return api<DeleteLyricsResponse>(
      `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      {
        method: 'DELETE',
      }
    )
  },
}

// Discord Operations Types (Optimized endpoints)
export interface EnsureUserGuildExistsRequest {
  userId: string
  guildId: string
  role?: 'user' | 'admin'
}

export interface RecordUserMessageRequest {
  userId: string
  guildId: string
  messageLength?: number
  intimacyIncrement?: number
  role?: 'user' | 'admin'
}

export interface EnsureUserGuildExistsResponse {
  data: {
    user: User
    userGuild: UserGuild
    userCreated: boolean
    userGuildCreated: boolean
  }
}

export interface RecordUserMessageResponse {
  data: {
    user: User
    userGuild: UserGuild
    userCreated: boolean
    userGuildCreated: boolean
  }
}

// Discord Operations API (optimized for Discord bots)
export const discordOpsApi = {
  /**
   * Ensure user and user-guild relationship exist (atomic operation)
   */
  async ensureUserGuildExists(
    request: EnsureUserGuildExistsRequest
  ): Promise<ApiResponse<EnsureUserGuildExistsResponse>> {
    return api<EnsureUserGuildExistsResponse>('/ensure-user-guild-exists', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * Record a user message, ensuring user/guild exist and updating stats (atomic operation)
   */
  async recordUserMessage(
    request: RecordUserMessageRequest
  ): Promise<ApiResponse<RecordUserMessageResponse>> {
    return api<RecordUserMessageResponse>('/record-user-message', {
      method: 'POST',
      body: request,
    })
  },
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return !!(response && typeof response === 'object' && 'error' in response)
}

/**
 * Type guard to check if response is a validation error
 */
export function isValidationError(
  response: unknown
): response is ValidationError {
  return (
    isApiError(response) &&
    response.error &&
    typeof response.error === 'object' &&
    'issues' in response.error
  )
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(response: ApiError | ValidationError): string {
  if (isValidationError(response)) {
    return response.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
  }
  return response.error.message
}

/**
 * Helper function to handle API responses with error checking
 */
export async function handleApiResponse<T>(
  apiCall: () => Promise<ApiResponse<T>>
): Promise<T> {
  const response = await apiCall()

  if (isApiError(response)) {
    throw new Error(`API Error: ${getErrorMessage(response)}`)
  }

  return response as T
}

// Word of the Day Types
export interface WordOfTheDayResponse {
  word: string
  date: string
}

// Word Response Types
export interface WordResponse {
  response: string
  updatedAt: string
}

export interface UpdateWordResponseRequest {
  response: string
}

export interface WordResponseResponse {
  data: WordResponse
}

export interface UpdateWordResponseResponse {
  data: WordResponse
}

export interface DeleteWordResponseResponse {
  data: {
    message: string
  }
}

// Word of the Day API
export const wordOfTheDayApi = {
  /**
   * Get today's word
   */
  async getTodaysWord(): Promise<ApiResponse<WordOfTheDayResponse>> {
    return api<WordOfTheDayResponse>('/word-of-the-day')
  },
}

// Word Response API
export const wordResponseApi = {
  /**
   * Get the current LLM word response
   */
  async getWordResponse(): Promise<ApiResponse<WordResponseResponse>> {
    return api<WordResponseResponse>('/word-response')
  },

  /**
   * Update the LLM word response
   */
  async updateWordResponse(
    updateData: UpdateWordResponseRequest
  ): Promise<ApiResponse<UpdateWordResponseResponse>> {
    return api<UpdateWordResponseResponse>('/word-response', {
      method: 'POST',
      body: updateData,
    })
  },

  /**
   * Delete the current LLM word response
   */
  async deleteWordResponse(): Promise<ApiResponse<DeleteWordResponseResponse>> {
    return api<DeleteWordResponseResponse>('/word-response', {
      method: 'DELETE',
    })
  },
}

// =====================
// EXPORT ALL APIs
// =====================

export const discordBotApi = {
  users: userApi,
  guilds: guildApi,
  channels: channelApi,
  userGuilds: userGuildApi,
  tokens: tokenApi,
  systemPrompt: systemPromptApi,
  lyrics: lyricsApi,
  // New optimized operations
  discord: discordOpsApi,
  leaderboard: leaderboardApi,
  // Word of the day
  wordOfTheDay: wordOfTheDayApi,
  // Word response
  wordResponse: wordResponseApi,
}

export default discordBotApi
