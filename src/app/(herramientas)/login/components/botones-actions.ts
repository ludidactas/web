'use server'

import { signIn, signOut, proveedorLogin } from '@/app/auth'
import { AUTORIZACION } from '@/lib/google/autorizacion'

export async function accionSignIn(redirectTo: string) {
  await signIn(proveedorLogin, { redirectTo }, AUTORIZACION.conDrive)
}

export async function accionSignOut() {
  await signOut({ redirectTo: '/login?callbackUrl=/salas' })
}
