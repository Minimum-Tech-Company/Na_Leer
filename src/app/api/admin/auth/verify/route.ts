import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.ADMIN_PASSWORD + '-jwt-secret')
    const { payload } = await jwtVerify(token, secret)

    if (payload.role !== 'admin') {
      return NextResponse.json({ authenticated: false }, { status: 403 })
    }

    return NextResponse.json({ authenticated: true })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
