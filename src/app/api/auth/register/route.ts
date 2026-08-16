import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, full_name, company_name, forme_juridique, tax_id, rccm, company_address, ville, pays, company_phone, company_email } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const updateData: Record<string, any> = {}
    if (company_name) updateData.company_name = company_name
    if (forme_juridique) updateData.forme_juridique = forme_juridique
    if (tax_id) updateData.tax_id = tax_id
    if (rccm !== undefined) updateData.rccm = rccm
    if (company_address) updateData.company_address = company_address
    if (ville) updateData.ville = ville
    if (pays) updateData.pays = pays
    if (company_phone) updateData.company_phone = company_phone
    if (company_email) updateData.company_email = company_email

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id)

    if (error) {
      console.error('Profile update error:', error.message, error.details, error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('Register API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
