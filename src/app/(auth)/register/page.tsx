'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, Building2, User, Mail, Phone, MapPin, Hash, Globe, Scale, ArrowRight, ArrowLeft, Check, X } from 'lucide-react'

const FORME_JURIDIQUE = [
  'SARL', 'SARLU', 'SA', 'SAS', 'SASU', 'GIE', 'EI', 'Auto-entrepreneur', 'Association', 'ONG', 'Autre'
]

const VILLES_SENEGAL = [
  'Dakar', 'Thiès', 'Rufisque', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba', 'Mbour', 'Banjoul', 'Louga', 'Fatick', 'Kolda', 'Matam', 'Kaffrine', 'Kédougou', 'Sédhiou', 'Autre'
]

interface Step1Data {
  full_name: string
  email: string
  password: string
}

interface Step2Data {
  company_name: string
  forme_juridique: string
  ninea: string
  rccm: string
}

interface Step3Data {
  company_address: string
  ville: string
  pays: string
  company_phone: string
  company_email: string
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [step1, setStep1] = useState<Step1Data>({ full_name: '', email: '', password: '' })
  const [step2, setStep2] = useState<Step2Data>({ company_name: '', forme_juridique: 'SARL', ninea: '', rccm: '' })
  const [step3, setStep3] = useState<Step3Data>({ company_address: '', ville: 'Dakar', pays: 'Sénégal', company_phone: '', company_email: '' })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Le logo ne doit pas dépasser 2 Mo')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logoFile) return null
    const ext = logoFile.name.split('.').pop()
    const path = `${userId}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
    if (error) {
      console.error('Logo upload error:', error)
      return null
    }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    return data.publicUrl
  }

  const validateStep1 = () => {
    if (!step1.full_name.trim()) { setError('Le nom complet est requis'); return false }
    if (!step1.email.trim()) { setError('L\'email est requis'); return false }
    if (!step1.email.includes('@')) { setError('Email invalide'); return false }
    if (step1.password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return false }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (!step2.company_name.trim()) { setError('Le nom de l\'entreprise est requis'); return false }
    if (!step2.ninea.trim()) { setError('Le NINEA est requis pour les entreprises au Sénégal'); return false }
    if (step2.ninea.replace(/\s/g, '').length < 9) { setError('Le NINEA doit contenir au moins 9 caractères'); return false }
    setError('')
    return true
  }

  const handleNext = () => {
    setError('')
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: step1.email,
        password: step1.password,
        options: {
          data: {
            full_name: step1.full_name,
            company_name: step2.company_name,
            company_phone: step3.company_phone,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const logoUrl = await uploadLogo(data.user.id)

        await supabase.from('profiles').update({
          company_name: step2.company_name,
          forme_juridique: step2.forme_juridique,
          tax_id: step2.ninea.replace(/\s/g, ''),
          rccm: step2.rccm || null,
          company_address: step3.company_address,
          ville: step3.ville,
          pays: step3.pays,
          company_phone: step3.company_phone,
          company_email: step3.company_email || step1.email,
          logo_url: logoUrl,
        }).eq('id', data.user.id)
      }

      setShowSuccess(true)
      setTimeout(() => { window.location.href = '/dashboard' }, 2000)
    } catch (err: any) {
      setError('Erreur: ' + err.message)
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte créé avec succès !</h2>
          <p className="text-gray-600">Redirection vers votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-blue-600 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <FileText className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">NA-Leer</h2>
          <p className="text-blue-100 text-lg mb-8">
            Facturation professionnelle pour entreprises africaines
          </p>
          <div className="space-y-4 text-left">
            {[
              'Factures PDF avec votre logo',
              'Paiements Wave & Orange Money',
              'Suivi des paiements en temps réel',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-blue-300 flex-shrink-0" />
                <span className="text-blue-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">NA-Leer</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
            <p className="text-gray-600 mt-1">Configurez votre entreprise en quelques étapes</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mb-6 text-xs text-gray-500">
            <span className={step === 1 ? 'text-blue-600 font-medium' : ''}>Votre compte</span>
            <span className={step === 2 ? 'text-blue-600 font-medium' : ''}>Votre entreprise</span>
            <span className={step === 3 ? 'text-blue-600 font-medium' : ''}>Coordonnées</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Nom complet *
                </label>
                <Input
                  value={step1.full_name}
                  onChange={(e) => setStep1({ ...step1, full_name: e.target.value })}
                  placeholder="Prénom et Nom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email professionnel *
                </label>
                <Input
                  type="email"
                  value={step1.email}
                  onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                  placeholder="contact@entreprise.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <Input
                  type="password"
                  value={step1.password}
                  onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                  placeholder="Min. 6 caractères"
                  minLength={6}
                  required
                />
              </div>
              <Button onClick={handleNext} className="w-full" type="button">
                Continuer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Raison sociale / Nom de l&apos;entreprise *
                </label>
                <Input
                  value={step2.company_name}
                  onChange={(e) => setStep2({ ...step2, company_name: e.target.value })}
                  placeholder="Ex: Diallo & Fils SARL"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Scale className="h-4 w-4 inline mr-1" />
                    Forme juridique
                  </label>
                  <select
                    value={step2.forme_juridique}
                    onChange={(e) => setStep2({ ...step2, forme_juridique: e.target.value })}
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
                    NINEA *
                  </label>
                  <Input
                    value={step2.ninea}
                    onChange={(e) => setStep2({ ...step2, ninea: e.target.value })}
                    placeholder="012345678"
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Numéro d&apos;identification fiscale (13 chiffres)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RCCM (Registre du Commerce)
                </label>
                <Input
                  value={step2.rccm}
                  onChange={(e) => setStep2({ ...step2, rccm: e.target.value })}
                  placeholder="SN/DKR/2024/B/1234"
                />
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de l&apos;entreprise
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img src={logoPreview} alt="Logo" className="h-20 object-contain mx-auto" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null) }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour ajouter votre logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG • Max 2 Mo</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1">Sera affiché sur vos factures</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} type="button" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
                <Button onClick={handleNext} className="flex-1" type="button">
                  Continuer <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Adresse du siège
                </label>
                <Input
                  value={step3.company_address}
                  onChange={(e) => setStep3({ ...step3, company_address: e.target.value })}
                  placeholder="123 Avenue de l'Indépendance"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <select
                    value={step3.ville}
                    onChange={(e) => setStep3({ ...step3, ville: e.target.value })}
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
                  <Input value={step3.pays} disabled className="bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Téléphone *
                  </label>
                  <Input
                    value={step3.company_phone}
                    onChange={(e) => setStep3({ ...step3, company_phone: e.target.value })}
                    placeholder="+221 77 123 45 67"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email professionnel
                  </label>
                  <Input
                    type="email"
                    value={step3.company_email}
                    onChange={(e) => setStep3({ ...step3, company_email: e.target.value })}
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} type="button" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
