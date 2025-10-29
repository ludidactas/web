'use client'

import { oscilar } from '@/lib/animaciones'
import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { useSession as useGoogleSession } from 'next-auth/react'
import { ReactNode } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'
import DibuEstudiante from '/svg/upssvgo.svg'

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
 if (status ==='unauthenticated'&& !nombreSala){
  return<div>
    <div className="flex flex-col  items-center mb-10 justify-center">
          <LdSvg
            className="w-[300px] md:w-[500px]"
            SvgComponent={DibuEstudiante}
            ids={['signo1', 'signo2'] as const}
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)} />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">Esta sala no existe. Por favor, verifica el id de la sala</p>
        </div>
        
  </div>
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
