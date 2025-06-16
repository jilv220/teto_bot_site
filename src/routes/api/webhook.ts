import { json } from '@tanstack/react-start'
import {
  createServerFileRoute,
  getEvent,
  getHeaders,
} from '@tanstack/react-start/server'
import { Data, Duration, Effect, Schedule } from 'effect'
import { UserService, UserServiceLive, appConfig } from '../../services'
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
      return json(
        {
          error: 'Unauthorized',
        },
        {
          status: 403,
        }
      )

    const body = await request.text()

    const program = Effect.gen(function* () {
      const parsedBody = yield* jsonParseSafe(body)
      const vote = parsedBody as WebhookPayload

      const userId = yield* bigIntParseSafe(vote.user).pipe(
        Effect.mapError(() => new InvalidUserIdError({ userId: vote.user }))
      )

      if (vote.type === 'test') {
        console.log(`Received a test vote from user: ${userId}`)
        return new Response(null, { status: 204 })
      }

      const userService = yield* UserService
      yield* userService.awardVoteBonus(userId, voteCreditBonus)

      return new Response(null, { status: 204 })
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential(Duration.millis(100)).pipe(
          Schedule.jittered
        ),
        times: 3,
      }),
      Effect.provide(UserServiceLive),
      Effect.catchAll((error) => {
        if (
          error._tag === 'JsonParseError' ||
          error._tag === 'InvalidUserIdError'
        ) {
          return Effect.succeed(
            json(
              {
                error: 'Invalid Body',
              },
              { status: 400 }
            )
          )
        }

        console.error('Failed to process webhook:', error)
        return Effect.succeed(
          json(
            {
              error: 'Failed to process vote',
            },
            { status: 500 }
          )
        )
      })
    )

    return await Effect.runPromise(program)
  },
})
