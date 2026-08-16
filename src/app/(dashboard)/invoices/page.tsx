'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Eye, Send, Receipt, Filter, Search } from 'lucide-react'
import { Invoice } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; color: string }> = {
  draft: { label: 'Brouillon', variant: 'secondary', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Envoyée', variant: 'default', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', variant: 'success', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'En retard', variant: 'destructive', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', variant: 'secondary', color: 'bg-gray-100 text-gray-500' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
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

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500 mt-1">{stats.total} facture{stats.total !== 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Toutes', count: stats.total, color: 'bg-gray-600' },
          { key: 'draft', label: 'Brouillons', count: stats.draft, color: 'bg-gray-400' },
          { key: 'sent', label: 'Envoyées', count: stats.sent, color: 'bg-blue-500' },
          { key: 'paid', label: 'Payées', count: stats.paid, color: 'bg-green-500' },
          { key: 'overdue', label: 'En retard', count: stats.overdue, color: 'bg-red-500' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              filter === s.key
                ? `${s.color} text-white shadow-lg`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{s.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-xs ${
              filter === s.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une facture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Invoices list */}
      {filteredInvoices.length === 0 ? (
        <Card className="border-0 shadow-none">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {search ? 'Aucun résultat' : 'Aucune facture'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {search
                  ? 'Essayez une autre recherche'
                  : 'Commencez par créer votre première facture pour vos clients'}
              </p>
              {!search && (
                <Link href="/invoices/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une facture
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice, index) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
              <Card
                className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group card-hover"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Receipt className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[invoice.status]?.color}`}>
                            {statusConfig[invoice.status]?.label}
                          </span>
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
                      <p className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
