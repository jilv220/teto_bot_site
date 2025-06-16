import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { get_encoding } from 'tiktoken'
import { jsonParseSafe } from '../../utils'

const BodySchema = Schema.Struct({
  text: Schema.String,
})

export const ServerRoute = createServerFileRoute('/api/tokens').methods({
  POST: async ({ request }) => {
    const body = await request.text()

    const program = jsonParseSafe(body).pipe(
      Effect.flatMap((parsed: unknown) => {
        const decode = Schema.decodeUnknownEither(BodySchema)
        return decode(parsed)
      }),
      Effect.flatMap(({ text }) => {
        const enc = get_encoding('cl100k_base')
        const tokens = enc.encode(text)
        const nTokens = tokens.length

        return Effect.succeed(
          json({
            token_count: nTokens,
            text_length: text.length,
          })
        )
      }),
      Effect.mapError((_e) => {
        return Effect.succeed(
          json(
            {
              error: 'Invalid Body',
            },
            { status: 400 }
          )
        )
      })
    )

    return await Effect.runPromise(program)
  },
})
