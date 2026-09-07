import { auth } from '@/app/auth'
import EncuestasProfe from '@/components/salas/encuestas-profe'
import HeaderSala from '@/components/salas/header-sala'
import { Toaster } from '@/components/ui/sonner'
import { nombreSplit } from '@/lib/utils'
import { tieneIntegracionGoogle } from '@/server/entitlements'
import { tokenWss } from '@/server/token_wss'
import { Icon } from '@iconify/react'
import Link from 'next/link'

import { ConexionProfeProvider } from '@/wss-cli/providers/wss-profe-context'
import { TituloPestanaSala } from '@/components/salas/titulo-pestana-sala'
import { SignOut } from '../../login/components/botones'

export default async function SalaPage({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  const session = await auth()
  const token = await tokenWss()
  const integracionGoogle = await tieneIntegracionGoogle(session?.user?.email)

  const headerBtns = (
    <div className="flex items-center gap-2">
      <Link href="/salas" className="text-xs sm:text-lg w-fit h-fit p-2 sm:border-4 hover:border-dashed rounded-2xl hover:transform hover:rotate-3  text-indigo-600 border-indigo-600">
        <Icon icon="mingcute:back-2-fill" className="sm:hidden w-5 h-5" />
        <span className="hidden sm:inline">Volver a Salas</span>
      </Link>
      <SignOut />
    </div>
  )

  return (
    <ConexionProfeProvider auth={{ token }} abrirSalaId={idSala}>
      <TituloPestanaSala />
      <Toaster />
      <div className="min-h-screen w-screen mx-auto flex flex-col items-center bg-ld-gradiente-fondo ">
        <HeaderSala className="animate-aparecer" btnLogout={headerBtns} waveHeight="h-[20px] md:h-[90px]">
          <p className="text-md md:text-4xl text-center rounded-xl">¡Hola {nombreSplit(session?.user?.name)}!</p>
        </HeaderSala>
        <div className="w-screen min-h-screen md:px-4">
          <EncuestasProfe integracionGoogle={integracionGoogle} driveConectado={session?.driveConectado ?? false} />
        </div>

        <div className="w-full" />
      </div>
    </ConexionProfeProvider>
  )
}
