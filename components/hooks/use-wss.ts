import { Pasaporte } from '@/wss/validators/auth'
import { useEffect } from 'react'
import DebugPanel from './conexion-wss-debug'
import { StatusDeConexion, useConexionWss } from './use-conexion-wss'
import useSesionGuardada from './use-sesion-localstorage'

/** Cose la sesión storeada con el server de WSS. @warning **PASARLE UN AUTH ESTABLE**. */
export function useWss(auth: Pasaporte) {
  const { storedSession, saveSession, clearSession, ready: sessionReady } = useSesionGuardada()
  const { status, iniciarConexion, desconectar, socket, session, error } = useConexionWss()

  // Pequeño hack: prevenimos re-triggering por referencialidad
  const authKey = JSON.stringify(auth)

  // Sesión WSS guardada -- si cambia hay que cerrar/re-establecer la conexión
  const sessionIdToUse = storedSession?.sessionId

  // Al desmontar, desconectar
  useEffect(() => desconectar, [desconectar])

  // Trigger de conexión
  useEffect(() => {
    // 1. Esperar saber si hay sesión wss guardada o sesión de google
    if (!sessionReady) return

    // 2. Condición principal: Conectar SOLO si estamos en estado Quieto, Expirado (lo que forzó a Quieto), o Error
    const hayQueReconectar =
      status === StatusDeConexion.Quieto || status === StatusDeConexion.Expirado || status === StatusDeConexion.Error // Reintento automático tras error

    if (hayQueReconectar) {
      console.log(`✅ Dependencias listas, estado es ${status}. Iniciando conexión...`)

      // El store maneja internamente la lógica de si hay un socket activo o si debe cerrarlo (Publico -> Estudiante)
      iniciarConexion(auth, sessionIdToUse)
    }
  }, [sessionReady, authKey, sessionIdToUse, status, iniciarConexion])

  // Sync de la sesión (Guardado y Limpieza) -- afecta storedSession (triggerea otros effects!)
  useEffect(() => {
    if (!sessionReady) return

    // Cuando el servidor nos da una nueva sesión → persistir
    if (session) saveSession(session)

    // Cuando el status indica expiración → limpiar localStorage
    if (status === StatusDeConexion.Expirado) {
      console.log(`🧹 Sesión expirada detectada, limpiando localStorage...`)
      clearSession()
    }
    // 👇 Quitamos auth y storedSession que no se usaban dentro de este efecto.
  }, [sessionReady, session, status, saveSession, clearSession])

  return {
    estado: status,
    socket,
    iniciarConexion,
    session,
    error,
    WssDebugPanel: () => DebugPanel({ data: { status, session, error, socket: { id: socket?.id } } }),
  }
}
