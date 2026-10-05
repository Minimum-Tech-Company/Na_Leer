import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvoiceEmail } from '@/lib/email'
import { createTransaction, getTransactionToken, FedaPayConfig } from '@/lib/fedapay'
import { decrypt } from '@/lib/encryption'
import { formatDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { invoice_id, payment_url } = await request.json()

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (!invoice.client?.email) {
      return NextResponse.json(
        { error: 'Ce client n\'a pas d\'adresse email. Ajoutez un email au client avant d\'envoyer.' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, fedaipay_api_key, fedaipay_secret_key, fedaipay_environment')
      .eq('id', user.id)
      .single()

    const companyName = profile?.company_name || 'Votre entreprise'

    // Generate payment link if not provided
    let finalPaymentUrl = payment_url
    if (!finalPaymentUrl && profile?.fedaipay_secret_key) {
      try {
        let secretKey: string
        try {
          secretKey = decrypt(profile.fedaipay_secret_key)
        } catch {
          secretKey = ''
        }

        if (secretKey) {
          const config: FedaPayConfig = {
            secretKey,
            environment: (profile.fedaipay_environment as 'sandbox' | 'live') || 'sandbox',
          }
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.org'
          const transaction = await createTransaction(config, {
            description: `Facture ${invoice.invoice_number}`,
            amount: invoice.total,
            currency: invoice.currency || 'XOF',
            callbackUrl: `${appUrl}/api/webhooks/fedapay`,
            customerEmail: invoice.client?.email || undefined,
            metadata: { type: 'invoice', invoice_id: invoice.id, invoice_number: invoice.invoice_number },
          })
          const tokenData = await getTransactionToken(config, transaction.id)
          finalPaymentUrl = tokenData.url
        }
      } catch (e) {
        console.error('Payment link generation failed:', e)
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://na-leer.org'
    const url = finalPaymentUrl || `${appUrl}/invoices/${invoice.id}`

    const result = await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoice_number,
      amount: `${invoice.total} ${invoice.currency || 'XOF'}`,
      dueDate: formatDate(invoice.due_date),
      paymentUrl: url,
      companyName,
    })

    if (result.success) {
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice_id)

      return NextResponse.json({ success: true, payment_url: url })
    } else {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Send invoice email error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
