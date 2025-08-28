'use client'
import { RolEncuesta } from '@/polls/encuestas'
import { PollsServerSession } from '@/polls/session'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isNonNullish } from 'remeda'
import { ExtendedError } from 'socket.io'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conectarSocket, limpiarListeners, SocketServerAuth, solicitarAuth } from './server-encuestas'
import useSesionGuardada from './use-sesion-localstorage'

export function useServerWebsockets({ idSala, rol }: SocketServerAuth) {

  const socket = useRef<Socket | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)
  const [conectado, setConectado] = useState<boolean>(false)

  // Persistimos la sesión en localStorage
  const { session, saveSession, clearSession, ready: sessionReady } = useSesionGuardada();

  const conectar = useCallback(async () => {

    // Listeners de eventos base del socket:

    const onConnect = (sock: Socket) => {
      console.log('✅ Socket conectado:', sock.id)
      socket.current = sock
      setConectado(true)
      setConectando(false)
    }

    // TEMPORARILY REMOVE THE FUNNEL to see if it's causing issues
    const onDisconect = (sock: Socket, reason: string) => {
      console.log('❌ Socket desconectado inmediatamente:', reason)
      console.log('Socket auth at disconnect:', sock.auth)
      console.log('Socket connected state:', sock.connected)

      toast.error(`Desconectado del servidor de encuestas: ${reason}`)
      socket.current = null
      setConectado(false)
      setConectando(false)
    }

    const onSession = (sock: Socket, session: PollsServerSession) => {
      console.log(`✅ Sesión abierta: ${session.sessionId}`)

      // Guardamos la sesión en localStorage para persistencia
      saveSession(session)

      // Le attacheamos la sesión que nos mandó el server al socket local
      sock.auth = { ...sock.auth, sessionId: session.sessionId }
      console.log('Updated socket auth:', sock.auth)
    }

    const onExpired = (sock: Socket) => {
      console.warn('⚠️ Sesión expirada, limpiando localStorage...')
      clearSession() // Limpiamos la sesión guardada
      sock.auth = {} // Limpiamos la sesión del socket

      setConectado(false)
      setConectando(false)

      // Don't immediately reconnect to avoid infinite loops
      console.log('Intentando reconectar en 2 segundos...')
      setTimeout(() => {
        console.log('Intentado reconectar luego de sesión caduca...')
        conectar()
      }, 2000)
    }

    const onError = (sock: Socket, error: ExtendedError & { type?: string }) => {
      console.log('🔥 Error de conexión al servidor de encuestas:', error.message)
      console.log('Error details:', JSON.stringify(error, null, 2))
      console.log('Socket state:', {
        connected: sock.connected,
        disconnected: sock.disconnected,
        auth: sock.auth
      })

      // Sesión expirada
      if (error.data && error.data.action === 'clear_session') {
        console.warn('Sesión expirada, delegando a onExpired...')
        onExpired(sock)
        return
      }

      // Sala inexistente
      if (error.message === 'Invalid namespace') {
        toast.error(`Esta sala no existe! Por favor, verificá el ID.`)
        setError('Esta sala no existe! Por favor, verificá el ID.')
        setConectado(false)
        setConectando(false)
        return
      }

      // Server down
      if (error.type && error.type === 'TransportError') {
        toast.error(`El servidor de encuestas no responde. Reintentando...`)
        setError('El servidor de encuestas no responde. Reintentando...')
        setConectado(false)
        return
      }

      setError(`Error de conexión con el servidor de encuestas: ${error.message}`)
      setConectado(false)
      setConectando(false)
    }

    const listeners = { onConnect, onError, onDisconect, onSession, onExpired }

    try {
      console.log('🚀 Iniciando conexión...')
      console.log('Session data:', session)
      console.log('Rol:', rol, 'IdSala:', idSala)

      // Caso test va directo, sin sesión, sin idSala, nada
      if (rol === RolEncuesta.Tester) {
        await conectarSocket({ auth: { rol }, listeners })
        return
       }

      // Si ya hay una sesión de ws guardada, la reutilizamos
      if (session) {

        if (rol === RolEncuesta.Estudiante) {
          console.log(`♻️ Reutilizando sesión de estudiante ${session.sessionId} para conectar al servidor de encuestas en sala ${idSala}...`)
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, idSala }, listeners })

        } else {
          console.log(`♻️ Reutilizando sesión de profe/admin ${session.sessionId} para conectar con token al servidor de encuestas...`)
          const token = await solicitarAuth()
          console.log('Token obtenido:', token ? 'SI' : 'NO')
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, token }, listeners })
        }

      } else {

        // Sino pedimos que nos cree una sesión nueva
        if (rol === RolEncuesta.Estudiante) {
          console.log(`🆕 Conectando como estudiante anónimo a la sala ${idSala}...`)
          await conectarSocket({ auth: { rol, idSala }, listeners })

        } else {
          console.log(`🆕 Conectando como profe o admin al servidor de encuestas...`)
          const token = await solicitarAuth()
          console.log('Token obtenido:', token ? 'SI' : 'NO')
          await conectarSocket({ auth: { rol, token }, listeners })
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
      setConectando(false)
      setConectado(false)
    }
  }, [idSala, rol, saveSession, clearSession, session])

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {

    // Esperamos a que la sesión esté lista
    if (!sessionReady) return 

    // Si ya está conectado o conectando, no hacemos nada
    if (conectado || conectando) return 

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
  }, [sessionReady, session, conectado, conectando, idSala, rol, conectar])

  return {
    socket: socket.current,
    session,
    conectando,
    conectado,
    error,
  }
}