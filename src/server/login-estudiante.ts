'use server'

import { signIn, proveedorLogin } from '@/app/auth'

/**
 * Login del estudiante en una sala `google`: solo identidad. A diferencia del login del profe
 * (`accionSignIn`), no pide permisos sobre Drive y siempre muestra el selector de cuentas: el
 * dispositivo puede ser compartido, o tener abierta la cuenta de otra persona.
 */
export async function accionSignInEstudiante(redirectTo: string) {
  await signIn(proveedorLogin, { redirectTo }, { prompt: 'select_account' })
}
