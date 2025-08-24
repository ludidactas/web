import { auth } from '@/app/auth'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

// Devuelve un token JWT firmado con la información del usuario autenticado 
// (para autenticarlo en el servidor de websockets)
export async function GET() {
  const session = await auth()

  if (!session || !session.user || !session.user.email) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  console.log("creando token...", session.user.email, session.user.name)
  
  const token = jwt.sign(
    {
      email: session.user.email,
      name: session.user.name,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  )
  return NextResponse.json({ token })
}
