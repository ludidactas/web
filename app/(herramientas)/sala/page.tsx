import EncuestasAdmin from '@/app/(herramientas)/sala/components/encuestas-profe'
import { auth } from '@/app/auth'
import { Toaster } from '@/components/ui/sonner'
import { nombreSplit } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'
import { EncuestaProfeProvider } from './components/encuestas-profe-context'
import HeaderSala from './components/header-sala'
import { SessionProvider } from 'next-auth/react'
import { tokenWss } from '@/server/token_wss'
import { RolEncuesta } from '@/wss/tipos'

export default async function Page() {
  const session = await auth()
  if (!session || !session.user) redirect('/login')

  const token = await tokenWss()

  return (
    <SessionProvider>
      <EncuestaProfeProvider auth={{ rol: RolEncuesta.Profe, token }}>
        <Toaster />
        <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center bg-gradient-to-r from-cyan-200/70 to-indigo-200/70 ">
           
          <HeaderSala btnLogout={<SignOut />}>
            <p className="text-md md:text-4xl text-center rounded-xl">¡Hola {nombreSplit(session.user.name)}!</p>
          </HeaderSala>

          <div className=''>
            <EncuestasAdmin />
          </div>
          <div className="w-full" />
         </div>
      </EncuestaProfeProvider>
    </SessionProvider>
  )
}
