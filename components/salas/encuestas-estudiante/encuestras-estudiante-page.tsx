'use client'

import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { useSession as useGoogleSession } from 'next-auth/react'
import { ReactNode, useMemo } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'

import LoginSalaEstudiante from './encuestas-estudiante-login'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'
import HeaderSala from '../header-sala'
import LoadingSalaEstudiante from '@/app/(herramientas)/sala/[idSala]/loading'

export default function EncuestasEstudiantePage({
  idSala,
  btnLogoutGoogle,
}: {
  idSala: string
  btnLoginGoogle: ReactNode
  btnLogoutGoogle: ReactNode
}) {
  const { status, data } = useGoogleSession()

  const { dni, nombre, ingresado } = useEncuestaEstudianteLogin()

  // Armamos el auth para el provider de la sala
  const auth = useMemo(
    () => ({ idSala, nombre, dni, email: data?.user?.email ?? undefined, avatar: data?.user?.image ?? undefined }),
    [idSala, nombre, dni, data?.user?.email]
  )

  if (status === 'loading') {
    return <LoadingSalaEstudiante overlay />
  }

  // Formulario de acceso
  if (!ingresado) {
    return <LoginSalaEstudiante idSala={idSala} />
  }

  // Devolvemos la página
  return (
    <EncuestaEstudianteProvider auth={auth}>
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
    </EncuestaEstudianteProvider>
  )
}
