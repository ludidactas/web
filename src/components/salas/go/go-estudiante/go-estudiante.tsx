'use client'

import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import GoJuego from '../go-juego'
import { Icon } from '@iconify/react/dist/iconify.js'
import { AvisoInvitado } from '../../encuestas-estudiante/encuestas-estudiante'

export default function GoEstudiante({ userId }: { userId: string }) {
  return<div className='flex flex-col items-center bg-white m-10 p-10 rounded-xl'>
    <h1 className='flex justify-center gap-4 items-center text-xl md:text-4xl text-ld-violeta-oscuro'>
      <Icon className='-rotate-3' icon={"bi:grid-3x3"}/>
      Partidas
    </h1>
    <AvisoInvitado/>
    <div className='my-4'/>
<GoJuego userId={userId} acciones={useConexionEstudiante()} />

  </div> 
}