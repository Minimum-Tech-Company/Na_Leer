'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Profile, Plan, Subscription } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Building2, User, Mail, Phone, MapPin, Hash, Globe, Scale, Upload, X, CreditCard } from 'lucide-react'

const FORME_JURIDIQUE = [
  'SARL', 'SARLU', 'SA', 'SAS', 'SASU', 'GIE', 'EI', 'Auto-entrepreneur', 'Association', 'ONG', 'Autre'
]

const VILLES_SENEGAL = [
  'Dakar', 'Thiès', 'Rufisque', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba', 'Mbour', 'Banjoul', 'Louga', 'Fatick', 'Kolda', 'Matam', 'Kaffrine', 'Kédougou', 'Sédhiou', 'Autre'
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      if (data?.logo_url) setLogoPreview(data.logo_url)

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subData) {
        setSubscription(subData)
        setCurrentPlan(subData.plans)
      } else {
        setCurrentPlan({ id: 'free', name: 'Free', price_xof: 0, max_invoices: 3, max_clients: 5, has_online_payments: false, has_auto_reminders: false, has_multi_users: false, has_api_access: false })
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('Le logo ne doit pas dépasser 2 Mo'); return }
      if (!file.type.startsWith('image/')) { alert('Le fichier doit être une image'); return }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !profile.id) return logoPreview
    setLogoUploading(true)
    const ext = logoFile.name.split('.').pop()
    const path = `${profile.id}/logo.${ext}`
    await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUploading(false)
    return data.publicUrl
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)

    let logoUrl = logoPreview
    if (logoFile) {
      logoUrl = await uploadLogo()
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        company_address: profile.company_address,
        company_phone: profile.company_phone,
        company_email: profile.company_email,
        tax_id: profile.tax_id,
        rccm: profile.rccm,
        forme_juridique: profile.forme_juridique,
        ville: profile.ville,
        pays: profile.pays,
        currency: profile.currency,
        logo_url: logoUrl,
      })
      .eq('id', profile.id)

    if (!error) {
      setSuccess(true)
      setLogoFile(null)
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
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm">
          Paramètres sauvegardés avec succès !
        </div>
      )}

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <Input
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Prénom et Nom"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l&apos;entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison sociale / Nom de l&apos;entreprise *
            </label>
            <Input
              value={profile.company_name || ''}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              placeholder="Ex: Diallo & Fils SARL"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Scale className="h-4 w-4 inline mr-1" />
                Forme juridique
              </label>
              <select
                value={profile.forme_juridique || 'SARL'}
                onChange={(e) => setProfile({ ...profile, forme_juridique: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {FORME_JURIDIQUE.map((fj) => (
                  <option key={fj} value={fj}>{fj}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hash className="h-4 w-4 inline mr-1" />
                NINEA
              </label>
              <Input
                value={profile.tax_id || ''}
                onChange={(e) => setProfile({ ...profile, tax_id: e.target.value })}
                placeholder="012345678"
                maxLength={13}
              />
              <p className="text-xs text-gray-400 mt-1">Numéro d&apos;identification fiscale</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RCCM (Registre du Commerce)
            </label>
            <Input
              value={profile.rccm || ''}
              onChange={(e) => setProfile({ ...profile, rccm: e.target.value })}
              placeholder="SN/DKR/2024/B/1234"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
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
                <Mail className="h-4 w-4 inline mr-1" />
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
              <MapPin className="h-4 w-4 inline mr-1" />
              Adresse du siège
            </label>
            <Input
              value={profile.company_address || ''}
              onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
              placeholder="123 Avenue de l'Indépendance"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <select
                value={profile.ville || 'Dakar'}
                onChange={(e) => setProfile({ ...profile, ville: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {VILLES_SENEGAL.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="h-4 w-4 inline mr-1" />
                Pays
              </label>
              <Input value={profile.pays || 'Sénégal'} disabled className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devise
              </label>
              <Input value={profile.currency || 'XOF'} disabled className="bg-gray-50" />
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de l&apos;entreprise
            </label>
            <div className="flex items-center gap-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer w-40"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="h-16 object-contain mx-auto" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null) }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Ajouter un logo</p>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400">
                <p>PNG, JPG • Max 2 Mo</p>
                <p className="mt-1">Affiché sur vos factures</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentPlan.name}</p>
                <p className="text-sm text-gray-600">
                  {currentPlan.price_xof === 0 ? 'Gratuit' : `${formatCurrency(currentPlan.price_xof)}/mois`}
                </p>
              </div>
              <Badge variant={subscription ? 'default' : 'secondary'}>
                {subscription ? 'Actif' : 'Plan gratuit'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {currentPlan.max_invoices === -1 ? 'Factures illimitées' : `${currentPlan.max_invoices} factures/mois`}</p>
              <p>• {currentPlan.max_clients === -1 ? 'Clients illimités' : `${currentPlan.max_clients} clients`}</p>
            </div>
            {currentPlan.id === 'free' && (
              <Link href="/pricing">
                <Button className="w-full">Passer au plan Pro</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || logoUploading}>
          {saving || logoUploading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}
