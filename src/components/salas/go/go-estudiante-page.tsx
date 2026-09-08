'use client'

import { nombreSplit } from '@/lib/utils'
import HeaderSala from '../header-sala'
import LoginSalaEstudiante from '../encuestas-estudiante/encuestas-estudiante-login'

import { BtnAuth } from '@/components/ui/btn-auth'
import { ConexionEstudianteProvider } from '@/wss-cli/providers/wss-estudiante-context'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { ConexionPublicProvider } from '@/wss-cli/providers/wss-public-context'
import GoEstudiante from './go-estudiante'

export default function GoEstudiantePage({ idSala }: { idSala: string }) {
  const { dni, nombre, clientId, ingresado, setIngresado } = useLoginSalaEstudiante({ idSala })

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

  // El server resuelve el userId como el dni (salas por DNI) o el nombre (salas por Nombre); lo
  // replicamos acá para poder comparar "soy negro/blanco" contra `partida.negro/blanco.userId`.
  const userId = dni || nombre || ''

  return (
    <ConexionEstudianteProvider auth={{ idSala, nombre, dni, clientId }}>
      <div className="min-h-screen w-full mx-auto flex flex-col gap-4 sm:gap-8 items-center">
        <HeaderSala className="gap-2" btnLogout={btnLogoutAnonimo} waveHeight="h-[20px] md:h-[90px]">
          <p className="text-base text-center sm:text-2xl md:text-4xl">¡Hola {nombreSplit(nombre)}! Vamos a jugar Go</p>
        </HeaderSala>
        <div className="p-2 w-full md:p-8">
          <GoEstudiante userId={userId} />
        </div>
      </div>
    </ConexionEstudianteProvider>
  )
}
