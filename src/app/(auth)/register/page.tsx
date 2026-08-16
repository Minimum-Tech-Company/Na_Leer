'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, Upload, Building2, User, Mail, Phone, MapPin, Hash, Globe, Scale,
  ArrowRight, ArrowLeft, Check, X, Eye, EyeOff, Lock as LockIcon
} from 'lucide-react'

const FORME_JURIDIQUE = [
  'SARL', 'SARLU', 'SA', 'SAS', 'SASU', 'GIE', 'EI', 'Auto-entrepreneur', 'Association', 'ONG', 'Autre'
]

const VILLES_SENEGAL = [
  'Dakar', 'Thiès', 'Rufisque', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba', 'Mbour', 'Banjoul', 'Louga', 'Fatick', 'Kolda', 'Matam', 'Kaffrine', 'Kédougou', 'Sédhiou', 'Autre'
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [formeJuridique, setFormeJuridique] = useState('SARL')
  const [ninea, setNinea] = useState('')
  const [rccm, setRccm] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [ville, setVille] = useState('Dakar')
  const [pays] = useState('Sénégal')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setError('Le logo ne doit pas dépasser 2 Mo'); return }
      if (!file.type.startsWith('image/')) { setError('Le fichier doit être une image'); return }
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
    await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    return data.publicUrl
  }

  const validateStep = () => {
    setError('')
    if (step === 1) {
      if (!fullName.trim()) { setError('Le nom complet est requis'); return false }
      if (!email.trim() || !email.includes('@')) { setError('Email invalide'); return false }
      if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return false }
      return true
    }
    if (step === 2) {
      if (!companyName.trim()) { setError('Le nom de l\'entreprise est requis'); return false }
      if (!ninea.trim()) { setError('Le NINEA est requis'); return false }
      if (ninea.replace(/\s/g, '').length < 9) { setError('Le NINEA doit contenir au moins 9 caractères'); return false }
      return true
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(step + 1) }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, company_name: companyName, company_phone: companyPhone } },
      })

      if (authError) {
        setError(authError.message || 'Erreur lors de l\'inscription')
        setLoading(false)
        return
      }

      if (data.user) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            full_name: fullName,
            company_name: companyName,
            forme_juridique: formeJuridique,
            tax_id: ninea.replace(/\s/g, ''),
            rccm: rccm || null,
            company_address: companyAddress,
            ville, pays,
            company_phone: companyPhone,
            company_email: companyEmail || email,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          console.error('Profile save error:', errData)
        }
      }

      setShowSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vérifiez votre email</h2>
          <p className="text-gray-500 mb-2">
            Un email de confirmation a été envoyé à <strong>{email}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Aller à la connexion
          </Link>
        </div>
      </div>
    )
  }

  const stepLabels = ['Votre compte', 'Votre entreprise', 'Coordonnées']

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">NA-Leer</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
            Rejoignez des centaines<br />d&apos;entreprises au Sénégal
          </h2>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Créez votre compte en 3 étapes simples et commencez à facturer
            professionnellement dès aujourd&apos;hui.
          </p>
          <div className="space-y-4">
            {[
              'NINEA & mentions légales sur vos factures',
              'Logo de votre entreprise sur chaque facture',
              'Paiements Wave, Orange Money & Visa',
              'Dashboard analytics en temps réel',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-blue-100">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="w-full max-w-lg">
          <div className="mb-6 sm:mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">NA-Leer</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
            <p className="text-gray-500 text-sm sm:text-base">Configurez votre entreprise en quelques étapes</p>
          </div>

          {/* Progress */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                    step > s ? 'bg-green-500 text-white scale-90' : step === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-300 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-4 text-[10px] sm:text-xs">
              {stepLabels.map((label, i) => (
                <span key={label} className={`flex-1 text-center ${step === i + 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prénom et Nom" className="pl-11 h-12 rounded-xl border-gray-200" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email professionnel *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.com" className="pl-11 h-12 rounded-xl border-gray-200" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caractères" className="pl-11 pr-11 h-12 rounded-xl border-gray-200" minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleNext} className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-blue-200" type="button">
                Continuer <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Raison sociale / Nom de l&apos;entreprise *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Diallo & Fils SARL" className="pl-11 h-12 rounded-xl border-gray-200" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Forme juridique</label>
                  <select value={formeJuridique} onChange={(e) => setFormeJuridique(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {FORME_JURIDIQUE.map((fj) => <option key={fj} value={fj}>{fj}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    NINEA *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input value={ninea} onChange={(e) => setNinea(e.target.value)} placeholder="012345678" maxLength={13} className="pl-11 h-12 rounded-xl border-gray-200" required />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Numéro d&apos;identification fiscale</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RCCM (Registre du Commerce)</label>
                <Input value={rccm} onChange={(e) => setRccm(e.target.value)} placeholder="SN/DKR/2024/B/1234" className="h-12 rounded-xl border-gray-200" />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de l&apos;entreprise</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white" onClick={() => fileInputRef.current?.click()}>
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img src={logoPreview} alt="Logo" className="h-20 object-contain mx-auto" />
                      <button onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null) }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">Ajouter votre logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG • Max 2 Mo • Affiché sur vos factures</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} type="button" className="flex-1 h-12 rounded-xl font-semibold">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
                <Button onClick={handleNext} className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-blue-200" type="button">
                  Continuer <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse du siège</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Avenue de l'Indépendance" className="pl-11 h-12 rounded-xl border-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ville *</label>
                  <select value={ville} onChange={(e) => setVille(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {VILLES_SENEGAL.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input value={pays} disabled className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+221 77 123 45 67" className="pl-11 h-12 rounded-xl border-gray-200" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email pro</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="contact@entreprise.com" className="pl-11 h-12 rounded-xl border-gray-200" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} type="button" className="flex-1 h-12 rounded-xl font-semibold">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
                <Button onClick={handleSubmit} className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-blue-200" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création...
                    </span>
                  ) : 'Créer mon compte'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 sm:mt-8 text-center pb-4">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
          <div className="text-center text-xs text-gray-400 pb-4">
            by Minimum Tech Company
          </div>
        </div>
      </div>
    </div>
  )
}
