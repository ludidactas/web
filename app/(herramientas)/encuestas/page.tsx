import EncuestasAdmin from '@/app/(herramientas)/encuestas/components/encuestas-admin'
import { EncuestaProvider } from '@/app/(herramientas)/encuestas/components/encuestas-context'
import { auth } from '@/app/auth'
import { Toaster } from '@/components/ui/sonner'
import { nombre } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'

export default async function Page() {
  const session = await auth()

  if (!session || !session.user) redirect('/login')

  return (
    <EncuestaProvider>
      <Toaster />
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">

        {/* Barra */}
        <div className='w-full px-16 py-4 flex items-center justify-between'>
          <p>Hola {nombre(session.user.name)}!</p>
          <SignOut />
        </div>
        <div className="p-8 w-4/5">
          <EncuestasAdmin />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaProvider>
  )
}
