const DEXCHANGE_API_URL = 'https://api.dexpay.africa/api/v1'

function getApiKey(): string {
  const apiKey = process.env.DEXCHANGE_API_KEY
  if (!apiKey) {
    throw new Error('DEXCHANGE_API_KEY is required')
  }
  return apiKey
}

export interface CreateCheckoutParams {
  reference: string
  itemName: string
  amount: number
  currency: string
  successUrl: string
  failureUrl: string
  webhookUrl: string
  metadata?: Record<string, any>
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const apiKey = getApiKey()
  const response = await fetch(`${DEXCHANGE_API_URL}/checkout-sessions`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: params.reference,
      item_name: params.itemName,
      amount: params.amount,
      currency: params.currency,
      success_url: params.successUrl,
      failure_url: params.failureUrl,
      webhook_url: params.webhookUrl,
      metadata: params.metadata || {},
    }),
  })

  const data = await response.json()
  if (data.statusCode && data.statusCode >= 400) {
    throw new Error(data.message || 'Erreur création session DEXCHANGE')
  }
  return data.data
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.DEXCHANGE_WEBHOOK_SECRET
  if (!secret) return false

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const computed = hmac.digest('hex')

  if (computed.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}
