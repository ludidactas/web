'use client'
import { PollsServerSession } from '@/wss/session'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isNonNullish } from 'remeda'
import { ExtendedError } from 'socket.io'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conectarSocket, limpiarListeners, SocketServerAuth, solicitarAuth } from './server-encuestas'
import useSesionGuardada from './use-sesion-localstorage'
import { RolEncuesta } from '@/wss/tipos'

export function useServerWebsockets({ nombre, idSala, rol, url }: SocketServerAuth & {url?: string}) {

  const socket = useRef<Socket | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)
  const [puedeConectar, setPuedeConectar] = useState<boolean>(true)

  // Persistimos la sesión en localStorage
  const { storedSession, saveSession, clearSession, ready: sessionReady } = useSesionGuardada();

  // Usamos un ref para tener el valor de la sesión siempre actualizado en los callbacks
  const session = useRef(storedSession)
  useEffect(() => {
    session.current = storedSession
  }, [storedSession])

  const conectar = useCallback(async () => {

    // Listeners de eventos base del socket:

    const onConnect = (sock: Socket) => {
      socket.current = sock
      // Si estamos conectados, bajamos los flags
      setPuedeConectar(false)
      setConectando(false)
    }

    const onDisconect = (sock: Socket, reason: string) => {
      toast.error(`Desconectado del servidor de encuestas: ${reason}`)
      setConectando(false)
    }

    const onSession = (sock: Socket, session: PollsServerSession) => {

      // Guardamos la sesión en localStorage para persistencia
      saveSession(session)

      // Le attacheamos la sesión que nos mandó el server al socket local
      sock.auth = { ...sock.auth, sessionId: session.sessionId }
    }

    const onExpired = (sock: Socket) => {
      console.warn('⚠️ Sesión expirada, limpiando localStorage...')
      clearSession() // Limpiamos la sesión guardada
      sock.auth = {} // Limpiamos la sesión del socket

      setConectando(false)

      // Reconectamos en 2 segundos
      setTimeout(() => {
        console.log('Intentado reconectar luego de sesión caduca...')
        conectar()
      }, 1000)
    }

    const onError = (sock: Socket, error: ExtendedError & { type?: string }) => {
      let msg = error.message ? `Error de conexión con el servidor de encuestas: ${error.message}`  : 'Error desconocido'

      // Server down
      if (error.message === 'xhr poll error' || (error.type && error.type === 'TransportError')) {
        msg = 'El servidor de encuestas no responde. Intentando reconectar...'
        setPuedeConectar(false)
      }

      // Sesión expirada
      if (error.data && error.data.action === 'clear_session') {
        msg = 'Sesión expirada. Reestableciendo...'
        onExpired(sock)
      }

      // Sala inexistente
      if (error.message === 'Invalid namespace') {
        // Este error lo tira el server cuando el _canal_ no existe, pero estamos diciendo que es que la sala no existe
        // Falta completar mensajes de error en el server
        msg = `Esta sala no existe! Por favor, verificá el ID`
        setPuedeConectar(false)
      }

      console.log('💥 [WSS] ', error.name, error.message, msg)
      toast.error(msg)
      setError(msg)
      setConectando(true)
    }

    const listeners = { onConnect, onError, onDisconect, onSession, onExpired }

    try {
      console.log('🚀 Iniciando conexión desde el useEffect del useServerWebsockets...')

      // Caso test va directo, sin sesión, sin idSala, nada
      if (rol === RolEncuesta.Tester) {
        await conectarSocket({ auth: { test: true, rol, url, nombre }, listeners })
        return
       }

      // Si ya hay una sesión de ws guardada, la reutilizamos
      if (session.current) {

        if (rol === RolEncuesta.Estudiante) {
          await conectarSocket({ auth: { rol, sessionId: session.current.sessionId, idSala, nombre }, listeners })

        } else {
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, sessionId: session.current.sessionId, token, nombre }, listeners })
        }

      } else {

        // Sino pedimos que nos cree una sesión nueva
        if (rol === RolEncuesta.Estudiante) {
          await conectarSocket({ auth: { rol, idSala, nombre }, listeners })

        } else {
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, token, nombre }, listeners })
        }
      }

      // De-suscribimos los listeners al desmontar el componente
      if (isNonNullish(socket.current))
        return () => limpiarListeners(socket.current!)

    } catch (err) {
      console.error('💥 Error de autenticación con el servidor de next:', err.message)
      console.error('Stack trace:', err.stack)
      toast.error(`Error de autenticación con el servidor de next: ${err.message}`)
      setError(`Error de autenticación con el servidor de next: ${err.message}`)
    }
  }, [saveSession, clearSession, rol, url, nombre, idSala])

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {

    // Esperamos a que la sesión esté lista
    if (!sessionReady) return 

    // Si ya está conectado o conectando, no hacemos nada
    if (conectando) return 

    // Si venimos de un error irrecuperable, no reconectamos
    if (!puedeConectar) return

    // Si es para estudiante y no hay idSala, bochamos
    if (!rol || (rol === RolEncuesta.Estudiante && !idSala))
      throw new Error(`Se requiere un idSala y o rol de profe para conectarse al servidor de encuestas`)

    setConectando(true)

    // Efectuamos la conexión
    conectar()

    // Cleanup al desmontar
    return () => {
      if (isNonNullish(socket.current)) {
        socket.current.disconnect()
        socket.current = null
        setConectando(false)
      }
    }
  }, [sessionReady, conectando, puedeConectar, idSala, rol, conectar])

  return {
    socket: socket.current,
    session,
    conectando,
    conectado: socket.current?.connected ?? false,
    error,
  }
}