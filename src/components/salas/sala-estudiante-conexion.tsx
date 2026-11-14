'use client'

import { ReactNode, useState } from 'react'
import { useTokenGoogle } from '@/wss-cli/use-token-google'
import { MetodosLogin } from '@/wss/validators/auth'
import LoadingSala from './loading-sala'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { ConexionEstudianteProvider, useConexionEstudiante } from '@/wss-cli/providers/wss-estudiante-context'
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
  const { dni, nombre, clientId, ingresado, metodoLogin } = useLoginSalaEstudiante({ idSala })

  // En una sala `google` el pasaporte lleva el token que firma Next: de ahí el server saca el email verificado.
  const esGoogle = metodoLogin === MetodosLogin.Google
  const { token, status: statusToken } = useTokenGoogle({ idSala, activo: esGoogle && ingresado })

  if (!ingresado) {
    return (
      <ConexionPublicProvider auth={{ idSala }}>
        <LoginSalaEstudiante idSala={idSala} />
      </ConexionPublicProvider>
    )
  }

  if (esGoogle && statusToken !== 'listo') return <LoadingSala overlay mensaje="Iniciando sesión..." />

  return (
    <ConexionEstudianteProvider auth={esGoogle ? { idSala, clientId, token } : { idSala, nombre, dni, clientId }}>
      <HastaPrimeraConexion>{children}</HastaPrimeraConexion>
    </ConexionEstudianteProvider>
  )
}

/**
 * Muestra la pantalla de carga hasta que la conexión se establece por primera vez (o el server la
 * rechaza y el login retoma la pantalla). Evita el frame de la sala sin conexión. Una vez conectado,
 * las caídas posteriores no desmontan la sala: sus pantallas muestran ese estado sin perder lo que tienen.
 */
function HastaPrimeraConexion({ children }: { children: ReactNode }) {
  const { estado } = useConexionEstudiante()
  const [yaConecto, setYaConecto] = useState(false)

  if (estado === StatusDeConexion.Conectado && !yaConecto) setYaConecto(true)

  const esperando = estado === StatusDeConexion.Quieto || estado === StatusDeConexion.Conectando
  if (!yaConecto && (esperando || estado === StatusDeConexion.Rechazado))
    return <LoadingSala overlay mensaje="Conectando con servidor en vivo..." />

  return children
}
