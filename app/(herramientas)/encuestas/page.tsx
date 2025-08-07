import EncuestasAdmin from '@/app/(herramientas)/encuestas/components/encuestas-admin'
import { EncuestaProvider } from '@/app/(herramientas)/encuestas/components/encuestas-context'
import { auth } from '@/app/auth'
import { Toaster } from '@/components/ui/sonner'
import { nombre } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'
import Image from 'next/image'
import { titulo } from '@/components/fonts'


export default async function Page() {
  const session = await auth()

  if (!session || !session.user) redirect('/login')

  return (
    <EncuestaProvider>
      <Toaster />
      <div className="min-h-screen  w-screen mx-auto flex flex-col gap-8 items-center">
        <div className='bg-white m-4 w-screen'>


        {/* Barra */}
        <div className='w-full px-4 py-6 grid grid-cols-3 items-center'>
          <div className="flex md:w-[20em] items-center gap-4">
                  <Image className="w-8 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
                  <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
                    <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
                    <p className={`${titulo.className} m-0 text-nowrap md:text-[1em]`}>Educación emergente </p>
                  </div>
                </div>
          <p className='text-3xl text-center rounded-xl'>¡Hola {nombre(session.user.name)}!</p>
          <div className='text-right items-center justify-center'>
          <SignOut />

          </div>
        </div>
        </div>
        <div className="px-20 w-4/5">
          <EncuestasAdmin />
        </div>

        <div className="w-full h-24" />
      </div>
    </EncuestaProvider>
  )
}
