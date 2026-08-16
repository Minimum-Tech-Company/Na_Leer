'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { downloadPDF } from '@/lib/pdf'
import { Invoice, InvoiceItem, Profile, InvoiceTemplate, Payment } from '@/types'
import { ArrowLeft, Download, Send, CreditCard, Trash2, Link2, Copy, Check, CheckCircle, CircleDollarSign, Building2, Smartphone } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
}

const paymentMethodLabels: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  mtn_mobile_money: 'MTN Mobile Money',
  moov_money: 'Moov Money',
  visa: 'Visa',
  mastercard: 'Mastercard',
  fedapay: 'FedaPay',
  card: 'Carte bancaire',
  mobile_money: 'Mobile Money',
}

function getPaymentMethodLabel(method: string): string {
  return paymentMethodLabels[method.toLowerCase()] || method
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch invoice
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (!invoiceData) {
        router.push('/invoices')
        return
      }

      // Fetch items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceData.id)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Fetch default template
      const { data: templateData } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      // Fetch payments for this invoice
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceData.id)
        .order('created_at', { ascending: false })

      setInvoice(invoiceData)
      setItems(itemsData || [])
      setProfile(profileData)
      setTemplate(templateData)
      setPayments(paymentsData || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase, params.id, router])

  const handleDownloadPDF = async () => {
    if (invoice && profile) {
      await downloadPDF(invoice, profile, items, undefined, paymentUrl || undefined)
    }
  }

  const handlePay = async () => {
    if (!invoice) return
    setPaying(true)

    try {
      const response = await fetch('/api/invoices/' + invoice.id + '/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_payment' }),
      })

      const data = await response.json()

      if (data.payment_url) {
        setPaymentUrl(data.payment_url)
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de la création du paiement'))
      }
    } catch (error) {
      alert('Erreur lors de la connexion au service de paiement')
    } finally {
      setPaying(false)
    }
  }

  const handleCopyLink = async () => {
    if (!paymentUrl) return
    await navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendEmail = async () => {
    if (!invoice || !invoice.client?.email) return
    setSendingEmail(true)

    try {
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          payment_url: paymentUrl || undefined,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('Email envoyé avec succès à ' + invoice.client.email)
        setInvoice({ ...invoice, status: 'sent' })
      } else {
        alert('Erreur: ' + (data.error || "Erreur lors de l'envoi de l'email"))
      }
    } catch {
      alert("Erreur lors de l'envoi de l'email")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    router.push('/invoices')
  }

  const handlePaymentValidation = async (status: 'paid' | 'unpaid') => {
    if (!invoice) return

    const newStatus = status === 'paid' ? 'paid' : invoice.status === 'paid' ? 'sent' : invoice.status
    const paidAt = status === 'paid' ? new Date().toISOString() : null

    await supabase
      .from('invoices')
      .update({
        payment_status: status,
        status: newStatus,
        paid_at: paidAt,
      })
      .eq('id', invoice.id)

    if (status === 'paid') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('payments').insert({
          invoice_id: invoice.id,
          user_id: user.id,
          amount: invoice.total,
          currency: invoice.currency || 'XOF',
          method: invoice.payment_method || 'offline',
          status: 'completed',
        })
      }
    }

    setInvoice({
      ...invoice,
      payment_status: status,
      status: newStatus,
      paid_at: paidAt,
    })
  }

  const handlePaymentSource = async (source: 'app' | 'offline') => {
    if (!invoice) return
    await supabase
      .from('invoices')
      .update({ payment_source: source })
      .eq('id', invoice.id)
    setInvoice({ ...invoice, payment_source: source })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <Badge variant={statusConfig[invoice.status]?.variant || 'default'}>
                {statusConfig[invoice.status]?.label}
              </Badge>
              {invoice.status === 'paid' && invoice.payment_method && (
                <Badge variant="success" className="bg-green-100 text-green-800">
                  {getPaymentMethodLabel(invoice.payment_method)}
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              {invoice.client?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail || !invoice.client?.email}
              title={!invoice.client?.email ? 'Ajoutez un email au client pour envoyer' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Envoi...' : 'Envoyer par email'}
            </Button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button onClick={handlePay} disabled={paying}>
              <CreditCard className="h-4 w-4 mr-2" />
              {paying ? 'Redirection...' : 'Payer en ligne'}
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Numéro</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date d&apos;émission</span>
              <span>{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Échéance</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Statut</span>
              <Badge variant={statusConfig[invoice.status]?.variant || 'default'}>
                {statusConfig[invoice.status]?.label}
              </Badge>
            </div>
            {invoice.status === 'paid' && invoice.paid_at && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payée le</span>
                  <span className="text-green-600 font-medium">{formatDate(invoice.paid_at)}</span>
                </div>
                {invoice.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Moyen de paiement</span>
                    <span className="font-medium text-green-600">
                      {getPaymentMethodLabel(invoice.payment_method)}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{invoice.client?.name}</p>
            {invoice.client?.email && (
              <p className="text-sm text-gray-600">{invoice.client.email}</p>
            )}
            {invoice.client?.address && (
              <p className="text-sm text-gray-600">{invoice.client.address}</p>
            )}
            {invoice.client?.city && (
              <p className="text-sm text-gray-600">{invoice.client.city}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles / Services</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-sm font-medium text-gray-600">Description</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Qté</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Prix</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Montant</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="py-3 text-sm text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA ({invoice.tax_rate}%)</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Link */}
      {paymentUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-5 w-5" />
              Lien de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Partagez ce lien avec votre client pour qu&apos;il puisse payer la facture.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentUrl}
                readOnly
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm bg-gray-50 font-mono"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copié</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copier</>
                )}
              </Button>
            </div>
            {invoice.client?.email && (
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingEmail ? 'Envoi en cours...' : `Envoyer par email à ${invoice.client.email}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Send email section */}
      {(invoice.status === 'sent' || invoice.status === 'overdue') && invoice.client?.email && !paymentUrl && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Envoi en cours...' : `Renvoyer la facture par email à ${invoice.client.email}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Validation - For Merchant */}
      {invoice.status !== 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5" />
              Validation du paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Confirmez si le paiement a été reçu et indiquez la source pour votre comptabilité.
            </p>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut du paiement</label>
              <div className="flex gap-3">
                <Button
                  variant={invoice.payment_status === 'paid' ? 'default' : 'outline'}
                  onClick={() => handlePaymentValidation('paid')}
                  className={invoice.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Payé
                </Button>
                <Button
                  variant={invoice.payment_status === 'unpaid' ? 'default' : 'outline'}
                  onClick={() => handlePaymentValidation('unpaid')}
                  className={invoice.payment_status === 'unpaid' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Non payé
                </Button>
              </div>
            </div>

            {/* Payment Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source du paiement</label>
              <div className="flex gap-3">
                <Button
                  variant={invoice.payment_source === 'app' ? 'default' : 'outline'}
                  onClick={() => handlePaymentSource('app')}
                  className={invoice.payment_source === 'app' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Via l&apos;application
                </Button>
                <Button
                  variant={invoice.payment_source === 'offline' ? 'default' : 'outline'}
                  onClick={() => handlePaymentSource('offline')}
                  className={invoice.payment_source === 'offline' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  En dehors (espèces, virement, etc.)
                </Button>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex gap-4 pt-2">
              {invoice.payment_status === 'paid' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" /> Paiement confirmé
                </Badge>
              )}
              {invoice.payment_source === 'app' && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Smartphone className="h-3 w-3 mr-1" /> Reçu via l&apos;application
                </Badge>
              )}
              {invoice.payment_source === 'offline' && (
                <Badge className="bg-orange-100 text-orange-800">
                  <Building2 className="h-3 w-3 mr-1" /> Reçu en dehors
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment methods */}
      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moyens de paiement acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Wave</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Orange Money</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Visa / Mastercard</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
