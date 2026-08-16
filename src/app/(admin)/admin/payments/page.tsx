'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Payment } from '@/types'
import { Search, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  completed: { label: 'Complété', variant: 'success' },
  failed: { label: 'Échoué', variant: 'destructive' },
  refunded: { label: 'Remboursé', variant: 'secondary' },
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [supabase])

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setPayments(data || [])
    setLoading(false)
  }

  const filtered = search
    ? payments.filter(p =>
        p.method?.toLowerCase().includes(search.toLowerCase()) ||
        p.invoice_id?.toLowerCase().includes(search.toLowerCase())
      )
    : payments

  if (loading) return <div className="text-gray-500">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tous les paiements</h1>
        <p className="text-gray-600">{payments.length} paiement(s) au total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par méthode ou facture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[payment.status]?.variant || 'default'}>
                        {statusConfig[payment.status]?.label}
                      </Badge>
                      <span className="text-sm text-gray-500">{payment.method}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Facture: {payment.invoice_id} • {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
