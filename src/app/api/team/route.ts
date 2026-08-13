import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: members } = await supabase
    .from('team_members')
    .select('*, user:profiles!team_members_user_id_fkey(id, full_name, email, company_name)')
    .eq('owner_id', user.id)

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'pending')

  return NextResponse.json({ members: members || [], invitations: invitations || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { email, role = 'member' } = await request.json()

  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Check if user has Business plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub || sub.plans?.id !== 'business') {
    return NextResponse.json({ error: 'La gestion d\'équipe nécessite le plan Business' }, { status: 403 })
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', user.id)
    .eq('user_id', email)
    .single()

  if (existingMember) {
    return NextResponse.json({ error: 'Cet utilisateur est déjà membre de l\'équipe' }, { status: 400 })
  }

  // Check if already invited
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('owner_id', user.id)
    .eq('email', email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'Une invitation est déjà en attente pour cet email' }, { status: 400 })
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      owner_id: user.id,
      email,
      role,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invitation })
}
