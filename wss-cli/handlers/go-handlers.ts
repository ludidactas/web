import { comandosGo, EventosGo } from '@/wss/contrato/go'
import { ModoPartida, Partida, TamañoTablero } from '@/wss/validators/go'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { comandos, escuchar } from '../contrato-cli'
import { storeGo } from '../stores/go-store'

/** Espejo cliente de `registrarComandosGo`: estudiante y profe usan los mismos comandos, con otra identidad. */
export default function goHandlers(socket: Socket | null) {
  const store = storeGo.getState()
  const cmd = comandos<typeof comandosGo>(socket)
  // El desmontaje corta el loop de reintentos: un montaje reemplazado (StrictMode, reconexión) dejaría dos en paralelo.
  let desmontado = false

  /** El store se actualiza con la respuesta: el broadcast `go:partida` todavía puede no alcanzar a este socket. */
  async function guardandoPartida(pedido: Promise<Partida>): Promise<Partida> {
    const partida = await pedido
    store.set(partida)
    return partida
  }

  /**
   * Con reintentos: el profe tiene sus comandos de Go recién al abrir la sala, y este pedido sale antes
   * (ver docs/contrato-wss.md); una sola falla dejaría el store en "sin partida" hasta refrescar.
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
      if (!socket) return () => {}

      const dejarDeEscuchar = escuchar<EventosGo>(socket, {
        // Una partida en la que estoy: la que observo va a `observando`; si no, es la mía.
        'go:partida': (partida) => {
          if (storeGo.getState().observando?.id === partida.id) store.setObservando(partida)
          else store.set(partida)
        },

        'go:invitacion': (partida) => store.agregarInvitacion(partida),
        'go:invitacion_rechazada': ({ partidaId }) => {
          store.quitarInvitacion(partidaId)
          if (storeGo.getState().partida?.id === partidaId) store.set(null)
        },

        // También lo recibe el profe.
        'go:contrincantes_actualizados': (contrincantes) => store.setContrincantes(contrincantes),
      })

      // `inicializado` queda en false hasta que resuelve: la UI muestra un loading, no el buscador de contrincantes.
      pedirMiPartidaConReintentos().finally(store.marcarInicializado)

      return () => {
        desmontado = true
        dejarDeEscuchar()
      }
    },

    acciones: {
      pedirContrincantes: async () => store.setContrincantes(await cmd.pedir('go:contrincantes')),
      invitar: (contrincanteId: string, opciones: { tamaño?: TamañoTablero; modo?: ModoPartida } = {}) =>
        guardandoPartida(cmd.pedir('go:invitar', { contrincanteId, ...opciones })),
      aceptar: (partidaId: string) => guardandoPartida(cmd.pedir('go:aceptar', { partidaId })),
      // También cancela una invitación propia pendiente: se limpian las invitaciones y `partida` si era la esperada.
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
  }
}
