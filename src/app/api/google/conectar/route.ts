import { NextResponse } from 'next/server'

import { auth, signIn } from '@/app/auth'
import { AUTORIZACION } from '@/lib/google/autorizacion'
import { tieneIntegracionGoogle } from '@/server/entitlements'

/**
 * Arranca el consentimiento OAuth explícito para conectar Drive (llamado desde el popup
 * de `conectarConDrive`), gateado por el entitlement de la integración.
 *
 * `prompt: 'consent'` fuerza a Google a re-mostrar la pantalla de permisos y devolver un
 * `refresh_token` nuevo aunque el usuario ya haya autorizado antes (si no, Google puede
 * omitir el refresh_token en logins subsiguientes). `redirect: false` hace que `signIn`
 * devuelva la URL en vez de redirigir server-side, para poder redirigir nosotros mismos.
 */
export async function GET() {
  const session = await auth()
  if (!(await tieneIntegracionGoogle(session?.user?.email))) {
    return NextResponse.json({ error: 'La integración con Google no está habilitada' }, { status: 403 })
  }

  const url = await signIn(
    'google',
    { redirect: false, redirectTo: '/google/conectado' },
    { ...AUTORIZACION.conDrive, prompt: 'consent' }
  )

  return NextResponse.redirect(url)
}
