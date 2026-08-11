'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [debug, setDebug] = useState('')
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebug('Connexion a Supabase...')

    try {
      setDebug('Envoi de l\'inscription...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) {
        setDebug(`Erreur Supabase: ${error.message} (code: ${error.code})`)
        setError(error.message)
        setLoading(false)
        return
      }

      setDebug('Inscription reussie ! Redirection...')
      console.log('Register success:', data)

      // Force full page reload to ensure cookies are picked up
      window.location.href = '/invoices'
    } catch (err: any) {
      setDebug(`Erreur JS: ${err.message}`)
      setError('Erreur inattendue: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-blue-600 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <FileText className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Rejoignez NA-Leer</h2>
          <p className="text-blue-100 text-lg">
            Creez, envoyez et gerez vos factures en quelques clics.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">NA-Leer</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Creer un compte</h1>
            <p className="text-gray-600 mt-1">Commencez a facturer en quelques clics</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                <strong>Erreur :</strong> {error}
              </div>
            )}
            {debug && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-xs font-mono break-all">
                {debug}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creation en cours...' : 'Creer mon compte gratuit'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Deja un compte ?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
