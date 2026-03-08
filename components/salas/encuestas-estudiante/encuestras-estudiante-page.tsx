'use client'

import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { useSession as useGoogleSession } from 'next-auth/react'
import { ReactNode, useMemo } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'

import HeaderSala from '../header-sala'
import LoadingSala from '../loading-sala'
import LoginSalaEstudiante from './encuestas-estudiante-login'

import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { ConexionEstudianteProvider } from '@/wss-cli/providers/wss-estudiante-context'
import { ConexionPublicProvider } from '@/wss-cli/providers/wss-public-context'

export default function EncuestasEstudiantePage({
  idSala,
  btnLogoutGoogle,
}: {
  idSala: string
  btnLoginGoogle: ReactNode
  btnLogoutGoogle: ReactNode
}) {
  const { status, data } = useGoogleSession()

  const { dni, nombre, ingresado } = useLoginSalaEstudiante({ idSala })

  if (status === 'loading') {
    return <LoadingSala overlay mensaje="Verificando sesiones existentes..." />
  }

  // Formulario de acceso
  if (!ingresado) {
    return (
      <ConexionPublicProvider auth={{ idSala }}>
        <LoginSalaEstudiante idSala={idSala} />
      </ConexionPublicProvider>
    )
  }

  // Devolvemos la página
  return (
    <ConexionEstudianteProvider
      auth={{ idSala, nombre, dni, email: data?.user?.email ?? undefined, avatar: data?.user?.image ?? undefined }}
    >
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className="gap-2" btnLogout={status === 'authenticated' ? btnLogoutGoogle : undefined}>
          <p className="flex gap-2 justify-center items-center text-sm text-center sm:text-4xl">
            <Sparkles className=" w-4 md:w-10" />
            ¡Hola {nombreSplit(nombre)}!<Sparkles className="w-4 md:w-10" />
          </p>
        </HeaderSala>
        <div className="p-2 w-[inherit] md:p-8">
          <EncuestasEstudiante idSala={idSala} />
        </div>
      </div>
    </ConexionEstudianteProvider>
  )
}
