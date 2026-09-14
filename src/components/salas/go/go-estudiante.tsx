'use client'

import { useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
import GoJuego from './go-juego'

export default function GoEstudiante({ userId }: { userId: string }) {
  return <GoJuego userId={userId} acciones={useConexionEstudiante()} />
}
