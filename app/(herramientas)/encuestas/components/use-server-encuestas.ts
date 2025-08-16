'use client'
import { RolEncuesta } from '@/polls/encuestas'
import { PollsServerSession } from '@/polls/session'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { funnel, isEmpty, isNonNullish } from 'remeda'
import { ExtendedError } from 'socket.io'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conectarSocket, limpiarListeners, SocketServerAuth, solicitarAuth } from './server-encuestas'

/** Levanta la sesión guardada, valida que coincida con el usuario actual de google, y la reinicia en caso contrario */
function useSesionGuardada() {
  const [ready, setReady] = useState(false)
  const [session, saveSession] = useLocalStorage<PollsServerSession | null>("sesion-guardada", null);

  // Obtiene la sesión de next-auth
  const { data, status } = useSession()

  useEffect(() => {
    // Esperamos a que la sesión esté lista
    if (status === "loading") return

    // Si hay una sesión guardada, pero no coincide con el usuario actual, la limpiamos
    // (en caso de anónimo, ni limpiarla)
    if (session && data?.user?.email && session.username !== data?.user?.email) {
      console.log(`Sesión guardada no coincide con el usuario de google actual. Limpiando sesión guardada.`)
      saveSession(null)
    }

    setReady(true)
  }, [data?.user?.email, saveSession, session, status])

  return {
    session,
    saveSession: saveSession,
    ready
  }
}

export function useServerWebsockets({ idSala, rol }: SocketServerAuth) {

  // Chance deba convertir socket en ref en lugar de state, para tener siempre la instancia fresca.
  // const [socket, setSocket] = useState<Socket | null>(null)

  const socket = useRef<Socket | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)
  const [conectado, setConectado] = useState<boolean>(false)

  // Persistimos la sesión en localStorage
  const { session, saveSession, ready: sessionReady } = useSesionGuardada();

  const conectar = useCallback(async () => {

    // Listeners de eventos base del socket:

    const onConnect = (sock: Socket) => {
      console.log('Socket conectado:', sock.id)
      socket.current = sock
      setConectado(true)
      setConectando(false)
    }

    // Esperamos un segundo para limpiar el socket, para no cambiar el estado de la UI al actualizar la página
    const onDisconect = funnel(
      (data: { sock: Socket, reason: string }) => {
        console.log('Socket desconectado:', data.reason)
        toast.error(`Desconectado del servidor de encuestas: ${data.reason}`)
        socket.current = null
        setConectado(false)
        setConectando(false)
      },
      {
        minQuietPeriodMs: 1000,
        triggerAt: 'end',
        reducer: (prev, sock: Socket, reason: string) => ({ sock, reason })
      }
    ).call

    const onSession = (sock: Socket, { sessionId, userIp, username, rol }: PollsServerSession) => {
      console.log(`Sesión abierta: ${sessionId} para ${username} (${rol}) desde IP ${userIp}`)

      // Guardamos la sesión en localStorage para persistencia
      saveSession({ sessionId, userIp, username, rol })

      // Le attacheamos la sesión que nos mandó el server al socket local
      sock.auth = { sessionId }
    }

    const onExpired = (sock: Socket) => {
      console.warn('Sesión expirada, limpiando localStorage...')
      saveSession(null) // Limpiamos la sesión guardada
      sock.auth = {} // Limpiamos la sesión del socket

      setConectado(false)
      setConectando(false)

      setTimeout(conectar, 1000) // Reintentamos conectar después de un segundo
    }

    const onError = (sock: Socket, error: ExtendedError & { type?: string }) => {
      console.log('Error de conexión al servidor de encuestas:', error.message, JSON.stringify(error))

      // Server down
      if (error.type && error.type == 'TransportError') {
        toast.error(`El servidor de encuestas no responde. Reintentando...`)
        return
      }

      // Sesión expirada
      if (error.data && error.data.action === 'clear_session') {
        onExpired(sock) // Si el error es de sesión, limpiamos la sesión
        return
      }

      setError(`Error de conexión con el servidor de encuestas: ${error.message}`)
      setConectado(false)
      setConectando(false)
    }

    const listeners = { onConnect, onError, onDisconect, onSession, onExpired }

    try {
      // Si ya hay una sesión de ws guardada, la reutilizamos
      if (session) {

        if (rol === RolEncuesta.Estudiante) {
          console.log(`Reutilizando sesión de estudiante ${session.sessionId} para conectar al servidor de encuestas en sala ${idSala}...`)

          // Si es de estudiante, le pasamos el idSala para que se conecte al namespace correcto
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, idSala }, listeners })

        } else {
          console.log(`Reutilizando sesión de profe/admin ${session.sessionId} para conectar con token al servidor de encuestas...`)

          // Si es de profe o admin, buscamos un token de auth
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, token }, listeners })

        }

      } else {

        // Sino pedimos que nos cree una sesión nueva
        if (rol === RolEncuesta.Estudiante) {
          console.log(`Conectando como estudiante anónimo a la sala ${idSala}...`)

          // Sin token pero con idSala el estudiante
          await conectarSocket({ auth: { rol, idSala }, listeners })

        } else {
          console.log(`Conectando como profe o admin al servidor de encuestas...`)

          // Con token de auth de google el profe o admin
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, token }, listeners })

        }
      }

      // De-suscribimos los listeners al desmontar el componente
      if (isNonNullish(socket.current))
        return () => limpiarListeners(socket.current!)

    } catch (err) {

      console.error('Error de autenticación con el servidor de next:', err.message)
      toast.error(`Error de autenticación con el servidor de next: ${err.message}`)
      setError(`Error de autenticación con el servidor de next: ${err.message}`)
      setConectando(false)
      setConectado(false)
      setError(`Error de conexión con el servidor de next: ${err.message}`)

    }
  }, [idSala, rol, saveSession, session])

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {

    // Esperamos a que la sesión esté lista
    if (!sessionReady) return 

    // Si ya está conectado o conectando, no hacemos nada
    // if (conectado || conectando) return 

    // Si es para estudiante y no hay idSala, bochamos
    if (!rol || (rol === RolEncuesta.Estudiante && !idSala))
      throw new Error(`Se requiere un idSala y o rol de profe para conectarse al servidor de encuestas`)

    setConectando(true)

    console.log(`Conectando al servidor de encuestas como ${rol}... la sesión es: `, session)

    // Efectuamos la conexión
    conectar()

    // Cleanup al desmontar
    return () => {
      if (isNonNullish(socket.current)) {
        socket.current.disconnect()
        socket.current = null
        setConectado(false)
        setConectando(false)
      }
    }
  }, [sessionReady])

  return {
    socket: socket.current,
    session,
    conectando,
    conectado,
    error,
  }
}