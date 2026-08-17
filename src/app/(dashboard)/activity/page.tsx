'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, FileText, Users, CreditCard, Settings, LogOut, Crown } from 'lucide-react'
import { getActionLabel, getEntityLabel, EntityType, ActionType } from '@/lib/activity'
import { formatDate } from '@/lib/utils'

interface ActivityLog {
  id: string
  user_id: string
  action: ActionType
  entity_type: EntityType
  entity_id: string | null
  entity_name: string | null
  details: any
  created_at: string
  user?: {
    full_name: string | null
    email: string
  }
}

const ENTITY_ICONS: Record<EntityType, any> = {
  invoice: FileText,
  client: Users,
  payment: CreditCard,
  subscription: Settings,
  team: Crown,
  settings: Settings,
}

const ACTION_COLORS: Record<ActionType, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  sent: 'bg-purple-100 text-purple-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-orange-100 text-orange-700',
  invited: 'bg-indigo-100 text-indigo-700',
  removed: 'bg-red-100 text-red-700',
  status_changed: 'bg-yellow-100 text-yellow-700',
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isBusiness, setIsBusiness] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan:plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const plan = Array.isArray(sub?.plan) ? sub.plan[0] : sub?.plan
      if (plan?.id !== 'business') {
        setIsBusiness(false)
        setLoading(false)
        return
      }
      setIsBusiness(true)

      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(l => l.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        const enriched = data.map(log => ({
          ...log,
          user: profileMap.get(log.user_id) || { full_name: null, email: 'Inconnu' }
        }))
        setLogs(enriched)
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!isBusiness) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;activité</h1>
          <p className="text-gray-600">Consultez l&apos;historique des actions de votre équipe</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fonctionnalité Business
            </h3>
            <p className="text-gray-500 mb-4">
              Le journal d&apos;activité est disponible avec le plan Business (35 000 FCFA/mois)
            </p>
            <a href="/pricing">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium btn-press">
                Passer au plan Business
              </button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;activité</h1>
        <p className="text-gray-500 mt-1">{logs.length} action{logs.length > 1 ? 's' : ''} enregistrée{logs.length > 1 ? 's' : ''}</p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune activité</h3>
            <p className="text-gray-500">Les actions de votre équipe apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {logs.map((log, index) => {
                const Icon = ENTITY_ICONS[log.entity_type] || Settings
                const colorClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'

                return (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {log.user?.full_name || log.user?.email || 'Utilisateur'}
                          </span>
                          <span className={`${colorClass} text-xs px-2 py-0.5 rounded-full font-medium`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-gray-600">
                            {getEntityLabel(log.entity_type)}
                          </span>
                          {log.entity_name && (
                            <span className="font-medium text-gray-800 truncate">
                              {log.entity_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
