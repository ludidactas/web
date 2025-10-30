'use client'

import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { useSession as useGoogleSession } from 'next-auth/react'
import { ReactNode } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'


import LoginSalaEstudiante from './encuestas-estudiante-login'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'

export default function EncuestasEstudiantePage({
  idSala,
  btnLogoutGoogle,
}: {
  idSala: string
  btnLoginGoogle: ReactNode
  btnLogoutGoogle: ReactNode
}) {
  const { status } = useGoogleSession()

  const { dni, nombre, ingresado, nombreSala } = useEncuestaEstudianteLogin()

  if (status === 'loading') {
    return (
      <div className="w-screen h-screen place-content-center">
        <p className="text-xl md:text-6xl text-indigo-500 text-center">Cargando...</p>
      </div>
    )
  }

  // Formulario de acceso
  if (status === 'unauthenticated' && (!dni || !nombre || !ingresado)) {
    return <LoginSalaEstudiante idSala={idSala} />
  }

  // Devolvemos la página
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre={nombre} dni={dni}>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className="flex gap-2" btnLogout={status === 'authenticated' ? btnLogoutGoogle : undefined}>
          <p className="flex gap-2 justify-center items-center text-sm text-center sm:text-4xl">
            <Sparkles className=" w-4 md:w-10" />
            ¡Hola {nombreSplit(nombre)}!<Sparkles className="w-4 md:w-10" />
          </p>
        </HeaderSala>
        <div className="p-2 w-[inherit] md:p-8">
          <EncuestasEstudiante />
        </div>
      </div>
    </EncuestaEstudianteProvider>
  )
}
