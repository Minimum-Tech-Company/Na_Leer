'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Eye, Download, Send, MoreHorizontal, Receipt } from 'lucide-react'
import { Invoice } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setInvoices(data || [])
      setLoading(false)
    }

    fetchInvoices()
  }, [supabase, filter])

  const handleSendInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId)

    if (!error) {
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
        )
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des factures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-600">Gérez toutes vos factures</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'Toutes' : statusConfig[status]?.label}
          </button>
        ))}
      </div>

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune facture</h3>
              <p className="text-gray-500 mb-4">Commencez par créer votre première facture</p>
              <Link href="/dashboard/invoices/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une facture
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{invoice.invoice_number}</span>
                        <Badge variant={statusConfig[invoice.status]?.variant || 'default'}>
                          {statusConfig[invoice.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {invoice.client?.name || 'Client inconnu'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Émise le {formatDate(invoice.issue_date)} · Échéance {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{formatCurrency(invoice.total, invoice.currency)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {invoice.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendInvoice(invoice.id)}
                        title="Marquer comme envoyée"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
