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
import { logActivity } from '@/lib/activity'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; color: string }> = {
  draft: { label: 'Brouillon', variant: 'secondary', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Envoyée', variant: 'default', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', variant: 'success', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'En retard', variant: 'destructive', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', variant: 'secondary', color: 'bg-gray-100 text-gray-500' },
}

const paymentMethodLabels: Record<string, string> = {
  wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money',
  mtn_mobile_money: 'MTN Mobile Money', moov_money: 'Moov Money',
  visa: 'Visa', mastercard: 'Mastercard', fedapay: 'FedaPay',
  card: 'Carte bancaire', mobile_money: 'Mobile Money',
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

      const { data: invoiceData } = await supabase
        .from('invoices').select('*, client:clients(*)')
        .eq('id', params.id).eq('user_id', user.id).single()

      if (!invoiceData) { router.push('/invoices'); return }

      const { data: itemsData } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceData.id)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: paymentsData } = await supabase.from('payments').select('*').eq('invoice_id', invoiceData.id).order('created_at', { ascending: false })

      setInvoice(invoiceData)
      setItems(itemsData || [])
      setProfile(profileData)
      setPayments(paymentsData || [])
      setLoading(false)
    }
    fetchData()
  }, [supabase, params.id, router])

  const handleDownloadPDF = async () => {
    if (invoice && profile) await downloadPDF(invoice, profile, items, undefined, paymentUrl || undefined)
  }

  const handlePay = async () => {
    if (!invoice) return
    setPaying(true)
    try {
      const response = await fetch('/api/invoices/' + invoice.id + '/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_payment' }),
      })
      const data = await response.json()
      if (data.payment_url) setPaymentUrl(data.payment_url)
      else alert('Erreur: ' + (data.error || 'Erreur lors de la création du paiement'))
    } catch { alert('Erreur lors de la connexion au service de paiement') }
    finally { setPaying(false) }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id, payment_url: paymentUrl || undefined }),
      })
      const data = await response.json()
      if (data.success) { alert('Email envoyé avec succès à ' + invoice.client.email); setInvoice({ ...invoice, status: 'sent' }); await logActivity('sent', 'invoice', invoice.id, invoice.invoice_number) }
      else alert('Erreur: ' + (data.error || "Erreur lors de l'envoi de l'email"))
    } catch { alert("Erreur lors de l'envoi de l'email") }
    finally { setSendingEmail(false) }
  }

  const handleDelete = async () => {
    if (!invoice || !confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return
    await logActivity('deleted', 'invoice', invoice.id, invoice.invoice_number)
    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    router.push('/invoices')
  }

  const handlePaymentValidation = async (status: 'paid' | 'unpaid') => {
    if (!invoice) return
    const newStatus = status === 'paid' ? 'paid' : invoice.status === 'paid' ? 'sent' : invoice.status
    const paidAt = status === 'paid' ? new Date().toISOString() : null
    await supabase.from('invoices').update({ payment_status: status, status: newStatus, paid_at: paidAt }).eq('id', invoice.id)
    if (status === 'paid') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('payments').insert({ invoice_id: invoice.id, user_id: user.id, amount: invoice.total, currency: invoice.currency || 'XOF', method: invoice.payment_method || 'offline', status: 'completed' })
      await logActivity('paid', 'invoice', invoice.id, invoice.invoice_number, { amount: invoice.total })
    } else {
      await logActivity('status_changed', 'invoice', invoice.id, invoice.invoice_number, { new_status: newStatus })
    }
    setInvoice({ ...invoice, payment_status: status, status: newStatus, paid_at: paidAt })
  }

  const handlePaymentSource = async (source: 'app' | 'offline') => {
    if (!invoice) return
    await supabase.from('invoices').update({ payment_source: source }).eq('id', invoice.id)
    setInvoice({ ...invoice, payment_source: source })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[invoice.status]?.color}`}>
                {statusConfig[invoice.status]?.label}
              </span>
              {invoice.status === 'paid' && invoice.payment_method && (
                <Badge className="bg-green-100 text-green-700 border-0">{getPaymentMethodLabel(invoice.payment_method)}</Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{invoice.client?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadPDF} className="rounded-xl border-gray-200">
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button onClick={handleSendEmail} disabled={sendingEmail || !invoice.client?.email}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press">
              <Send className="h-4 w-4 mr-2" /> {sendingEmail ? 'Envoi...' : 'Envoyer par email'}
            </Button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button onClick={handlePay} disabled={paying}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press">
              <CreditCard className="h-4 w-4 mr-2" /> {paying ? 'Redirection...' : 'Payer en ligne'}
            </Button>
          )}
          <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Numéro', value: invoice.invoice_number },
              { label: "Date d'émission", value: formatDate(invoice.issue_date) },
              { label: 'Échéance', value: formatDate(invoice.due_date) },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
            {invoice.status === 'paid' && invoice.paid_at && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payée le</span>
                  <span className="font-medium text-green-600">{formatDate(invoice.paid_at)}</span>
                </div>
                {invoice.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Moyen de paiement</span>
                    <span className="font-medium text-green-600">{getPaymentMethodLabel(invoice.payment_method)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-sm font-bold text-white">{invoice.client?.name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{invoice.client?.name}</p>
                {invoice.client?.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
              </div>
            </div>
            {(invoice.client?.address || invoice.client?.city) && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                {invoice.client.address && <p>{invoice.client.address}</p>}
                {invoice.client.city && <p>{invoice.client.city}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Articles / Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="py-3 text-sm text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-sm text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA ({invoice.tax_rate}%)</span>
              <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
              <span className="text-gray-900">Total</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Link */}
      {paymentUrl && (
        <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Link2 className="h-4 w-4 text-blue-600" /></div>
              Lien de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Partagez ce lien avec votre client pour qu'il puisse payer la facture.</p>
            <div className="flex items-center gap-2">
              <input type="text" value={paymentUrl} readOnly className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50 font-mono" />
              <Button variant="outline" onClick={handleCopyLink} className="rounded-xl border-gray-200">
                {copied ? <><Check className="h-4 w-4 mr-2" /> Copié</> : <><Copy className="h-4 w-4 mr-2" /> Copier</>}
              </Button>
            </div>
            {invoice.client?.email && (
              <Button onClick={handleSendEmail} disabled={sendingEmail} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press">
                <Send className="h-4 w-4 mr-2" /> {sendingEmail ? 'Envoi en cours...' : `Envoyer par email à ${invoice.client.email}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Validation */}
      {invoice.status !== 'draft' && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="h-4 w-4 text-green-600" /></div>
              Validation du paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Confirmez si le paiement a été reçu et indiquez la source pour votre comptabilité.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Statut du paiement</label>
              <div className="flex gap-3">
                <Button variant={invoice.payment_status === 'paid' ? 'default' : 'outline'} onClick={() => handlePaymentValidation('paid')}
                  className={`rounded-xl ${invoice.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200/50' : 'border-gray-200'}`}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Payé
                </Button>
                <Button variant={invoice.payment_status === 'unpaid' ? 'default' : 'outline'} onClick={() => handlePaymentValidation('unpaid')}
                  className={`rounded-xl ${invoice.payment_status === 'unpaid' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200/50' : 'border-gray-200'}`}>
                  Non payé
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Source du paiement</label>
              <div className="flex gap-3">
                <Button variant={invoice.payment_source === 'app' ? 'default' : 'outline'} onClick={() => handlePaymentSource('app')}
                  className={`rounded-xl ${invoice.payment_source === 'app' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50' : 'border-gray-200'}`}>
                  <Smartphone className="h-4 w-4 mr-2" /> Via l'application
                </Button>
                <Button variant={invoice.payment_source === 'offline' ? 'default' : 'outline'} onClick={() => handlePaymentSource('offline')}
                  className={`rounded-xl ${invoice.payment_source === 'offline' ? 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200/50' : 'border-gray-200'}`}>
                  <Building2 className="h-4 w-4 mr-2" /> En dehors
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {invoice.payment_status === 'paid' && <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle className="h-3 w-3 mr-1" /> Paiement confirmé</Badge>}
              {invoice.payment_source === 'app' && <Badge className="bg-blue-100 text-blue-700 border-0"><Smartphone className="h-3 w-3 mr-1" /> Via l'application</Badge>}
              {invoice.payment_source === 'offline' && <Badge className="bg-orange-100 text-orange-700 border-0"><Building2 className="h-3 w-3 mr-1" /> En dehors</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment methods */}
      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Moyens de paiement acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Wave', color: 'bg-blue-50 text-blue-700', icon: '💙' },
                { name: 'Orange Money', color: 'bg-orange-50 text-orange-700', icon: '🟠' },
                { name: 'Visa / Mastercard', color: 'bg-purple-50 text-purple-700', icon: '💳' },
              ].map(method => (
                <div key={method.name} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${method.color} font-medium text-sm`}>
                  <span>{method.icon}</span> {method.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
