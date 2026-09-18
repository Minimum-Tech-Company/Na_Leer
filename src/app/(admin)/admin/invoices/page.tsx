'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Receipt, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/invoices')
      .then(r => r.json())
      .then(data => { setInvoices(data.invoices || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? invoices.filter(i =>
        i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        i.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        i.client?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  if (loading) return <div className="text-gray-500">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Toutes les factures</h1>
        <p className="text-gray-600">{invoices.length} facture(s) au total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par numéro, client ou utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((invoice: any) => (
          <Card key={invoice.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <Badge variant={statusConfig[invoice.status]?.variant || 'default'}>
                        {statusConfig[invoice.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {invoice.user?.full_name || 'N/A'} — {invoice.user?.email || ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(invoice.created_at)} • {invoice.client?.name || 'Client inconnu'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
