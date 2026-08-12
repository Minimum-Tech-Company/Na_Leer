const DEXCHANGE_API_URL = 'https://api.dexpay.africa/api/v1'

interface DexchangeConfig {
  apiKey: string
  apiSecret: string
}

function getConfig(): DexchangeConfig {
  const apiKey = process.env.DEXCHANGE_API_KEY
  const apiSecret = process.env.DEXCHANGE_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('DEXCHANGE_API_KEY and DEXCHANGE_API_SECRET are required')
  }
  return { apiKey, apiSecret }
}

function getHeaders() {
  const { apiKey, apiSecret } = getConfig()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}:${apiSecret}`,
  }
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
  const response = await fetch(`${DEXCHANGE_API_URL}/checkout-sessions`, {
    method: 'POST',
    headers: getHeaders(),
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
  if (!data.success) {
    throw new Error(data.message || 'Erreur création session DEXCHANGE')
  }
  return data.data
}

export interface CreatePaymentAttemptParams {
  reference: string
  operator: 'wave' | 'orange_money'
  countryISO: string
  customer: {
    name?: string
    phone: string
    email?: string
  }
}

export async function createPaymentAttempt(params: CreatePaymentAttemptParams) {
  const response = await fetch(
    `${DEXCHANGE_API_URL}/checkout-sessions/${params.reference}/payment-attempts`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        payment_method: 'MOBILE_MONEY',
        operator: params.operator,
        countryISO: params.countryISO,
        customer: params.customer,
      }),
    }
  )

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.message || 'Erreur création paiement DEXCHANGE')
  }
  return data.data
}

export async function getTransactionStatus(transactionId: string) {
  const response = await fetch(`${DEXCHANGE_API_URL}/transaction/${transactionId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  const data = await response.json()
  return data
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.DEXCHANGE_WEBHOOK_SECRET
  if (!secret) return false

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const computed = hmac.digest('hex')
  return computed === signature
}
