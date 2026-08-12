'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { canCreateClient } from '@/lib/subscription'

export default function NewClientPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Sénégal')
  const [taxId, setTaxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [planLimit, setPlanLimit] = useState<{ allowed: boolean; reason?: string; current: number; max: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const limit = await canCreateClient(user.id)
      setPlanLimit(limit)
    }
    checkPlan()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const limitCheck = await canCreateClient(user.id)
    if (!limitCheck.allowed) {
      alert(limitCheck.reason)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('clients').insert({
      user_id: user.id,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country,
      tax_id: taxId || null,
    })

    if (!error) {
      router.push('/clients')
    } else {
      alert('Erreur lors de la création du client')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-gray-600">Ajoutez un nouveau client à votre carnet</p>
        </div>
      </div>

      {planLimit && !planLimit.allowed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Limite atteinte :</strong> {planLimit.reason}
          </p>
          <Link href="/pricing" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
            Passer au plan Pro →
          </Link>
        </div>
      )}

      {planLimit && planLimit.allowed && planLimit.max > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            {planLimit.current}/{planLimit.max} clients
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom / Raison sociale *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du client ou entreprise"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 123 45 67"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse complète"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Dakar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NINEA / SIRET
                </label>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Numéro fiscal"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/clients">
                <Button variant="outline" type="button">Annuler</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
