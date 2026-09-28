'use client'

import { nombreSplit } from '@/lib/utils'
import HeaderSala from '../../header-sala'
import LdGo from '@/components/custom/ld-go'
import { BtnAuth } from '@/components/ui/btn-auth'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import GoEstudiante from './go-estudiante'
import { BannerSalaEstudiante } from '../../banner-sala-estudiante'
import { Icon } from '@iconify/react/dist/iconify.js'

// El gate de login y la conexión de estudiante viven en el layout compartido (`SalaEstudianteConexion`,
// en `(nav)/layout.tsx`), no acá: así sobreviven a la navegación entre tabs de la sala (Encuestas, Go).
// Esta página solo se monta una vez que ya está `ingresado`.
export default function GoEstudiantePage({ idSala }: { idSala: string }) {
  const { dni, nombre, setIngresado } = useLoginSalaEstudiante({ idSala })

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
  )
}