'use server'

import { signIn, signOut, proveedorLogin } from '@/app/auth'

/**
 * Login del estudiante en una sala `google`: solo identidad. A diferencia del login del profe
 * (`accionSignIn`), no pide permisos sobre Drive.
 */
export async function accionSignInEstudiante(redirectTo: string) {
  await signIn(proveedorLogin, { redirectTo })
}

/** Cierra la sesión de Google del estudiante y vuelve a la pantalla de ingreso de la sala. */
export async function accionSignOutEstudiante(redirectTo: string) {
  await signOut({ redirectTo })
}
