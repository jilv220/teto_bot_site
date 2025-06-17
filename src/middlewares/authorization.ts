import { createMiddleware, json } from '@tanstack/react-start'
import { getEvent, getHeaders } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { appConfig } from '../services'

export const authorizationMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ request, next }) => {
  const event = getEvent()
  const headers = getHeaders(event)
  const authorization = headers.authorization
  const { botApiKey } = await Effect.runPromise(appConfig)

  if (!authorization || authorization !== `Bearer ${botApiKey}`) {
    throw json(
      {
        error: 'Unauthorized',
      },
      { status: 401 }
    )
  }

  return next()
})
