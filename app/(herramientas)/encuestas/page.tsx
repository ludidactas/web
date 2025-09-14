import EncuestasAdmin from '@/app/(herramientas)/encuestas/components/encuestas-profe'
import { auth } from '@/app/auth'
import { Toaster } from '@/components/ui/sonner'
import { nombre } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'
import { EncuestaProfeProvider } from './components/encuestas-profe-context'
import HeaderSala from '../sala/components/header-sala'
import { SessionProvider } from 'next-auth/react'

export default async function Page() {
  const session = await auth()

  if (!session || !session.user || !session.user.email) redirect('/login')

  return (
    <SessionProvider>
      <EncuestaProfeProvider auth={session.user as { email: string }}>
        <Toaster />
        <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center bg-gradient-to-r from-cyan-200/70 to-indigo-200/70 ">
          <HeaderSala className="grid grid-cols-3">
            <p className="text-md md:text-3xl text-center rounded-xl">¡Hola {nombre(session.user.name)}!</p>
            <div className="text-right items-center justify-center">
              <SignOut />
            </div>
          </HeaderSala>

          <div className="md:px-20 md:w-4/5">
            <EncuestasAdmin />
          </div>
          <div className="w-full h-24" />
        </div>
      </EncuestaProfeProvider>
    </SessionProvider>
  )
}
