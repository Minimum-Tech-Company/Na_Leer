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
import { Invoice, InvoiceItem, Profile } from '@/types'
import { ArrowLeft, Download, Send, CreditCard, Trash2 } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
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

      setInvoice(invoiceData)
      setItems(itemsData || [])
      setProfile(profileData)
      setLoading(false)
    }

    fetchData()
  }, [supabase, params.id, router])

  const handleDownloadPDF = async () => {
    if (invoice && profile) {
      await downloadPDF(invoice, profile, items)
    }
  }

  const handlePay = async () => {
    if (!invoice) return
    setPaying(true)

    try {
      const response = await fetch('/api/invoices/' + invoice.id + '/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_payment', phone: '000000000' }),
      })

      const data = await response.json()
      console.log('Invoice payment response:', data)

      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de la création du paiement'))
        setPaying(false)
      }
    } catch (error) {
      alert('Erreur lors de la connexion au service de paiement')
      setPaying(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    router.push('/invoices')
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
            <Button onClick={async () => {
              await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoice.id)
              setInvoice({ ...invoice, status: 'sent' })
            }}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
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
            {invoice.paid_at && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payée le</span>
                <span className="text-green-600 font-medium">{formatDate(invoice.paid_at)}</span>
              </div>
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
