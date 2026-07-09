'use client'

import { nombreSplit } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { ReactNode } from 'react'
import EncuestasEstudiante from './encuestas-estudiante'

import HeaderSala from '../header-sala'
import LoginSalaEstudiante from './encuestas-estudiante-login'

import { BtnAuth } from '@/components/ui/btn-auth'
import { ConexionEstudianteProvider } from '@/wss-cli/providers/wss-estudiante-context'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { ConexionPublicProvider } from '@/wss-cli/providers/wss-public-context'

export default function EncuestasEstudiantePage({
  idSala,
  btnLogoutGoogle,
}: {
  idSala: string
  btnLoginGoogle: ReactNode
  btnLogoutGoogle: ReactNode
}) {
  const { dni, nombre, clientId, ingresado, setIngresado } = useLoginSalaEstudiante({ idSala })

  // Formulario de acceso
  if (!ingresado) {
    return (
      <ConexionPublicProvider auth={{ idSala }}>
        <LoginSalaEstudiante idSala={idSala} />
      </ConexionPublicProvider>
    )
  }

  const btnLogoutAnonimo = (
    <BtnAuth
      onClick={() => {
        localStorage.setItem(`encuestas-ingresado-${idSala}`, '0')
        setIngresado(false)
      }}
    >
      Salir
    </BtnAuth>
  )

  // Devolvemos la página
  return (
    <ConexionEstudianteProvider auth={{ idSala, nombre, dni, clientId }}>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        {/* Sacamos el boton de logout de google porque no lo estamos usando */}
        <HeaderSala className="gap-2" btnLogout={btnLogoutAnonimo}>
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
