import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })

  // Find the invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation non trouvée ou expirée' }, { status: 404 })
  }

  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return NextResponse.json({ error: 'Invitation expirée' }, { status: 400 })
  }

  // Check email matches
  if (invitation.email !== user.email) {
    return NextResponse.json({ error: 'Cette invitation n\'est pas pour vous' }, { status: 403 })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', invitation.owner_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Vous êtes déjà membre de cette équipe' }, { status: 400 })
  }

  // Add as team member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      owner_id: invitation.owner_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  // Update invitation status
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return NextResponse.json({ success: true })
}
