'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/auth-errors'
import { FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function redirectForType(type: string | null) {
  if (type === 'recovery') {
    window.location.replace('/update-password')
  } else {
    window.location.replace('/dashboard')
  }
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const doneRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (doneRef.current) return
    doneRef.current = true

    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const hashParams = new URLSearchParams(hash)

    const rawError =
      params.get('error_description') ||
      params.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error')

    const tryRedirect = async (): Promise<boolean> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        redirectForType(hashParams.get('type') || params.get('type'))
        return true
      }
      return false
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN' || session && event === 'TOKEN_REFRESHED' || session && event === 'PASSWORD_RECOVERY') {
        if (doneRef.current === true) {
          doneRef.current = false
          subscription.unsubscribe()
          redirectForType(new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type'))
        }
      }
    })

    const run = async () => {
      const code = params.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          subscription.unsubscribe()
          setError(mapAuthError(exchangeError.message))
          return
        }
      }

      if (await tryRedirect()) {
        subscription.unsubscribe()
        return
      }

      if (rawError) {
        subscription.unsubscribe()
        setError(mapAuthError(rawError))
        return
      }

      // Wait briefly for detectSessionInUrl to process hash tokens
      setTimeout(async () => {
        if (await tryRedirect()) {
          subscription.unsubscribe()
          return
        }
        subscription.unsubscribe()
        setError(mapAuthError('confirmation_failed'))
      }, 500)
    }

    run()

    return () => subscription.unsubscribe()
  }, [supabase])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">Confirmation échouée</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <Link href="/register" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Réessayer l&apos;inscription
            </Link>
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <p className="text-gray-600 font-medium">Confirmation en cours...</p>
        <p className="text-gray-400 text-sm mt-1">Veuillez patienter</p>
      </div>
    </div>
  )
}
