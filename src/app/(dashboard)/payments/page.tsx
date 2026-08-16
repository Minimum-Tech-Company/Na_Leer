'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment } from '@/types'
import { CreditCard, TrendingUp, CheckCircle, XCircle, Clock, ArrowUpRight } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setPayments(data || [])
      setLoading(false)
    }
    fetchPayments()
  }, [supabase])

  const stats = {
    total: payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0),
    completed: payments.filter(p => p.status === 'completed').length,
    failed: payments.filter(p => p.status === 'failed').length,
    pending: payments.filter(p => p.status === 'pending').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-gray-500 mt-1">Historique de tous vos paiements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total reçu', value: formatCurrency(stats.total), icon: TrendingUp, color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-200/50' },
          { label: 'Complétés', value: stats.completed.toString(), icon: CheckCircle, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-200/50' },
          { label: 'Échoués', value: stats.failed.toString(), icon: XCircle, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-200/50' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments list */}
      <Card className="border-0 shadow-sm">
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun paiement</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Les paiements apparaîtront ici une fois que vos clients paieront leurs factures</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, i) => (
                    <tr key={payment.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-3.5 text-sm text-gray-600">{formatDate(payment.created_at)}</td>
                      <td className="py-3.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs capitalize">
                          <CreditCard className="h-3 w-3" /> {payment.method}
                        </span>
                      </td>
                      <td className="py-3.5 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          payment.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {payment.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                           payment.status === 'failed' ? <XCircle className="h-3 w-3" /> :
                           <Clock className="h-3 w-3" />}
                          {payment.status === 'completed' ? 'Complété' :
                           payment.status === 'failed' ? 'Échoué' :
                           payment.status === 'refunded' ? 'Remboursé' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3.5 text-sm text-right font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</td>
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
