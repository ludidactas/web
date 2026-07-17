import { Pasaporte } from '@/wss/validators/auth'
import { useEffect } from 'react'
import { StatusDeConexion, conexionWss } from './conexion-wss'
import { useSession as useSessionNext } from 'next-auth/react'
import { RolSala } from '@/wss/validators/auth'
import DebugPanel from '@/components/ui/debug-panel'

/**
 * Cose la sesión de Google, si la hay, con el server de WSS.
 * @param auth No hace falta memoizarlo, lo serializamos internamente.
 * @param opts.autoConectar Si es `false`, no conecta solo al montar: hay que llamar a `iniciarConexion` a mano
 *   (p.ej. recién cuando el usuario aprieta un botón "Crear"). Default `true`.
 */
export function useWss(auth: Pasaporte, opts?: { autoConectar?: boolean }) {
  const autoConectar = opts?.autoConectar ?? true
  const { status: statusSesionNext } = useSessionNext()
  const { status, iniciarConexion, desconectar, socket, error } = conexionWss()

  const sessionReady = statusSesionNext !== 'loading'

  // Pequeño hack: prevenimos re-triggering por referencialidad
  const authKey = JSON.stringify(auth)

  // Al desmontar, desconectar
  useEffect(() => desconectar, [desconectar])

  // Trigger de conexión
  useEffect(() => {
    if (!autoConectar) return

    // 1. Si es admin o profe, esperar sesión de google
    if ((auth.rol === RolSala.Admin || auth.rol === RolSala.Profe) && !sessionReady) return

    // 2. Condición principal: Conectar SOLO si estamos en estado Quieto
    const hayQueReconectar = status === StatusDeConexion.Quieto

    if (hayQueReconectar) {
      console.log(`✅ Dependencias listas, estado es ${status}. Iniciando conexión...`)

      // El store maneja internamente la lógica de si hay un socket activo o si debe cerrarlo (Publico -> Estudiante)
      setTimeout(() => iniciarConexion(auth), 1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Evitamos que se re-defina la función por cambios de estado que no produzcan cambios de valor en auth
  }, [autoConectar, sessionReady, authKey, status, iniciarConexion])

  return {
    estado: status,
    socket,
    iniciarConexion,
    error,
    WssDebugPanel: () => DebugPanel({ data: { status, error, socket: { id: socket?.id }, auth } }),
  }
}
