'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  Receipt,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Banknote,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { Invoice, Client, Payment } from '@/types'

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [planId, setPlanId] = useState<string>('free')
  const [expiryInfo, setExpiryInfo] = useState<{ daysLeft: number; expires_at: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
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

      if (activePlanId !== 'free') {
        try {
          const res = await fetch('/api/subscription/check-expiry', { method: 'POST' })
          const data = await res.json()
          if (data.active && data.daysLeft !== undefined && data.daysLeft <= 7) {
            setExpiryInfo({ daysLeft: data.daysLeft, expires_at: data.expires_at })
          }
        } catch { /* ignore */ }
      }
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

  const [dayOffset, setDayOffset] = useState(0)

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
      days.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, dateStr, amount: dayRevenue })
    }
    return days
  }, [paid, dayOffset])

  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.amount), 1)
  const canScrollLeft = dayOffset > -30
  const canScrollRight = dayOffset < 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    )
  }

  const isFreePlan = planId === 'free'

  const kpis = [
    {
      label: 'Revenus totaux',
      value: formatCurrency(totalRevenue),
      sub: `${paid.length} facture${paid.length > 1 ? 's' : ''} payée${paid.length > 1 ? 's' : ''}`,
      icon: Banknote,
      color: 'from-green-400 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'En attente',
      value: formatCurrency(totalPending),
      sub: `${sent.length} facture${sent.length > 1 ? 's' : ''}`,
      icon: Clock,
      color: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'En retard',
      value: formatCurrency(totalOverdue),
      sub: `${overdue.length} facture${overdue.length > 1 ? 's' : ''}`,
      icon: AlertTriangle,
      color: 'from-red-400 to-rose-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'Clients',
      value: clients.length.toString(),
      sub: `${invoices.length} facture${invoices.length > 1 ? 's' : ''} total`,
      icon: Users,
      color: 'from-blue-400 to-indigo-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Vue d&apos;ensemble de votre activité
            {isFreePlan && (
              <span className="ml-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                Plan Gratuit
              </span>
            )}
          </p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-blue-200/60 hover:-translate-y-0.5">
            <FileText className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Expiry banner */}
      {expiryInfo && (
        <div className={`rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${
          expiryInfo.daysLeft <= 0 ? 'bg-red-50 border border-red-200' :
          expiryInfo.daysLeft <= 3 ? 'bg-orange-50 border border-orange-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${expiryInfo.daysLeft <= 0 ? 'text-red-500' : expiryInfo.daysLeft <= 3 ? 'text-orange-500' : 'text-amber-500'}`} />
            <div>
              <p className={`text-sm font-medium ${expiryInfo.daysLeft <= 0 ? 'text-red-800' : expiryInfo.daysLeft <= 3 ? 'text-orange-800' : 'text-amber-800'}`}>
                {expiryInfo.daysLeft <= 0 ? 'Abonnement expiré' : `Expire dans ${expiryInfo.daysLeft} jour${expiryInfo.daysLeft > 1 ? 's' : ''}`}
              </p>
              <p className="text-xs text-gray-500">Renouvelez pour garder l&apos;accès complet</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button size="sm" variant={expiryInfo.daysLeft <= 0 ? 'destructive' : 'default'}>Renouveler</Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={kpi.label}
            className={`group relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${idx * 75}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1.5 text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Revenue Chart */}
      <Card className={`border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '300ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Revenus des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyRevenue.every(d => d.amount === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Aucun revenu sur cette période</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => canScrollLeft && setDayOffset(o => o - 7)}
                  disabled={!canScrollLeft}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-xs text-gray-400 font-medium">
                  {dailyRevenue[0]?.dateStr} — {dailyRevenue[6]?.dateStr}
                </span>
                <button
                  onClick={() => canScrollRight && setDayOffset(o => o + 7)}
                  disabled={!canScrollRight}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Suivant →
                </button>
              </div>
              <div className="flex items-end gap-2 h-40">
                {dailyRevenue.map((day, i) => {
                  const pct = maxDailyRevenue > 0 ? (day.amount / maxDailyRevenue) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                      <span className="text-[9px] text-gray-500 font-medium mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        {day.amount > 0 ? formatCurrency(day.amount) : ''}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500 ease-out cursor-pointer group-hover/bar:brightness-110"
                        style={{
                          height: `${Math.max(pct, 3)}%`,
                          background: day.amount > 0
                            ? `linear-gradient(to top, #3b82f6, #6366f1)`
                            : '#e5e7eb',
                          transitionDelay: `${i * 50}ms`,
                        }}
                        title={`${day.dateStr} — ${formatCurrency(day.amount)}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-2">
                {dailyRevenue.map((day, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                    {day.label}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Total période</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(dailyRevenue.reduce((s, d) => s + d.amount, 0))}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revenue by invoice + monthly comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-2 border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus par facture</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">Aucune facture pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 8).map((inv, i) => {
                  const pct = (Number(inv.total) / maxInvoiceTotal) * 100
                  const barColor = inv.status === 'paid' ? 'from-green-400 to-emerald-500'
                    : inv.status === 'overdue' ? 'from-red-400 to-rose-500'
                    : inv.status === 'sent' ? 'from-amber-400 to-orange-500'
                    : 'from-gray-300 to-gray-400'
                  return (
                    <div key={inv.id} className="flex items-center gap-3 group/row">
                      <div className="w-24 text-xs text-gray-500 truncate font-medium">{inv.invoice_number}</div>
                      <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
                        <div
                          className={`h-full rounded-lg bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%`, transitionDelay: `${i * 80}ms` }}
                        />
                      </div>
                      <div className="w-28 text-right text-sm font-semibold text-gray-700">{formatCurrency(Number(inv.total))}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '450ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ce mois-ci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Factures créées</span>
              <span className="font-bold text-gray-900">{thisMonth.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Factures payées</span>
              <span className="font-bold text-gray-900">{thisMonth.filter(i => i.status === 'paid').length}</span>
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
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg p-2.5">
                {revenueThisMonth >= revenueLastMonth ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      +{Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)}% vs mois dernier
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-red-500 rotate-180" />
                    <span className="text-red-600 font-medium">
                      {Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)}% vs mois dernier
                    </span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice status + recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '500ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statut des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Payées', count: paid.length, color: 'bg-green-500', icon: CheckCircle },
                { label: 'Envoyées', count: sent.length, color: 'bg-amber-500', icon: Clock },
                { label: 'En retard', count: overdue.length, color: 'bg-red-500', icon: XCircle },
                { label: 'Brouillons', count: draft.length, color: 'bg-gray-400', icon: FileText },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.count}</span>
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
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                  {paid.length > 0 && <div className="bg-green-500 h-full rounded-l-full transition-all duration-700" style={{ width: `${(paid.length / invoices.length) * 100}%` }} />}
                  {sent.length > 0 && <div className="bg-amber-500 h-full transition-all duration-700" style={{ width: `${(sent.length / invoices.length) * 100}%` }} />}
                  {overdue.length > 0 && <div className="bg-red-500 h-full transition-all duration-700" style={{ width: `${(overdue.length / invoices.length) * 100}%` }} />}
                  {draft.length > 0 && <div className="bg-gray-400 h-full rounded-r-full transition-all duration-700" style={{ width: `${(draft.length / invoices.length) * 100}%` }} />}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '550ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Factures récentes</CardTitle>
            <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm mb-3">Aucune facture</p>
                <Link href="/invoices/new">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Créer une facture
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
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
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/inv"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover/inv:bg-blue-50 transition-colors">
                          <Receipt className="h-4 w-4 text-gray-400 group-hover/inv:text-blue-500 transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{inv.invoice_number}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {(inv as any).client?.name || 'Sans client'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(inv.total))}</span>
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
      <Card className={`border-0 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '600ms' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Paiements récents</CardTitle>
          <Link href="/payments" className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Aucun paiement pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{payment.method === 'dexchange' ? 'Wave / Orange Money' : payment.method}</p>
                      <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
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
