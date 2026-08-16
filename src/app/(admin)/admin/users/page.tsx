'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/types'
import { Search, Trash2, Shield, ShieldOff, Mail, Building2 } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [supabase])

  useEffect(() => {
    if (search) {
      setFilteredUsers(users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(search.toLowerCase())
      ))
    } else {
      setFilteredUsers(users)
    }
  }, [search, users])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    setUsers(data || [])
    setFilteredUsers(data || [])
    setLoading(false)
  }

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId)

    fetchUsers()
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return

    await supabase.from('profiles').delete().eq('id', userId)
    fetchUsers()
  }

  if (loading) {
    return <div className="text-gray-500">Chargement des utilisateurs...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-600">{users.length} utilisateur(s) au total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, email ou entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {user.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name}</p>
                      {user.is_admin && (
                        <Badge className="bg-red-100 text-red-700">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </span>
                      {user.company_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {user.company_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                  >
                    {user.is_admin ? (
                      <><ShieldOff className="h-4 w-4 mr-1" /> Retirer admin</>
                    ) : (
                      <><Shield className="h-4 w-4 mr-1" /> Admin</>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
