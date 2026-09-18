import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, adminUnauthorized } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const { userId, is_admin } = await request.json()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_admin })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) return adminUnauthorized()

  const { userId } = await request.json()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
