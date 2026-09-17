'use client'

import { nombreSplit } from '@/lib/utils'
import HeaderSala from '../../header-sala'
import LoginSalaEstudiante from '../../encuestas-estudiante/encuestas-estudiante-login'
import LdGo from '@/components/custom/ld-go'
import { BtnAuth } from '@/components/ui/btn-auth'
import { ConexionEstudianteProvider } from '@/wss-cli/providers/wss-estudiante-context'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { ConexionPublicProvider } from '@/wss-cli/providers/wss-public-context'
import GoEstudiante from './go-estudiante'
import { BannerSalaEstudiante } from '../../banner-sala-estudiante'
import { Icon } from '@iconify/react/dist/iconify.js'

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
     <Icon className='w-8 h-8' icon={"hugeicons:logout-01"}/>
    </BtnAuth>
  )

  // El server resuelve el userId como el dni (salas por DNI) o el nombre (salas por Nombre); lo
  // replicamos acá para poder comparar "soy negro/blanco" contra `partida.negro/blanco.userId`.
  const userId = dni || nombre || ''

  return (
    <ConexionEstudianteProvider auth={{ idSala, nombre, dni, clientId }}>
      <div className="min-h-screen w-full mx-auto flex flex-col gap-4 sm:gap-8 items-center">
        <HeaderSala className="gap-2" btnLogout={btnLogoutAnonimo} waveHeight="h-[20px] md:h-[90px]">
          <p className="text-base text-center sm:text-2xl md:text-4xl">¡Hola {nombreSplit(nombre)}! </p>
        </HeaderSala>
        <div className="p-2 w-full md:p-8">
      <div className="flex flex-col md:px-12 md:mx-20 gap-4">
            <BannerSalaEstudiante
              icono={<LdGo className="w-[100px] md:w-[300px]" />}
              titulo="Go!"
              subtitulo="Sumérgete en el mundo del Go!"
              // aviso={<AvisoInvitado />}
            />

            <GoEstudiante userId={userId} />
          </div>
        </div>
      </div>
    </ConexionEstudianteProvider>
  )
}