import { auth, drive } from '@googleapis/drive'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

import { unstable_update } from '@/app/auth'

const opcionesRed = {
  timeout: 20_000,
  retryConfig: { retry: 3, retryDelay: 500 },
}

/** El usuario está logueado pero nunca autorizó Drive (o se la revocamos por un refresh_token inválido). */
class SinConexionDrive extends Error {
  constructor() {
    super('Drive no está conectado')
    this.name = 'SinConexionDrive'
  }
}

/**
 * Arma un cliente de la API de Drive autenticado como el usuario de la request actual.
 *
 * Lee el `driveRefreshToken` directo del JWT de sesión (vía `getToken`, sin pasar por
 * `auth()`) y lo cambia por credenciales OAuth2 de corta duración para esta llamada.
 * No valida acá si el usuario tiene habilitada la integración (`tieneIntegracionGoogle`)
 * ni si es dueño de la sala sobre la que va a operar — eso es responsabilidad del caller
 * (la ruta HTTP). Si no hay refresh token, asumimos que el usuario nunca conectó Drive.
 */
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

/** Google devuelve `invalid_grant` cuando el usuario revocó el acceso desde su cuenta, o el refresh_token expiró. */
function esGrantInvalido(e: unknown) {
  const respuesta = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
  if (respuesta) return respuesta === 'invalid_grant'

  return e instanceof Error && e.message.includes('invalid_grant')
}

/**
 * Handler de errores común para las rutas que usan `clienteDrive`.
 *
 * Si el problema es de conexión con Drive (nunca conectó, o Google invalidó el grant),
 * responde 409 y, en el caso de un grant inválido, limpia el `driveRefreshToken` de la
 * sesión (vía `unstable_update`) para que el próximo request ya sepa que hay que
 * reconectar en lugar de reintentar con un token muerto.
 */
export async function responderError(e: unknown) {
  if (e instanceof SinConexionDrive || esGrantInvalido(e)) {
    if (!(e instanceof SinConexionDrive)) await unstable_update({ driveRefreshToken: null })
    return NextResponse.json({ error: 'Drive no está conectado' }, { status: 409 })
  }

  console.error('Drive: error contra la API de Google', e)
  return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 502 })
}
