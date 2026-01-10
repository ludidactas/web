import { RolEncuesta } from '@/wss/tipos'
import { Pasaporte } from '@/wss/validators/auth'
import { WssServerSession } from '@/wss/validators/session'
import { isNullish } from 'remeda'
import { create } from 'zustand'
import { configurarListeners, handshake, limpiarListeners, SocketWssCli } from './utils-socket-wss'
import { sleep } from '@/wss/test/test-funcs'

// Máquina de estados finitos

export enum StatusDeConexion {
  Quieto = 'idle',
  Autenticando = 'authenticating',
  CargandoDependencias = 'loading_deps',
  Conectando = 'connecting',
  Conectado = 'connected',
  Error = 'error',
  Expirado = 'expired',
}

type Estado = {
  socket: SocketWssCli | null
  status: StatusDeConexion
  error: string | null
  session: WssServerSession | null
  // Agregamos una función central para iniciar o re-intentar la conexión
  iniciarConexion: (auth: Pasaporte, sessionId?: string) => Promise<void>
  desconectar: () => void
  // Acciones internas para gestionar transiciones de estado
  _manejarError: (err: any) => void
  _manejarExpiracion: () => void
  _limpiarSocket: (reason?: string) => void // Renombrado
}

/** Lógica de conexión y máquina de estados finitos para conexión del cliente al WSS */
export const useConexionWss = create<Estado>((set, get) => ({
  socket: null,
  status: StatusDeConexion.Quieto,
  error: null,
  session: null,

  // Creación/cierre del socket
  async iniciarConexion(auth, sessionId) {
    const current = get()

    // Si estamos intentando reconectar pero ya estamos conectados o en proceso, por lo menos chiflamos.
    if ([StatusDeConexion.Conectado, StatusDeConexion.Conectando].includes(current.status))
      console.warn('❗ Conexión ya en curso o activa. Ignorando solicitud de inicio.')

    // Nos fijamos si hay un cambio de rol o sala en el socket para saber si es reconexión 
    // (en cuyo caso, desconectar antes).
    // Maneja la transición Publico -> Autenticado.
    const sockAuth = current.socket && current.socket.auth

    const huboCambioDeSala =
      sockAuth?.rol === RolEncuesta.Estudiante &&
      auth.rol === RolEncuesta.Estudiante &&
      sockAuth?.idSala !== auth.idSala
    const huboCambioDeRol = sockAuth?.rol !== auth.rol

    const precisaAuthNueva = huboCambioDeRol || huboCambioDeSala

    // Forzamos una desconexión limpia.
    if (precisaAuthNueva) {
      console.log('🔄 Detectado cambio de rol o sala. Forzando desconexión de socket anterior.')
      current.desconectar()
    }

    console.log(`🔌 Iniciando conexión WSS... Rol: ${auth.rol}`)
    set({ status: StatusDeConexion.Conectando, error: null })

    try {
      // Handshake (crea el socket y lo retorna)
      await sleep(3000) // BORRAME
      const sock = await handshake({ ...auth, sessionId })

      // Asignamos los listeners del store *antes* de conectar
      configurarListeners({
        sock,
        listeners: {
          onConnect: (s) => set({ socket: s, status: StatusDeConexion.Conectado }),
          onDisconnect: (_, reason) => get()._limpiarSocket(`Desconectado: ${reason}`),
          onSession: (_, sesion) => set({ session: sesion }),
          onExpired: () => get()._manejarExpiracion(),
          onError: (_, err) => get()._manejarError(err),
        },
      })

      // Boom 🚀
      sock.connect()

    } catch (err) {
      console.error('Error durante el handshake:', err)
      set({ status: StatusDeConexion.Error, error: 'Error al iniciar el handshake.' })
    }
  },

  // Función pública para desconectar (cleanup forzada)
  desconectar(razon = 'Desconexión manual') {
    const sock = get().socket

    if (isNullish(sock)) {
      console.warn('❗ No hay socket activo para desconectar.')
      return
    }
    
    // Desconexión efectiva
    console.log(`🔌 Desconectando del WSS (Forzado)...`)
    sock.disconnect() // Esto disparará el evento 'disconnect' y llamará a _limpiarSocket

    // Limpiamos 
    console.log(`♻️ Limpiando el socket`)
    get()._limpiarSocket(razon)
  },

  // Internas

  _limpiarSocket(razon = 'cleanup') {
    console.log(`🔄 Limpiando estado de conexión: ${razon}`)

    // Quitamos listeners
    const sock = get().socket
    if (sock) limpiarListeners(sock) // Asegurarse de que el socket anterior esté limpio

    // Si no está en error (clave), vuelve a Quieto.
    const statusToSet = get().status === StatusDeConexion.Error ? StatusDeConexion.Error : StatusDeConexion.Quieto
    set({ socket: null, status: statusToSet, session: null })
  },

  // Se llama desde onExpired y desde manejarError si el error indica expiración
  _manejarExpiracion(autoreconectar = false) {
    console.warn('⏳ Sesión expirada. Limpiando sesión local y reintentando...')

    // El hook se encarga de limpiar el localStorage a través de 'sessionReady'
    set({ status: StatusDeConexion.Expirado, session: null })

    // Forzamos un reintento limpio
    get().desconectar() // Dispara _limpiarSocket -> Quieto

    if (autoreconectar) {
      console.log('♻️ Auto-reconectando tras expiración...')
      const auth = get().socket?.auth as Pasaporte // Asumiendo que el auth original está en el socket
    
      if (auth) get().iniciarConexion(auth)
      else console.warn('❗ No se puede auto-reconectar: no hay auth disponible en el socket.')
    }

    // La re-conexión puede ser impulsada por el hook al ver el estado Quieto
    // y la por sessionReady (que se vuelve a cargar después de limpiar localStorage).

    // Auto-reconexión simple tras un timeout corto, si no quieres depender de sessionReady
    // setTimeout(() => {
    //   const auth = get().socket?.auth as Pasaporte // Asumiendo que el auth original está en el socket
    //   if (auth) get().iniciarConexion(auth)
    // }, 1000)
  },

  _manejarError(err: any) {
    let msg = err.message ? `⚠️ Error: ${err.message}` : '⚠️ Error desconocido'

    // El server expiró la sesión
    if (err.data && err.data.action === 'clear_session') {
      msg = '😵 Sesión expirada. Reestableciendo...'
      get()._manejarExpiracion()
      return
    }

    set({ status: StatusDeConexion.Error, error: msg })

    /** @todo Podríamos llamar a get()._limpiarSocket() si el error es fatal e irreversible. */
  },
}))
