'use client'

import { useEffect, useState } from 'react'
import { Eye, TrendingUp } from 'lucide-react'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('nl_vid')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('nl_vid', id)
  }
  return id
}

export default function VisitCounter() {
  const [total, setTotal] = useState<number | null>(null)
  const [today, setToday] = useState<number | null>(null)

  useEffect(() => {
    const sessionId = getSessionId()

    // Record this visit
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})

    // Fetch counts and refresh every 15s
    const load = async () => {
      try {
        const res = await fetch('/api/track', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setTotal(data.total)
        setToday(data.today)
      } catch {}
    }

    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <Eye className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-gray-600">
          <span className="font-bold text-gray-900 tabular-nums">
            {total === null ? '—' : total.toLocaleString('fr-FR')}
          </span>
          {' '}visite{total !== 1 ? 's' : ''}
        </span>
      </div>

      {today !== null && today > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-gray-600">
            <span className="font-bold text-gray-900 tabular-nums">
              {today.toLocaleString('fr-FR')}
            </span>
            {' '}aujourd&apos;hui
          </span>
        </div>
      )}
    </div>
  )
}
