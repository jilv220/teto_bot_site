import { Webhooks } from '@polar-sh/tanstack-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Data, Duration, Effect, Logger, Schedule } from 'effect'
import { UserService, UserServiceLive, appConfig } from '../../../services'
import { bigIntParseSafe } from '../../../utils'

// Product ID to credit amount mapping
const productCreditsMap = {
  '6aefc078-a0da-4998-ae9b-5ff94c18aad5': 150,
  'aaca78c2-b925-4f9b-8d47-b76161a1604d': 315,
  'd4507c93-4aa8-4c60-a877-c8750d8fbb8c': 660,
} as const

export class InvalidCustomerIdError extends Data.TaggedError(
  'InvalidCustomerIdError'
)<{
  customerId: string
}> {}

export class ProductNotFoundError extends Data.TaggedError(
  'ProductNotFoundError'
)<{
  productId: string
}> {}

export const ServerRoute = createServerFileRoute('/api/webhooks/polar').methods(
  {
    POST: Webhooks({
      webhookSecret: (() => {
        const { polarWebhookSecret } = Effect.runSync(appConfig)
        return polarWebhookSecret
      })(),
      onPayload: async (payload) => {
        // Log the payload to understand the structure
        console.log('Polar webhook payload:', JSON.stringify(payload, null, 2))

        // Process order.paid events - this confirms payment was successful
        if (payload.type !== 'order.paid') {
          console.log(`Ignoring webhook type: ${payload.type}`)
          return
        }

        // For now, just log the order data to understand the structure
        console.log('Order data:', JSON.stringify(payload.data, null, 2))

        // TODO: Implement credit awarding logic once we understand the payload structure
        // The current implementation assumes properties that don't exist on the Order type

        // Example of what we need to implement:
        // 1. Extract customer ID from the order payload
        // 2. Map customer ID to Discord user ID
        // 3. Extract product information and map to credits
        // 4. Award credits to the user

        console.log('Webhook processed successfully')
      },
    }),
  }
)
