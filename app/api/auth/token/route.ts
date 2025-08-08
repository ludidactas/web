import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Devuelve un token JWT firmado con la información del usuario autenticado 
// (para autenticarlo en el servidor de websockets)
export async function GET(req: Request) {
  const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!sessionToken) return new NextResponse('No autorizado', { status: 401 })
  
  const token = jwt.sign(
    {
      email: sessionToken.email,
      name: sessionToken.name,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  )
  return NextResponse.json({ token })
}
