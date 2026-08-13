'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiKey, Plan } from '@/types'
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react'

export default function ApiDocsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
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

    const res = await fetch('/api/keys')
    const data = await res.json()
    setKeys(data.keys || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newKeyName) return
    setCreateLoading(true)
    setError('')

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
    } else {
      setNewKey(data.raw_key)
      setNewKeyName('')
      fetchData()
    }

    setCreateLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette clé API ?')) return
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    if (res.ok) fetchData()
  }

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">API &amp; Intégrations</h1>
          <p className="text-gray-600">Accédez à votre API pour des intégrations personnalisées</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fonctionnalité Business
            </h3>
            <p className="text-gray-500 mb-4">
              L&apos;accès API est disponible avec le plan Business (35 000 FCFA/mois)
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API &amp; Intégrations</h1>
        <p className="text-gray-600">Créez et gérez vos clés API pour intégrer NA-Leer à vos applications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-yellow-800">Votre clé API (affichée une seule fois)</h4>
          </div>
          <div className="flex items-center gap-2 bg-white p-3 rounded border font-mono text-sm">
            <span className="flex-1 break-all">
              {showKey ? newKey : '••••••••••••••••••••••••••••••••'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={copyKey}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-yellow-600 mt-2">
            Copiez cette clé et stockez-la en sécurité. Elle ne sera plus affichée.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKey(null)}>
            Fermer
          </Button>
        </div>
      )}

      {/* Create key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer une clé API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Nom de la clé (ex: Production, Mobile App)"
              className="flex-1"
            />
            <Button onClick={handleCreate} disabled={createLoading || !newKeyName}>
              {createLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Clés API ({keys.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune clé API créée</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{key.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{key.key_prefix}</p>
                      <p className="text-xs text-gray-400">
                        Créée le {new Date(key.created_at).toLocaleDateString('fr-FR')}
                        {key.last_used_at && ` • Dernière utilisation: ${new Date(key.last_used_at).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Désactivée'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(key.id, key.is_active)}
                    >
                      {key.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Authentification</h4>
            <p className="text-sm text-gray-600 mb-2">
              Utilisez votre clé API dans le header Authorization :
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm overflow-x-auto">
              Authorization: Bearer nkl_votre_cle_api_ici
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Endpoints</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-100 text-green-700">GET</Badge>
                  <code className="text-sm font-mono">/api/v1/invoices</code>
                </div>
                <p className="text-sm text-gray-600">Lister les factures. Params: status, page, limit</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-700">POST</Badge>
                  <code className="text-sm font-mono">/api/v1/invoices</code>
                </div>
                <p className="text-sm text-gray-600">Créer une facture. Body: client_id, items[], tax_rate, notes</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-100 text-green-700">GET</Badge>
                  <code className="text-sm font-mono">/api/v1/clients</code>
                </div>
                <p className="text-sm text-gray-600">Lister les clients. Params: page, limit</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-700">POST</Badge>
                  <code className="text-sm font-mono">/api/v1/clients</code>
                </div>
                <p className="text-sm text-gray-600">Créer un client. Body: name, email, phone, address</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Exemple avec cURL</h4>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X GET https://na-leer.vercel.app/api/v1/invoices \\
  -H "Authorization: Bearer nkl_votre_cle_api_ici"`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
