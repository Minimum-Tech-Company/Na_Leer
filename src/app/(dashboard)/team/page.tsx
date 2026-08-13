'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamMember, Invitation, Plan } from '@/types'
import { Users, Mail, Trash2, Plus, Crown, Shield, UserMinus } from 'lucide-react'

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check plan
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setCurrentPlan(sub?.plans as Plan || null)

    // Fetch team data
    const res = await fetch('/api/team')
    const data = await res.json()
    setMembers(data.members || [])
    setInvitations(data.invitations || [])
    setLoading(false)
  }

  const handleInvite = async () => {
    if (!email) return
    setInviteLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess(`Invitation envoyée à ${email}`)
      setEmail('')
      fetchData()
    }

    setInviteLoading(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Supprimer ce membre ?')) return

    const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const isBusiness = currentPlan?.id === 'business'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!isBusiness) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-600">Gérez les membres de votre équipe</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fonctionnalité Business
            </h3>
            <p className="text-gray-500 mb-4">
              La gestion d&apos;équipe est disponible avec le plan Business (35 000 FCFA/mois)
            </p>
            <a href="/pricing">
              <Button>Passer au plan Business</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
        <p className="text-gray-600">Invitez et gérez les membres de votre équipe</p>
      </div>

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

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviter un membre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="member">Membre</option>
              <option value="admin">Admin</option>
            </select>
            <Button onClick={handleInvite} disabled={inviteLoading || !email}>
              <Plus className="h-4 w-4 mr-1" />
              {inviteLoading ? 'Envoi...' : 'Inviter'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Le membre recevra un lien d&apos;invitation par email
          </p>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun membre dans l&apos;équipe</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.full_name || 'Membre'}
                      </p>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? (
                        <><Crown className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><Shield className="h-3 w-3 mr-1" /> Membre</>
                      )}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitations en attente ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{inv.email}</p>
                    <p className="text-sm text-gray-500">
                      {inv.role === 'admin' ? 'Admin' : 'Membre'} • Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(inv.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
