'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Profile } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data || {})
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        company_address: profile.company_address,
        company_phone: profile.company_phone,
        company_email: profile.company_email,
        tax_id: profile.tax_id,
        currency: profile.currency,
      })
      .eq('id', profile.id)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">Configurez votre profil et vos informations d&apos;entreprise</p>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          Paramètres sauvegardés avec succès !
        </div>
      )}

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <Input
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l&apos;entreprise
            </label>
            <Input
              value={profile.company_name || ''}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              placeholder="Mon Entreprise SARL"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <Input
                value={profile.company_phone || ''}
                onChange={(e) => setProfile({ ...profile, company_phone: e.target.value })}
                placeholder="+221 77 123 45 67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email professionnel
              </label>
              <Input
                type="email"
                value={profile.company_email || ''}
                onChange={(e) => setProfile({ ...profile, company_email: e.target.value })}
                placeholder="contact@entreprise.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <Input
              value={profile.company_address || ''}
              onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
              placeholder="123 Rue Example, Dakar"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NINEA / RCCM
              </label>
              <Input
                value={profile.tax_id || ''}
                onChange={(e) => setProfile({ ...profile, tax_id: e.target.value })}
                placeholder="Votre numéro d'identification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devise
              </label>
              <Input
                value={profile.currency || 'XOF'}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}
