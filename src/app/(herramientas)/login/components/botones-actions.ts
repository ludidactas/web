'use server'

import { signIn, signOut, proveedorLogin } from '@/app/auth'
import { AUTORIZACION } from '@/lib/google/autorizacion'

/**
 * Login principal de la app. Pide `AUTORIZACION.conDrive` incondicionalmente: todo login
 * con Google solicita también el scope de Drive, sin chequear acá `tieneIntegracionGoogle`
 * (ese gate solo aplica más adelante, en las rutas que efectivamente usan Drive).
 */
export async function accionSignIn(redirectTo: string) {
  await signIn(proveedorLogin, { redirectTo }, AUTORIZACION.conDrive)
}

export async function accionSignOut() {
  await signOut({ redirectTo: '/login?callbackUrl=/salas' })
}
