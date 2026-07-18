'use server'

import { signIn, signOut } from '@/app/auth'
import { perfilLogin } from '@/config/login'

export async function accionSignIn(redirectTo: string) {
  const { provider, credenciales } = perfilLogin
  await signIn(provider, { ...credenciales, redirectTo })
}

export async function accionSignOut() {
  await signOut({ redirectTo: '/login' })
}
