'use server'

import { auth } from '@/app/auth'
import jwt from 'jsonwebtoken'

// Devuelve un token JWT firmado con la información del usuario autenticado 
// (para autenticarlo en el servidor de websockets)
export async function tokenWss() {
  const session = await auth()

  if (!session || !session.user || !session.user.email) {
    throw new Error('Tratando de obtener un token para el WSS pero no hay sesión!')
  }

  const token = jwt.sign(
    {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      expiresIn: '24h',
      audience: 'wss-client',
      subject: session.user.email
    }
  )
  return token
}
