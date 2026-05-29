import { RolSala } from '@/wss/validators/auth'
import { Pasaporte } from '@/wss/validators/auth'
import { isNullish } from 'remeda'
import { toast } from 'sonner'
import { create } from 'zustand'
import { configurarListeners, handshake, limpiarListeners, SocketWssCli } from './utils-socket-wss'

// Máquina de estados finitos para la conexión al WebSocket Server (WSS).

export interface RazonExpiracion {
  type: string
  action: string
  message: string
}

/** Representa los posibles estados de nuestra conexión al WebSocket Server (WSS). */
export enum StatusDeConexion {
  /** Conexión quieta. O bien todavía no intentamos conectar o bien ya cerramos la conexión. */
  Quieto = 'idle',
  /** Estableciendo conexión con el WSS. */
  Conectando = 'connecting',
  /** Conexión establecida :) */
  Conectado = 'connected',
  /** Error. Si el estado es este `error` contiene un mensaje. */
  Error = 'error',
  /** El servidor bochó la conexión. */
  Expirado = 'expired',
}

/** Enumera los estados de la conexión para los que tenemos que mostrar la pantalla de loading */
export const statusesDeCarga = [StatusDeConexion.Quieto, StatusDeConexion.Conectando]

type Estado = {
  socket: SocketWssCli | null
  status: StatusDeConexion
  error: string | null
  /** ID de la última llamada a `iniciarConexion`. Permite descartar handshakes que quedaron en vuelo
   *  tras un cleanup (p.ej. React StrictMode desmonta/remonta en dev). */
  _conexionActualId: string | null
  // Agregamos una función central para iniciar o re-intentar la conexión
  iniciarConexion: (auth: Pasaporte) => Promise<void>
  desconectar: () => void
  // Acciones internas para gestionar transiciones de estado
  _manejarError: (err: any) => void
  _manejarExpiracion: (autorreconectar?: boolean) => void
  _limpiarSocket: (reason?: string) => void
}

/** Lógica de conexión y máquina de estados finitos para conexión del cliente al WSS */
export const conexionWss = create<Estado>((set, get) => ({
  socket: null,
  status: StatusDeConexion.Quieto,
  error: null,
  session: null,
  _conexionActualId: null,

  // Creación/cierre del socket
  async iniciarConexion(auth) {
    const current = get()

    // Nos fijamos si hay un cambio de rol o sala en el socket para saber si es reconexión
    // (en cuyo caso, desconectar antes).
    // Maneja la transición Publico -> Autenticado.
    const sockAuth = current.socket && current.socket.auth

    const huboCambioDeSala =
      sockAuth &&
      sockAuth.rol === RolSala.Estudiante &&
      auth.rol === RolSala.Estudiante &&
      sockAuth.idSala !== auth.idSala

    const huboCambioDeRol = sockAuth && sockAuth.rol !== auth.rol

    const precisaAuthNueva = huboCambioDeRol || huboCambioDeSala

    // Si estamos intentando reconectar pero ya estamos conectados o en proceso, abortamos.
    if (!precisaAuthNueva && [StatusDeConexion.Conectado, StatusDeConexion.Conectando].includes(current.status)) {
      console.warn('❗ Conexión ya en curso o activa. Ignorando solicitud de inicio.')
      return
    }

    // Forzamos una desconexión limpia.
    if (precisaAuthNueva) {
      console.log('🔄 Detectado cambio de rol o sala. Forzando desconexión de socket anterior.')
      current.desconectar()
    }

    console.log(`🔌 Iniciando conexión WSS... Rol: ${auth.rol}`)
    const miId = crypto.randomUUID() // Usamos un id para trackear la conexión y no abrir otra encima
    set({ status: StatusDeConexion.Conectando, error: null, _conexionActualId: miId })

    try {
      // Handshake (crea el socket y lo retorna)
      const sock = await handshake(auth)

      // Si hubo un cleanup (StrictMode, desconexión manual) mientras el handshake estaba en vuelo,
      // descartamos este socket sin adjuntarle listeners — evita conexiones zombie.
      if (get()._conexionActualId !== miId) {
        console.warn('⚠️ Descartando handshake obsoleto.')
        sock.disconnect()
        return
      }

      // Asignamos los listeners del store *antes* de conectar
      configurarListeners({
        sock,
        listeners: {
          onConnect: (s) => set({ socket: s, status: StatusDeConexion.Conectado }),
          onDisconnect: (_, reason) => get()._limpiarSocket(`Desconectado: ${reason}`),
          onExpired: (_, _data) => get()._manejarExpiracion(),
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
    const { socket: sock, status } = get()

    if (isNullish(sock)) {
      // Si hay un handshake en curso, cancelamos el estado para que el próximo provider pueda conectar
      if (status === StatusDeConexion.Conectando) {
        console.warn('❗ Cancelando conexión en progreso (socket aún no conectado).')
        get()._limpiarSocket(razon)
      } else {
        console.warn('❗ No hay socket activo para desconectar.')
      }
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
    // Invalidamos el id para que cualquier handshake en vuelo se descarte al resolverse.
    set({ socket: null, status: statusToSet, _conexionActualId: null })
  },

  // Se llama desde onExpired y desde manejarError si el error indica expiración
  _manejarExpiracion(autoreconectar = false) {
    console.warn('⏳ Sesión expirada. Limpiando sesión local y reintentando...')

    // El hook se encarga de limpiar el localStorage a través de 'sessionReady'
    set({ status: StatusDeConexion.Expirado })

    // Forzamos un reintento limpio
    if (autoreconectar) {
      console.log('♻️ Auto-reconectando tras expiración...')
      const auth = get().socket?.auth as Pasaporte // Asumiendo que el auth original está en el socket
      get().desconectar() // Dispara _limpiarSocket -> Quieto

      // Reconectamos con delay
      if (auth) setTimeout(() => get().iniciarConexion(auth), 500)
      else console.warn('❗ No se puede auto-reconectar: no hay auth disponible en el socket.')
    }
  },

  _manejarError(err: any) {
    let msg = err.message ? err.message : '⚠️ Error desconocido'

    // Si el mensaje es `xhr poll error`, no se está pudiendo conectar con el server (típicamente no lo corrimos).
    if (msg === 'xhr poll error') msg = 'Parece que el servidor no está activo'

    if (err.data) {
      // El server expiró la sesión
      msg = err.data.message ?? '😵 Sesión expirada'

      // Mesaje
      toast.error(msg)

      // Comanda
      if (err.data.action === 'clear_session') {
        get()._manejarExpiracion()
        return
      }
    }

    set({ status: StatusDeConexion.Error, error: msg })

    /** @todo Podríamos llamar a get()._limpiarSocket() si el error es fatal e irreversible. */
  },
}))
