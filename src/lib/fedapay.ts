const FEDAPAY_SANDBOX_URL = 'https://sandbox-api.fedapay.com/v1'
const FEDAPAY_LIVE_URL = 'https://api.fedapay.com/v1'

export interface FedaPayConfig {
  secretKey: string
  environment: 'sandbox' | 'live'
}

function getBaseUrl(environment: 'sandbox' | 'live'): string {
  return environment === 'sandbox' ? FEDAPAY_SANDBOX_URL : FEDAPAY_LIVE_URL
}

async function fedaPayRequest(
  config: FedaPayConfig,
  method: string,
  path: string,
  body?: Record<string, any>
): Promise<any> {
  const baseUrl = getBaseUrl(config.environment)
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.secretKey}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || data.error || `FedaPay API error: ${res.status}`)
  }

  return data
}

export interface CreateTransactionParams {
  description: string
  amount: number
  currency: string
  callbackUrl: string
  customerEmail?: string
  customerFirstname?: string
  customerLastname?: string
  customerPhone?: string
  customerCountry?: string
  metadata?: Record<string, any>
}

export async function createTransaction(
  config: FedaPayConfig,
  params: CreateTransactionParams
): Promise<{ id: number; reference: string; status: string }> {
  const customer: Record<string, any> = {}

  if (params.customerEmail) customer.email = params.customerEmail
  if (params.customerFirstname) customer.firstname = params.customerFirstname
  if (params.customerLastname) customer.lastname = params.customerLastname
  if (params.customerPhone && params.customerCountry) {
    customer.phone_number = {
      number: params.customerPhone,
      country: params.customerCountry,
    }
  }

  const body: Record<string, any> = {
    description: params.description,
    amount: Math.round(params.amount),
    currency: { iso: params.currency || 'XOF' },
    callback_url: params.callbackUrl,
  }

  if (Object.keys(customer).length > 0) {
    body.customer = customer
  }

  if (params.metadata) {
    body.custom_metadata = params.metadata
  }

  const data = await fedaPayRequest(config, 'POST', '/transactions', body)
  return data.data || data
}

export async function getTransactionToken(
  config: FedaPayConfig,
  transactionId: number
): Promise<{ token: string; url: string }> {
  const data = await fedaPayRequest(config, 'POST', `/transactions/${transactionId}/token`)
  return data.data || data
}

export async function getTransaction(
  config: FedaPayConfig,
  transactionId: number
): Promise<any> {
  const data = await fedaPayRequest(config, 'GET', `/transactions/${transactionId}`)
  return data.data || data
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const computed = hmac.digest('hex')
  if (computed.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}
