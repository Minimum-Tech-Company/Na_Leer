import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST: record a page view (deduped per session per hour)
export async function POST(request: NextRequest) {
  try {
    const { session_id, path, referrer } = await request.json()

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Dedupe: one count per session per hour so refreshes don't inflate the number
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: recent } = await supabase
      .from('page_views')
      .select('id, created_at')
      .eq('session_id', session_id)
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (recent && recent.length > 0) {
      return NextResponse.json({ counted: false })
    }

    await supabase.from('page_views').insert({
      session_id,
      path: typeof path === 'string' ? path.slice(0, 200) : null,
      referrer: typeof referrer === 'string' ? referrer.slice(0, 200) : null,
      user_agent: request.headers.get('user-agent')?.slice(0, 200) || null,
    })

    return NextResponse.json({ counted: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Track visit error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: return visit counts
export async function GET() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [total, today] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday),
    ])

    return NextResponse.json(
      { total: total.count || 0, today: today.count || 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Visit stats error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
