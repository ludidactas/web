'use client'

import { ReactNode } from 'react'
import { ConexionEstudianteProvider } from '@/wss-cli/providers/wss-estudiante-context'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { ConexionPublicProvider } from '@/wss-cli/providers/wss-public-context'
import LoginSalaEstudiante from './encuestas-estudiante/encuestas-estudiante-login'

/**
 * Sostiene la conexión del estudiante (y el gate de login) a nivel de layout, para que persista al
 * navegar entre tabs de la sala (Encuestas, Go, ...). Si viviera dentro de cada página (como estaba
 * antes, duplicado en cada una), cambiar de tab desmontaría `ConexionEstudianteProvider` y con él el
 * socket entero, forzando una reconexión completa en cada toggle — a diferencia del profe, cuya
 * conexión ya vive en su layout (`salas/[idSala]/layout.tsx`) y sobrevive a la navegación entre tabs.
 */
export function SalaEstudianteConexion({ idSala, children }: { idSala: string; children: ReactNode }) {
  const { dni, nombre, clientId, ingresado } = useLoginSalaEstudiante({ idSala })

  if (!ingresado) {
    return (
      <ConexionPublicProvider auth={{ idSala }}>
        <LoginSalaEstudiante idSala={idSala} />
      </ConexionPublicProvider>
    )
  }

  return <ConexionEstudianteProvider auth={{ idSala, nombre, dni, clientId }}>{children}</ConexionEstudianteProvider>
}
