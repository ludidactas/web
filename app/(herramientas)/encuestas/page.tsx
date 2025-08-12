import EncuestasAdmin from '@/app/(herramientas)/encuestas/components/encuestas-profe'
import { auth } from '@/app/auth'
import { Toaster } from '@/components/ui/sonner'
import { nombre } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'
import { EncuestaAdminProvider } from './components/encuestas-profe-context'
import HeaderSala from '../sala/components/header-sala'

export default async function Page() {
  const session = await auth()

  if (!session || !session.user || !session.user.email) redirect('/login')

  return (
    <EncuestaAdminProvider email={session.user.email}>
      <Toaster />
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
       <HeaderSala className='grid grid-cols-3'>
            <p className="text-md md:text-3xl text-center rounded-xl">¡Hola {nombre(session.user.name)}!</p>
            <div className="text-right items-center justify-center">
              <SignOut />
            </div>
       </HeaderSala>
         
        <div className="px-10 md:px-20 md:w-4/5">
          <EncuestasAdmin />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaAdminProvider>
  )
}
