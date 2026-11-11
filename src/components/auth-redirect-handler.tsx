'use client'

import { useEffect } from 'react'

/**
 * Handles Supabase auth redirects that land on the site root with
 * tokens in the hash (old confirmation emails) or ?code= in the query.
 * Forwards them to /auth/callback which establishes the session.
 */
export default function AuthRedirectHandler() {
  useEffect(() => {
    const search = window.location.search
    const hash = window.location.hash

    const hasAuthParams =
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=') ||
      search.includes('error_description=')

    if (!hasAuthParams) return

    const target = `/auth/callback${search}${hash}`
    window.location.replace(target)
  }, [])

  return null
}
