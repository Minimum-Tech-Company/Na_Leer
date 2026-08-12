'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X, CreditCard, Zap, Crown } from 'lucide-react'
import { Plan, Subscription } from '@/types'
import { formatCurrency } from '@/lib/utils'

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  pro: <CreditCard className="h-6 w-6" />,
  business: <Crown className="h-6 w-6" />,
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-600',
  business: 'bg-purple-100 text-purple-600',
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [currentPlanId, setCurrentPlanId] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price_xof')

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setPlans(plansData || [])
      if (subData) {
        setCurrentSubscription(subData)
        setCurrentPlanId(subData.plan_id)
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const handlePurchase = async (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan || plan.price_xof === 0) return

    setPurchasing(planId)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          amount: plan.price_xof,
          customer_name: profile?.full_name || '',
          customer_email: profile?.email || '',
        }),
      })

      const data = await response.json()

      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        alert('Erreur: ' + (data.error || 'Impossible de créer le paiement'))
        setPurchasing(null)
      }
    } catch (err) {
      alert('Erreur de connexion au service de paiement')
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des plans...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-600">Choisissez le plan qui convient à votre activité</p>
      </div>

      {currentPlanId !== 'free' && currentSubscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            <strong>Plan actif :</strong> {plans.find(p => p.id === currentPlanId)?.name || currentPlanId}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isFree = plan.price_xof === 0

          return (
            <Card key={plan.id} className={`relative ${isCurrent ? 'border-2 border-blue-600 shadow-md' : ''}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Plan actuel</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${planColors[plan.id] || ''}`}>
                  {planIcons[plan.id]}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  {isFree ? (
                    <span className="text-3xl font-bold">Gratuit</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{formatCurrency(plan.price_xof)}</span>
                      <span className="text-gray-500 text-sm">/mois</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>
                      {plan.max_invoices === -1 ? 'Factures illimitées' : `${plan.max_invoices} factures/mois`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>
                      {plan.max_clients === -1 ? 'Clients illimités' : `${plan.max_clients} clients`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.has_online_payments ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={plan.has_online_payments ? '' : 'text-gray-400'}>
                      Paiements en ligne
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.has_auto_reminders ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={plan.has_auto_reminders ? '' : 'text-gray-400'}>
                      Relances automatiques
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.has_multi_users ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={plan.has_multi_users ? '' : 'text-gray-400'}>
                      Multi-utilisateurs
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.has_api_access ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={plan.has_api_access ? '' : 'text-gray-400'}>
                      Accès API
                    </span>
                  </li>
                </ul>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Plan actuel
                    </Button>
                  ) : isFree ? (
                    <Button className="w-full" variant="outline" disabled>
                      Gratuit
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(plan.id)}
                      disabled={purchasing === plan.id}
                    >
                      {purchasing === plan.id ? 'Redirection...' : `Passer au ${plan.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-gray-900 mb-2">Moyens de paiement acceptés</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-sm">Wave</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <CreditCard className="h-5 w-5 text-orange-600" />
            <span className="text-sm">Orange Money</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span className="text-sm">Visa / Mastercard</span>
          </div>
        </div>
      </div>
    </div>
  )
}
