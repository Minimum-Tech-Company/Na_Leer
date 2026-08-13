'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SupportTicket, Plan } from '@/types'
import { Headphones, Send, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700' },
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [loading, setLoading] = useState(true)
  const [sendLoading, setSendLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [showForm, setShowForm] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setCurrentPlan(sub?.plans as Plan || null)

    const res = await fetch('/api/support')
    const data = await res.json()
    setTickets(data.tickets || [])
    setLoading(false)
  }

  const handleSend = async () => {
    if (!subject || !message) return
    setSendLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message, priority }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess('Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.')
      setSubject('')
      setMessage('')
      setPriority('normal')
      fetchData()
    }

    setSendLoading(false)
  }

  const isBusiness = currentPlan?.id === 'business'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600">
          {isBusiness
            ? 'Support dédié pour les clients Business. Réponse prioritaire garantie.'
            : 'Contactez notre équipe pour toute question.'}
        </p>
      </div>

      {isBusiness && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <Headphones className="h-6 w-6 text-purple-600" />
          <div>
            <p className="font-semibold text-purple-800">Support Business</p>
            <p className="text-sm text-purple-600">
              Vos tickets sont traités en priorité avec un temps de réponse garanti.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Contact form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Nouveau message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sujet *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problème de paiement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <Button onClick={handleSend} disabled={sendLoading || !subject || !message}>
              <Send className="h-4 w-4 mr-1" />
              {sendLoading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages précédents ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun message</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                    <Badge className={statusLabels[ticket.status]?.color || ''}>
                      {statusLabels[ticket.status]?.label || ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    {ticket.is_business && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Business</Badge>
                    )}
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
