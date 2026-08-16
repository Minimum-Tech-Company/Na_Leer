import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'path requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.storage.from('logos').download(path)
    if (error || !data) {
      return NextResponse.json({ error: 'Logo non trouvé' }, { status: 404 })
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mime = data.type || 'image/png'

    return NextResponse.json({
      dataUrl: `data:${mime};base64,${base64}`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Logo proxy error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
