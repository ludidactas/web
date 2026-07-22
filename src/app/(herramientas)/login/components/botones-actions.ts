'use server'

import { signIn, signOut } from '@/app/auth'

export async function accionSignIn(redirectTo: string) {
  await signIn('google', { redirectTo })
}

export async function accionSignOut() {
  await signOut({ redirectTo: '/login?callbackUrl=/salas' })
}
