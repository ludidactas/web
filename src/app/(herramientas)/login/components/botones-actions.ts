'use server'

import { signIn, signOut, proveedorLogin } from '@/app/auth'

export async function accionSignIn(redirectTo: string) {
  await signIn(proveedorLogin, { redirectTo })
}

export async function accionSignOut() {
  await signOut({ redirectTo: '/login' })
}
