import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  // Check if it's a team member or invitation
  const { data: member } = await supabase
    .from('team_members')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (member) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { data: invitation } = await supabase
    .from('invitations')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (invitation) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
}
