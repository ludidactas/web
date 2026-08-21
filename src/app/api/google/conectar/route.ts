import { NextResponse } from 'next/server'

import { auth, signIn } from '@/app/auth'
import { AUTORIZACION } from '@/lib/google/autorizacion'
import { tieneIntegracionGoogle } from '@/server/entitlements'

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
