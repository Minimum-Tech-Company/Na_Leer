import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return false

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || process.env.ADMIN_PASSWORD + '-jwt-secret'
    )
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
