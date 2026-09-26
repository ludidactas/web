'use client'

import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import GoJuego from '../go-juego'
import { Icon } from '@iconify/react/dist/iconify.js'
import { AvisoInvitado } from '../../encuestas-estudiante/encuestas-estudiante'

/** Shell de Go para el estudiante: tarjeta blanca con título + aviso de invitado, el flujo real (buscar
 * contrincante, invitaciones, partida) queda en `GoJuego`. Análogo a `../go-profe/go-profe.tsx`, misma
 * mecánica, cada uno con su propia conexión (`useConexionEstudiante`/`useConexionProfe`). */
export default function GoEstudiante({ userId }: { userId: string }) {
  return <div className='flex flex-col items-center bg-white mx-10 p-10 rounded-xl'>
    <h1 className="flex gap-2 items-center text-5xl font-medium text-ld-violeta-oscuro">
      <Icon className='-rotate-3' icon={"bi:grid-3x3"} />
      Partidas
    </h1>

    <AvisoInvitado />
    <div className='my-4' />
    <GoJuego userId={userId} acciones={useConexionEstudiante()} />
  </div>
}