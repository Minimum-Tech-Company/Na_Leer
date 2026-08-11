'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment } from '@/types'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPayments(data || [])
      setLoading(false)
    }

    fetchPayments()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des paiements...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-gray-600">Historique de tous vos paiements</p>
      </div>

      <Card>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Aucun paiement enregistré</p>
              <p className="text-sm text-gray-400">
                Les paiements apparaîtront ici une fois que vos clients paieront leurs factures
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Méthode</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Statut</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">{formatDate(payment.created_at)}</td>
                      <td className="py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{payment.method}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        <Badge variant={
                          payment.status === 'completed' ? 'success' :
                          payment.status === 'failed' ? 'destructive' :
                          payment.status === 'refunded' ? 'warning' : 'default'
                        }>
                          {payment.status === 'completed' ? 'Complété' :
                           payment.status === 'failed' ? 'Échoué' :
                           payment.status === 'refunded' ? 'Remboursé' : 'En attente'}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-right font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
