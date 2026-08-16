'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Mail, Phone, MapPin, Users } from 'lucide-react'
import { Client } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
      setClients(data || [])
      setLoading(false)
    }
    fetchClients()
  }, [supabase])

  const filteredClients = clients.filter(
    (client) => client.name.toLowerCase().includes(search.toLowerCase()) || client.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/clients/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press">
            <Plus className="h-4 w-4 mr-2" /> Nouveau client
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-none">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{search ? 'Aucun résultat' : 'Aucun client'}</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">{search ? 'Essayez une autre recherche' : 'Ajoutez votre premier client pour commencer'}</p>
              {!search && (
                <Link href="/clients/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50">
                    <Plus className="h-4 w-4 mr-2" /> Ajouter un client
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, index) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full card-hover group"
                style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200/50">
                      <span className="text-sm font-bold text-white">{client.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{client.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
