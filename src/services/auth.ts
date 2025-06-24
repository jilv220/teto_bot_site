import { Effect } from 'effect'
import { SignJWT, jwtVerify } from 'jose'
import { appConfig } from './config'

// Discord OAuth2 URLs
const DISCORD_API_BASE = 'https://discord.com/api/v10'
const DISCORD_OAUTH_BASE = 'https://discord.com/api/oauth2'

// Types
export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email?: string
}

export interface AuthSession {
  userId: string
  username: string
  avatar: string | null
  role: string
  expiresAt: number
}

// Simple auth service functions
export const getDiscordAuthUrl = async (state?: string): Promise<string> => {
  const config = await Effect.runPromise(appConfig)

  const params = new URLSearchParams({
    client_id: config.discordClientId,
    redirect_uri: config.discordRedirectUri,
    response_type: 'code',
    scope: 'identify email',
    ...(state && { state }),
  })

  return `${DISCORD_OAUTH_BASE}/authorize?${params.toString()}`
}

export const exchangeCodeForToken = async (code: string) => {
  const config = await Effect.runPromise(appConfig)

  const decodedCode = decodeURIComponent(code)
  const requestBody = new URLSearchParams({
    client_id: config.discordClientId,
    client_secret: config.discordClientSecret,
    grant_type: 'authorization_code',
    code: decodedCode,
    redirect_uri: config.discordRedirectUri,
  })

  const response = await fetch(`${DISCORD_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: requestBody,
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `Discord OAuth error: ${response.status} ${response.statusText} - ${responseText}`
    )
  }

  try {
    const tokenData = JSON.parse(responseText) as {
      access_token: string
      token_type: string
      expires_in: number
      refresh_token: string
      scope: string
    }

    return tokenData
  } catch (error) {
    throw new Error(`Discord OAuth response parsing failed: ${error}`)
  }
}

export const getDiscordUser = async (
  accessToken: string
): Promise<DiscordUser> => {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Discord API error: ${response.status} ${response.statusText}`
    )
  }

  return (await response.json()) as DiscordUser
}

export const createJWT = async (session: AuthSession): Promise<string> => {
  const config = await Effect.runPromise(appConfig)
  const secret = new TextEncoder().encode(config.jwtSecret)

  return await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(session.expiresAt / 1000))
    .sign(secret)
}

export const verifyJWT = async (token: string): Promise<AuthSession> => {
  const config = await Effect.runPromise(appConfig)
  const secret = new TextEncoder().encode(config.jwtSecret)

  const { payload } = await jwtVerify(token, secret)
  const session = payload as unknown as AuthSession

  // Check if token is expired
  if (Date.now() > session.expiresAt) {
    throw new Error('JWT expired')
  }

  return session
}
