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

    const program = Effect.gen(function* () {
      const parsed = yield* jsonParseSafe(body)
      const { text } = yield* Schema.decodeUnknown(BodySchema)(parsed)

      const enc = get_encoding('cl100k_base')
      const tokens = enc.encode(text)
      const nTokens = tokens.length
      enc.free()

      return json({
        token_count: nTokens,
        text_length: text.length,
      })
    }).pipe(
      Effect.catchAll((error) => {
        if (error._tag === 'JsonParseError') {
          return Effect.succeed(
            json({ error: 'Invalid JSON in request body' }, { status: 400 })
          )
        }

        if (error._tag === 'ParseError') {
          return Effect.succeed(
            json(
              {
                error: 'Invalid request body: missing or invalid "text" field',
              },
              { status: 400 }
            )
          )
        }

        return Effect.succeed(
          json({ error: 'Internal server error' }, { status: 500 })
        )
      })
    )

    return await Effect.runPromise(program)
  },
})
