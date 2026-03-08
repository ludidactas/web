import { Pasaporte } from '@/wss/validators/auth'
import { useEffect } from 'react'
import DebugPanel from '../../hooks/debug-panel'
import { StatusDeConexion, conexionWss } from './conexion-wss'
import { useSession as useSessionNext } from 'next-auth/react'
import { RolEncuesta } from '@/wss/tipos'

/** 
 * Cose la sesión de Google, si la hay, con el server de WSS.
 * @param auth No hace falta memoizarlo, lo serializamos internamente.
 */
export function useWss(auth: Pasaporte) {
  const { status: statusSesionNext } = useSessionNext()
  const { status, iniciarConexion, desconectar, socket, session, error } = conexionWss()

  const sessionReady = statusSesionNext !== 'loading'

  // Pequeño hack: prevenimos re-triggering por referencialidad
  const authKey = JSON.stringify(auth)

  // Al desmontar, desconectar
  useEffect(() => desconectar, [desconectar])

  // Trigger de conexión
  useEffect(() => {
    // 1. Si es admin o profe, esperar sesión de google
    if ((auth.rol === RolEncuesta.Admin || auth.rol === RolEncuesta.Profe) && !sessionReady) return

    // 2. Condición principal: Conectar SOLO si estamos en estado Quieto, Expirado (lo que forzó a Quieto), o Error
    const hayQueReconectar = status === StatusDeConexion.Quieto || status === StatusDeConexion.Expirado // Reintento automático tras error

    if (hayQueReconectar) {
      console.log(`✅ Dependencias listas, estado es ${status}. Iniciando conexión...`)

      // El store maneja internamente la lógica de si hay un socket activo o si debe cerrarlo (Publico -> Estudiante)
      iniciarConexion(auth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Evitamos que se re-defina la función por cambios de estado que no produzcan cambios de valor en auth
  }, [sessionReady, authKey, status, iniciarConexion])

  return {
    estado: status,
    socket,
    iniciarConexion,
    session,
    error,
    WssDebugPanel: () => DebugPanel({ data: { status, session, error, socket: { id: socket?.id }, auth } }),
  }
}
