'use client'

import { storeGo } from '@/wss-cli/stores/go-store'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import GoJuego from '../go-juego'

/** El profe juega Go con la misma mecánica que un estudiante; su identidad en las partidas es el id
 * opaco que el server le emite por `go:identidad` al abrir la sala (igual que al estudiante). */
export default function GoProfe() {
  const miId = storeGo((s) => s.miId) ?? ''
  return <GoJuego miId={miId} acciones={useConexionProfe()} />
}
