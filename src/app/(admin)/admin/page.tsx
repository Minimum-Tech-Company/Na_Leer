'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Receipt, CreditCard, Zap } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalInvoices: number
  totalRevenue: number
  activeSubscriptions: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalInvoices: 0, totalRevenue: 0, activeSubscriptions: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [usersCount, invoicesCount, paymentsSum, subsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])

      setStats({
        totalUsers: usersCount.count || 0,
        totalInvoices: invoicesCount.count || 0,
        totalRevenue: paymentsSum.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        activeSubscriptions: subsCount.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

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
            <div className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} XOF</div>
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
    </div>
  )
}
