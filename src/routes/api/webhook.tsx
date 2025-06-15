import {
  createServerFileRoute,
  getEvent,
  getHeaders,
} from '@tanstack/react-start/server'
import { Data, Effect } from 'effect'
import { DatabaseLive, UserService, appConfig } from '../../services'
import { bigIntParseSafe, jsonParseSafe } from '../../utils'

export interface WebhookPayload {
  /** If webhook is a bot: ID of the bot that received a vote */
  bot?: string
  /** If webhook is a server: ID of the server that received a vote */
  guild?: string
  /** ID of the user who voted */
  user: string
  /**
   * The type of the vote (should always be "upvote" except when using the test
   * button it's "test")
   */
  type: 'upvote' | 'test'
  /**
   * Whether the weekend multiplier is in effect, meaning users votes count as
   * two
   */
  isWeekend?: boolean
  /** Query parameters in vote page in a key to value object */
  query:
    | {
        [key: string]: string
      }
    | string
}

export class InvalidUserIdError extends Data.TaggedError('InvalidUserIdError')<{
  userId: string
}> {}

export const ServerRoute = createServerFileRoute('/api/webhook').methods({
  POST: async ({ request }) => {
    const event = getEvent()
    const headers = getHeaders(event)
    const authorization = headers.authorization
    const { topggWebAuthToken, voteCreditBonus } = Effect.runSync(appConfig)

    if (!authorization || authorization !== topggWebAuthToken)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      })

    const body = await request.text()

    const result = await Effect.runPromise(
      jsonParseSafe(body).pipe(
        Effect.flatMap((vote: WebhookPayload) =>
          Effect.gen(function* () {
            const userId = yield* bigIntParseSafe(vote.user).pipe(
              Effect.mapError(
                () => new InvalidUserIdError({ userId: vote.user })
              )
            )

            if (vote.type === 'test') {
              console.log(`Received a test vote from user: ${userId}`)
              return userId
            }

            const user = yield* UserService.awardVoteBonus(
              userId,
              voteCreditBonus
            )
            return user.userId
          })
        ),
        Effect.provide(DatabaseLive),
        Effect.match({
          onFailure: (error) => ({ success: false as const, error }),
          onSuccess: (value) => ({ success: true as const, value }),
        })
      )
    )

    if (!result.success) {
      console.error('Failed to process webhook:', result.error)

      if (
        result.error._tag === 'JsonParseError' ||
        result.error._tag === 'InvalidUserIdError'
      ) {
        return new Response(JSON.stringify({ error: 'Invalid Body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      // Other errors (database, etc.)
      return new Response(JSON.stringify({ error: 'Failed to process vote' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(null, {
      status: 204,
    })
  },
})
