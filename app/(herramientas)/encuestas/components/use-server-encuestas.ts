import { RolEncuesta } from '@/polls/encuestas'
import { PollsServerSession } from '@/polls/session'
import { setupSocketLogging } from '@/polls/test/test-funcs'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface SocketServerAuth {
  // Nombre que den en la ui
  nombre?: string
  // El email para profes y admins, el idSala de la url para estudiantes
  idSala?: string
  // Rol de la persona que se conecta
  rol?: RolEncuesta
}

export function useServerEncuestas({ nombre, idSala, rol }: SocketServerAuth) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)
  
  // Persistimos la sesión en localStorage
  const [session, saveSession] = useLocalStorage<PollsServerSession | null>("drawing", null);

  /** 
   * Le pide al server de next, que es el que autentica con Google,
   * un token JWT para conectarse al server de encuestas.
   */
  async function solicitarAuth() {
    console.log(`Obteniendo token del server...`)
    const respuesta = await fetch('/api/auth/token')
    const payload = await respuesta.json()
    return payload.token as string
  }

  /** Conecta el socket al servidor de encuestas con el token que devuelve `solicitarAuth`. Stateless. */
  async function conectarSocket({ idSala, rol, token, nombre, onConnect, onError, onDisconect }: {
    token: string,
    rol: RolEncuesta,
    idSala?: string
    nombre?: string,
    onConnect: (socket: Socket) => void,
    onError: (error: Error) => void,
    onDisconect: (socket: Socket, reason: string) => void
  }) {

    if (!token) throw new Error(`Se require una sesión de Google para conectarse al servidor de encuestas`)

    // Rol debería venir del server de next, en el token, que es el que autentica con Google.
    let sock
    if (rol === RolEncuesta.Estudiante) {
      console.log(`Conectando como estudiante a la sala ${idSala}...`)
      sock = io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/${idSala}/estudiante`, { auth: { token, nombre } })
    } else if (rol === RolEncuesta.Admin) {
      sock = io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/admin`, { auth: { token, nombre } })
    } else if (rol === RolEncuesta.Profe) {
      sock = io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/profe`, { auth: { token, nombre } })
    } else {
      throw new Error(`Rol desconocido: ${rol}`)
    }

    sock.on('connect_error', onError)
    sock.on('disconnect', (reason: string) => onDisconect(sock, reason))
    sock.on('connect', () => onConnect(sock))
    sock.on('connect_timeout', (error) => {
      console.error('Connection timeout:', error)
      onError(new Error(`Timeout al conectar con el servidor de encuestas: ${error.message}`))
    })

    return sock
  }

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {

    if (!rol || (rol === RolEncuesta.Estudiante && !idSala))
      throw new Error(`Se requiere un idSala y o rol de profe para conectarse al servidor de encuestas`)

    setConectando(true)

    solicitarAuth().then((token) => {
      conectarSocket({
        token,
        nombre,
        idSala,
        rol,
        onConnect: (sock) => {
          console.log('Socket connected:', sock.id)
          setSocket(sock)
        },
        onError: (error) => {
          console.error('Connection error:', error)
          toast.error(`Error de conexión con el servidor de encuestas: ${error.message}`)
        },
        onDisconect: (sock, reason) => {
          console.log('Socket disconnected:', reason)
          toast.error(`Desconectado del servidor de encuestas: ${reason}`)
          saveSession(null)
          setSocket(null)
        }
      })
    }).catch((err) => {
      console.error('Error al obtener el token de autenticación:', err)
      toast.error(`Error al obtener el token de autenticación: ${err.message}`)
      setError(`Error al obtener el token de autenticación: ${err.message}`)
      setConectando(false)
    })

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect()
        saveSession(null)
        setSocket(null)
      }
    }
  }, [])

  // Al obtener el socket...
  useEffect(() => {
    if (socket) {
      // Le attacheamos los listeners de consola. Debug.
      setupSocketLogging(socket)

      // Suscribimos a la sesión abierta
      socket.on('session:opened', ({ sessionId, userIp, username, rol }: PollsServerSession) => {

        // Guardamos la sesión en localStorage para persistencia
        saveSession({ sessionId, userIp, username, rol })

        // Le attacheamos la sesión que nos mandó el server al socket local
        socket.auth = { sessionId }

        // Local state para verla en pantalla
        saveSession({ sessionId, userIp, username, rol })
      })
    }
  }, [saveSession, socket])


  return {
    socket,
    session,
    conectando,
    error,
  }
}