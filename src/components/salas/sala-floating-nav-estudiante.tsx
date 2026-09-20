'use client'

import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import SalaFloatingNav from './sala-floating-nav'

/** `SalaFloatingNav` para la sala del estudiante, oculto mientras todavía no ingresó su nombre: la
 * pantalla de login (`LoginSalaEstudiante`) vive dentro del mismo layout que este switcher, así que
 * sin este gate el switcher quedaba visible encima del formulario de ingreso. */
export default function SalaFloatingNavEstudiante({ idSala }: { idSala: string }) {
  const { ingresado } = useLoginSalaEstudiante({ idSala })
  if (!ingresado) return null
  return <SalaFloatingNav idSala={idSala} basePath="/sala" />
}
