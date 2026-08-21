import { auth, drive } from '@googleapis/drive'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

import { unstable_update } from '@/app/auth'

const opcionesRed = {
  timeout: 20_000,
  retryConfig: { retry: 3, retryDelay: 500 },
}

class SinConexionDrive extends Error {
  constructor() {
    super('Drive no está conectado')
    this.name = 'SinConexionDrive'
  }
}

export async function clienteDrive(request: Request) {
  const clientId = process.env.AUTH_GOOGLE_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

  if (!clientId || !clientSecret) throw new Error('Faltan AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET')
  if (!secret) throw new Error('Falta AUTH_SECRET')

  const token = await getToken({ req: request, secret })
  if (typeof token?.driveRefreshToken !== 'string') throw new SinConexionDrive()

  const oauth = new auth.OAuth2({ clientId, clientSecret })
  oauth.setCredentials({ refresh_token: token.driveRefreshToken })

  return drive({ version: 'v3', auth: oauth, ...opcionesRed })
}

function esGrantInvalido(e: unknown) {
  const respuesta = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
  if (respuesta) return respuesta === 'invalid_grant'

  return e instanceof Error && e.message.includes('invalid_grant')
}

export async function responderError(e: unknown) {
  if (e instanceof SinConexionDrive || esGrantInvalido(e)) {
    if (!(e instanceof SinConexionDrive)) await unstable_update({ driveRefreshToken: null } as never)
    return NextResponse.json({ error: 'Drive no está conectado' }, { status: 409 })
  }

  console.error('Drive: error contra la API de Google', e)
  return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 502 })
}
