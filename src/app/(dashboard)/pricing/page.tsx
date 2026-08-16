'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X, CreditCard, Zap, Crown, Phone } from 'lucide-react'
import { WaveLogo, OrangeMoneyLogo, FreeMoneyLogo, VisaLogo, MastercardLogo } from '@/components/payment-logos'
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

const PROVIDERS = [
  { id: 'wave', name: 'Wave', logo: <WaveLogo className="h-7" /> },
  { id: 'orange', name: 'Orange Money', logo: <OrangeMoneyLogo className="h-7" /> },
  { id: 'free', name: 'Free Money', logo: <FreeMoneyLogo className="h-7" /> },
  { id: 'card', name: 'Carte bancaire', logo: <div className="flex gap-1"><VisaLogo className="h-6" /><MastercardLogo className="h-6" /></div> },
]

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [currentPlanId, setCurrentPlanId] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState('wave')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'waiting' | 'success' | 'error'>('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
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

  const handlePurchaseClick = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan || plan.price_xof === 0) return
    setShowPaymentModal(planId)
    setPhone('')
    setProvider('wave')
    setPaymentStatus('idle')
    setPaymentMessage('')
  }

  const handleDirectPay = async () => {
    if (!showPaymentModal) return

    if (provider !== 'card') {
      const cleanPhone = phone.replace(/\s/g, '').replace(/^221/, '')
      if (!/^[0-9]{9}$/.test(cleanPhone)) {
        setPaymentStatus('error')
        setPaymentMessage('Numéro invalide. Entrez 9 chiffres (ex: 771234567)')
        return
      }
    }

    setPaymentStatus('sending')
    setPaymentMessage('Initialisation du paiement...')

    try {
      const response = await fetch('/api/subscription/direct-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: showPaymentModal,
          phone: provider !== 'card' ? phone.replace(/\s/g, '').replace(/^221/, '') : undefined,
          provider,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPaymentStatus('error')
        setPaymentMessage(data.error || 'Erreur lors de l\'initialisation')
        return
      }

      if (data.payment_url) {
        window.location.href = data.payment_url
        return
      }
    } catch (err: unknown) {
      setPaymentStatus('error')
      setPaymentMessage(err instanceof Error ? err.message : 'Erreur de connexion')
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
                  <span className="text-3xl font-bold">{formatCurrency(plan.price_xof)}</span>
                  {plan.price_xof > 0 && <span className="text-gray-500">/mois</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{plan.max_invoices === -1 || plan.max_invoices === null ? 'Factures illimitées' : `${plan.max_invoices} factures/mois`}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{plan.max_clients === -1 || plan.max_clients === null ? 'Clients illimités' : `${plan.max_clients} clients`}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.has_online_payments ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={plan.has_online_payments ? '' : 'text-gray-400'}>
                      Paiement en ligne
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
                      onClick={() => handlePurchaseClick(plan.id)}
                    >
                      Payer {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-gray-900 mb-4 text-center">Moyens de paiement acceptés</h3>
        <div className="flex justify-center items-center gap-6 flex-wrap">
          {PROVIDERS.filter(p => p.id !== 'card').map(p => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
              {p.logo}
              <span className="text-sm font-medium text-gray-700">{p.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <div className="flex gap-1"><VisaLogo className="h-6" /><MastercardLogo className="h-6" /></div>
            <span className="text-sm font-medium text-gray-700">Carte bancaire</span>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Payer {plans.find(p => p.id === showPaymentModal)?.name}
              </h2>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(plans.find(p => p.id === showPaymentModal)?.price_xof || 0)}
              </span>
              <span className="text-gray-500">/mois</span>
            </div>

            {provider !== 'card' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">+221</span>
                  <input
                    type="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 outline-none text-sm"
                    maxLength={12}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">9 chiffres sans l&apos;indicatif pays</p>
              </div>
            )}

            {provider === 'card' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Vous serez redirigé vers la page de paiement sécurisé pour saisir vos informations bancaires.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moyen de paiement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      provider === p.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-center mb-2">{p.logo}</div>
                    <div className={`text-xs font-medium ${provider === p.id ? 'text-blue-700' : 'text-gray-600'}`}>
                      {p.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                paymentStatus === 'error' ? 'bg-red-50 text-red-700' :
                paymentStatus === 'waiting' ? 'bg-blue-50 text-blue-700' :
                paymentStatus === 'success' ? 'bg-green-50 text-green-700' :
                'bg-gray-50 text-gray-700'
              }`}>
                {paymentMessage}
              </div>
            )}

            <Button
              onClick={handleDirectPay}
              disabled={paymentStatus === 'sending' || paymentStatus === 'waiting' || (provider !== 'card' && !phone)}
              className="w-full"
            >
              {paymentStatus === 'sending' ? 'Envoi en cours...' :
               paymentStatus === 'waiting' ? 'En attente de confirmation...' :
               provider === 'card' ? 'Payer par carte' :
               'Payer maintenant'}
            </Button>

            <p className="text-xs text-center text-gray-400">
              {provider === 'card'
                ? 'Paiement sécurisé par carte bancaire (Visa / Mastercard).'
                : 'Vous recevrez une notification USSD sur votre téléphone. Confirmez le paiement directement.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
