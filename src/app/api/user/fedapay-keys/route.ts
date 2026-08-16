import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data } = await supabase
      .from('profiles')
      .select('fedaipay_api_key, fedaipay_secret_key, fedaipay_environment')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      has_api_key: !!data?.fedaipay_api_key,
      has_secret_key: !!data?.fedaipay_secret_key,
      api_key_last4: data?.fedaipay_api_key ? data.fedaipay_api_key.slice(-4) : null,
      environment: data?.fedaipay_environment || 'sandbox',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
