import { comandosGo, EventosGo } from '@/wss/contrato/go'
import { Partida, TamañoTablero } from '@/wss/validators/go'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { comandos, escuchar } from '../contrato-cli'
import { storeGo } from '../stores/go-store'

/**
 * Espejo cliente de `registrarComandosGo`: estudiante y profe usan los mismos comandos de Go, solo
 * cambia la identidad con la que el server los atiende.
 */
export default function goHandlers(socket: Socket | null) {
  const store = storeGo.getState()
  const cmd = comandos<typeof comandosGo>(socket)
  // `desmontar()` lo pone en true para cancelar un loop de reintentos en curso: sin esto, un montaje
  // reemplazado (StrictMode en dev, o un socket nuevo tras reconectar) deja corriendo el loop viejo en
  // paralelo con el nuevo, y cada uno puede terminar en su propio toast de error duplicado.
  let desmontado = false
  let dejarDeEscuchar = () => {}

  /**
   * Ejecuta un comando que devuelve la partida por ack (en vez de por el broadcast `go:partida`, que a
   * esta altura puede no incluir todavía a este socket: recién se une a la sala de la partida después
   * de que el server le respondió) y actualiza el store con la respuesta.
   */
  async function guardandoPartida(pedido: Promise<Partida>): Promise<Partida> {
    const partida = await pedido
    store.set(partida)
    return partida
  }

  /**
   * Pide `go:mi_partida` con reintentos: justo al conectar, el socket puede emitirlo antes de que el
   * server termine de registrar ese listener (queda cableado después de otros handlers de la sala), en
   * cuyo caso el evento se pierde y el ack tarda los 5s completos en expirar. Sin reintento, esa única
   * falla dejaba al store en "sin partida" para siempre (hasta el próximo refresh), botando al
   * estudiante de una partida en curso.
   */
  async function pedirMiPartidaConReintentos() {
    const intentos = 3
    for (let i = 0; i < intentos; i++) {
      if (desmontado) return
      try {
        const partida = await cmd.pedir('go:mi_partida')
        if (!desmontado) store.set(partida)
        return
      } catch {
        if (desmontado) return
        if (i === intentos - 1) toast.error('No pudimos recuperar tu partida en curso. Refrescá la página.')
        else await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  return {
    montar: () => {
      if (!socket) return

      dejarDeEscuchar = escuchar<EventosGo>(socket, {
        // Actualización de una partida en la que estoy adentro: si es la que estoy observando como
        // espectador va a `observando`, si no es la mía propia (jugadas, pases, conteo, fin de partida).
        'go:partida': (partida) => {
          if (storeGo.getState().observando?.id === partida.id) store.setObservando(partida)
          else store.set(partida)
        },

        // Alguien me invita.
        'go:invitacion': (partida) => store.agregarInvitacion(partida),
        'go:invitacion_rechazada': ({ partidaId }) => {
          store.quitarInvitacion(partidaId)
          if (storeGo.getState().partida?.id === partidaId) store.set(null)
        },

        // Alguien de la sala entró o salió de una partida: refresca "la sala" en vivo (el profe también
        // la recibe, para ver con quién juega cada estudiante).
        'go:contrincantes_actualizados': (contrincantes) => store.setContrincantes(contrincantes),
      })

      // Al conectar, pedimos si ya tenemos una partida en curso (soporta reconexión/refresh). Hasta
      // que esto resuelve, `inicializado` queda en false para que la UI muestre un loading en vez de
      // asumir "no hay partida" y mostrar por un instante el buscador de contrincantes.
      pedirMiPartidaConReintentos().finally(store.marcarInicializado)
    },

    acciones: {
      pedirContrincantes: async () => store.setContrincantes(await cmd.pedir('go:contrincantes')),
      invitar: (contrincanteId: string, tamaño: TamañoTablero = 9) =>
        guardandoPartida(cmd.pedir('go:invitar', { contrincanteId, tamaño })),
      aceptar: (partidaId: string) => guardandoPartida(cmd.pedir('go:aceptar', { partidaId })),
      // También sirve para cancelar una invitación propia todavía pendiente: el server trata ambos
      // casos igual (termina la partida pendiente y avisa al otro jugador por `go:invitacion_rechazada`),
      // así que acá limpiamos tanto la lista de entrantes como `partida` si es la que estábamos esperando.
      rechazar: async (partidaId: string) => {
        await cmd.pedir('go:rechazar', { partidaId })
        store.quitarInvitacion(partidaId)
        if (storeGo.getState().partida?.id === partidaId) store.set(null)
      },
      jugar: (partidaId: string, fila: number, columna: number) =>
        guardandoPartida(cmd.pedir('go:jugar', { partidaId, fila, columna })),
      pasar: (partidaId: string) => guardandoPartida(cmd.pedir('go:pasar', { partidaId })),
      marcarMuerta: (partidaId: string, fila: number, columna: number) =>
        guardandoPartida(cmd.pedir('go:marcar_muerta', { partidaId, fila, columna })),
      confirmarConteo: (partidaId: string) => guardandoPartida(cmd.pedir('go:confirmar_conteo', { partidaId })),
      abandonar: (partidaId: string) => guardandoPartida(cmd.pedir('go:abandonar', { partidaId })),
      observar: async (partidaId: string) => {
        const partida = await cmd.pedir('go:observar', { partidaId })
        store.setObservando(partida)
        return partida
      },
      dejarDeObservar: async (partidaId: string) => {
        await cmd.pedir('go:dejar_observar', { partidaId })
        store.setObservando(null)
      },
    },

    desmontar: () => {
      desmontado = true
      dejarDeEscuchar()
    },
  }
}
