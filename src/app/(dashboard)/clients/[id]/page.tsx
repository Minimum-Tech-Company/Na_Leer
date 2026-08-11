'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { Client, Invoice } from '@/types'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Client>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (!clientData) {
        router.push('/clients')
        return
      }

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      setClient(clientData)
      setFormData(clientData)
      setInvoices(invoicesData || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase, params.id, router])

  const handleSave = async () => {
    const { error } = await supabase
      .from('clients')
      .update(formData)
      .eq('id', params.id)

    if (!error) {
      setClient(formData as Client)
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return
    await supabase.from('clients').delete().eq('id', params.id)
    router.push('/clients')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.email || 'Pas d\'email'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'Annuler' : 'Modifier'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <Input value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <Input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <Button onClick={handleSave}>Sauvegarder</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{[client.address, client.city, client.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3 text-sm">
                {client.tax_id && (
                  <div>
                    <span className="text-gray-600">NINEA: </span>
                    <span>{client.tax_id}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Pays: </span>
                  <span>{client.country || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Client depuis: </span>
                  <span>{formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Factures ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucune facture pour ce client</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{invoice.invoice_number}</span>
                    <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'destructive' : 'default'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(invoice.total, invoice.currency)}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.issue_date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
