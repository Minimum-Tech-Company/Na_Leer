'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Receipt,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { Invoice, Client, Payment } from '@/types'

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [planId, setPlanId] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const activePlanId = sub?.plan_id || 'free'
      setPlanId(activePlanId)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      let invoiceQuery = supabase
        .from('invoices')
        .select('*, client:clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activePlanId === 'free') {
        invoiceQuery = invoiceQuery.gte('created_at', startOfMonth.toISOString())
      }

      const [invoicesRes, clientsRes, paymentsRes] = await Promise.all([
        invoiceQuery,
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])

      setInvoices(invoicesRes.data || [])
      setClients(clientsRes.data || [])
      setPayments(paymentsRes.data || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const paid = invoices.filter(i => i.status === 'paid')
  const sent = invoices.filter(i => i.status === 'sent')
  const overdue = invoices.filter(i => i.status === 'overdue')
  const draft = invoices.filter(i => i.status === 'draft')
  const totalRevenue = paid.reduce((sum, i) => sum + Number(i.total), 0)
  const totalPending = sent.reduce((sum, i) => sum + Number(i.total), 0)
  const totalOverdue = overdue.reduce((sum, i) => sum + Number(i.total), 0)

  const now = new Date()
  const thisMonth = invoices.filter(i => {
    const d = new Date(i.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const lastMonth = invoices.filter(i => {
    const d = new Date(i.created_at)
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
  })
  const revenueThisMonth = thisMonth.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0)
  const revenueLastMonth = lastMonth.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0)

  const maxInvoiceTotal = Math.max(...invoices.map(i => Number(i.total)), 1)

  // Rolling 7-day chart
  const [dayOffset, setDayOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const dailyRevenue = useMemo(() => {
    const days: { label: string; dateStr: string; amount: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + dayOffset)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${dd}`
      const dayRevenue = paid
        .filter(inv => {
          const raw = inv.paid_at || inv.created_at
          if (!raw) return false
          return raw.substring(0, 10) === dateStr
        })
        .reduce((sum, inv) => sum + Number(inv.total), 0)
      days.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        dateStr,
        amount: dayRevenue,
      })
    }
    return days
  }, [paid, dayOffset])

  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.amount), 1)

  const canScrollLeft = dayOffset > -30
  const canScrollRight = dayOffset < 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  const isFreePlan = planId === 'free'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Vue d&apos;ensemble de votre activité
            {isFreePlan && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Plan Gratuit — mois en cours
              </span>
            )}
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{paid.length} facture{paid.length > 1 ? 's' : ''} payée{paid.length > 1 ? 's' : ''}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-gray-400 mt-1">{sent.length} facture{sent.length > 1 ? 's' : ''}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">En retard</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-red-500 mt-1">{overdue.length} facture{overdue.length > 1 ? 's' : ''}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl font-bold mt-1">{clients.length}</p>
                <p className="text-xs text-gray-400 mt-1">{invoices.length} facture{invoices.length > 1 ? 's' : ''} total</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Chart - Rolling 7 days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Revenus des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyRevenue.every(d => d.amount === 0) ? (
            <p className="text-gray-400 text-center py-8">Aucun revenu sur cette période</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => canScrollLeft && setDayOffset(o => o - 7)}
                  disabled={!canScrollLeft}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  ← Semaine précédente
                </button>
                <span className="text-xs text-gray-400">
                  {dailyRevenue[0]?.dateStr} — {dailyRevenue[6]?.dateStr}
                </span>
                <button
                  onClick={() => canScrollRight && setDayOffset(o => o + 7)}
                  disabled={!canScrollRight}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Semaine suivante →
                </button>
              </div>
              <div ref={scrollRef} className="flex items-end gap-2 h-40">
                {dailyRevenue.map((day, i) => {
                  const pct = maxDailyRevenue > 0 ? (day.amount / maxDailyRevenue) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[9px] text-gray-500 font-medium mb-1">
                        {day.amount > 0 ? formatCurrency(day.amount) : ''}
                      </span>
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 cursor-pointer transition-colors"
                        style={{ height: `${Math.max(pct, 3)}%` }}
                        title={`${day.dateStr} — ${formatCurrency(day.amount)}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-2">
                {dailyRevenue.map((day, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-gray-400">
                    {day.label}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm text-gray-500">Total période</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(dailyRevenue.reduce((s, d) => s + d.amount, 0))}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revenue by invoice + monthly comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenus par facture</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune facture pour le moment</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 8).map((inv) => {
                  const pct = (Number(inv.total) / maxInvoiceTotal) * 100
                  const barColor = inv.status === 'paid' ? 'bg-green-500'
                    : inv.status === 'overdue' ? 'bg-red-500'
                    : inv.status === 'sent' ? 'bg-yellow-500'
                    : 'bg-gray-300'
                  return (
                    <div key={inv.id} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-500 truncate">{inv.invoice_number}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-28 text-right text-sm font-medium">{formatCurrency(Number(inv.total))}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ce mois-ci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Factures créées</span>
              <span className="font-semibold">{thisMonth.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Factures payées</span>
              <span className="font-semibold">{thisMonth.filter(i => i.status === 'paid').length}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Revenus ce mois</span>
                <span className="font-bold text-green-600">{formatCurrency(revenueThisMonth)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Revenus mois dernier</span>
              <span className="font-semibold text-gray-600">{formatCurrency(revenueLastMonth)}</span>
            </div>
            {revenueLastMonth > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {revenueThisMonth >= revenueLastMonth ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">
                      +{Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)}% vs mois dernier
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                    <span className="text-red-600">
                      {Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)}% vs mois dernier
                    </span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice status breakdown + recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statut des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Payées', count: paid.length, color: 'bg-green-500', icon: CheckCircle },
                { label: 'Envoyées', count: sent.length, color: 'bg-yellow-500', icon: Clock },
                { label: 'En retard', count: overdue.length, color: 'bg-red-500', icon: XCircle },
                { label: 'Brouillons', count: draft.length, color: 'bg-gray-400', icon: FileText },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.count}</span>
                      {invoices.length > 0 && (
                        <span className="text-xs text-gray-400">
                          ({Math.round((item.count / invoices.length) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {invoices.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  {paid.length > 0 && <div className="bg-green-500 h-full" style={{ width: `${(paid.length / invoices.length) * 100}%` }} />}
                  {sent.length > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(sent.length / invoices.length) * 100}%` }} />}
                  {overdue.length > 0 && <div className="bg-red-500 h-full" style={{ width: `${(overdue.length / invoices.length) * 100}%` }} />}
                  {draft.length > 0 && <div className="bg-gray-400 h-full" style={{ width: `${(draft.length / invoices.length) * 100}%` }} />}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Factures récentes</CardTitle>
            <Link href="/invoices" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-3">Aucune facture</p>
                <Link href="/invoices/new">
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Créer une facture
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv) => {
                  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
                    draft: { label: 'Brouillon', variant: 'secondary' },
                    sent: { label: 'Envoyée', variant: 'default' },
                    paid: { label: 'Payée', variant: 'success' },
                    overdue: { label: 'En retard', variant: 'destructive' },
                    cancelled: { label: 'Annulée', variant: 'secondary' },
                  }
                  const st = statusMap[inv.status] || statusMap.draft
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Receipt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.invoice_number}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {(inv as any).client?.name || 'Sans client'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        <span className="text-sm font-semibold">{formatCurrency(Number(inv.total))}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Paiements récents</CardTitle>
          <Link href="/payments" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucun paiement pour le moment</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{payment.method === 'dexchange' ? 'Wave / Orange Money' : payment.method}</p>
                      <p className="text-xs text-gray-500">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</p>
                    <Badge variant={payment.status === 'completed' ? 'success' : 'warning'} className="text-xs">
                      {payment.status === 'completed' ? 'Complété' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
