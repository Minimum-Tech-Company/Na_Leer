'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Receipt, CreditCard, Zap, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Stats {
  totalUsers: number
  totalInvoices: number
  totalRevenue: number
  activeSubscriptions: number
  recentInvoices: any[]
  recentPayments: any[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalInvoices: 0, totalRevenue: 0, activeSubscriptions: 0, recentInvoices: [], recentPayments: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-gray-500">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Vue d&apos;ensemble de la plateforme NA-Leer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Factures</CardTitle>
            <Receipt className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
            <CreditCard className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abonnements actifs</CardTitle>
            <Zap className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Dernières factures</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune facture</p>
            ) : (
              <div className="space-y-3">
                {stats.recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{inv.invoice_number}</span>
                      <span className="text-gray-400 ml-2">{inv.client?.name || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(inv.total)}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {inv.status === 'paid' ? 'Payée' : inv.status === 'sent' ? 'Envoyée' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Derniers paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun paiement</p>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((pay: any) => (
                  <div key={pay.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{formatCurrency(pay.amount)}</span>
                      <span className="text-gray-400 ml-2">{pay.method || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">{pay.user?.full_name || pay.user?.email || '-'}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${pay.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {pay.status === 'completed' ? 'Complété' : pay.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
