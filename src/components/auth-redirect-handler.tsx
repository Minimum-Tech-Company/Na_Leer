'use client'

import { useEffect } from 'react'

/**
 * Handles Supabase auth redirects that land on the site root with
 * tokens in the hash (old confirmation emails) or ?code= in the query.
 * Forwards them to /auth/callback which establishes the session.
 *
 * hashOnly : sur les pages qui ont déjà un client Supabase (ex: update-password),
 * ?code= est échangé nativement par auth-js — on forward uniquement le hash
 * (rejeté par auth-js en mode PKCE) pour éviter un double échange du code.
 */
export default function AuthRedirectHandler({ hashOnly = false }: { hashOnly?: boolean }) {
  useEffect(() => {
    const search = window.location.search
    const hash = window.location.hash

    const hasHashParams =
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      hash.includes('error=')
    const hasSearchParams =
      !hashOnly &&
      (search.includes('code=') ||
        search.includes('error=') ||
        search.includes('error_description='))

    if (!hasHashParams && !hasSearchParams) return

    const target = `/auth/callback${search}${hash}`
    window.location.replace(target)
  }, [hashOnly])

  return null
}
