import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Mot de passe admin non configuré sur le serveur' },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
