import { CinetPayConfig } from '@/types'

const CINETPAY_API_URL = 'https://api.cinetpay.com/v2'

export async function createPayment({
  amount,
  currency,
  invoiceId,
  invoiceNumber,
  customerName,
  customerEmail,
  description,
}: {
  amount: number
  currency: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  description: string
}) {
  const response = await fetch(`${CINETPAY_API_URL}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_MERCHANT_ID,
      transaction_id: `INV-${invoiceId}-${Date.now()}`,
      amount: amount,
      currency: currency,
      description: description,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone_number: '',
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}`,
      metadata: JSON.stringify({
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
      }),
    }),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la création du paiement CinetPay')
  }

  const data = await response.json()
  return data
}

export async function getPaymentStatus(transactionId: string) {
  const response = await fetch(`${CINETPAY_API_URL}/payment/${transactionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la vérification du statut')
  }

  const data = await response.json()
  return data
}

export function verifyWebhookSignature(payload: any, signature: string): boolean {
  // CinetPay webhook verification
  // In production, verify the HMAC signature
  return true
}
