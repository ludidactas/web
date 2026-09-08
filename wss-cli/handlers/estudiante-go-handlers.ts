import type { Ack } from '@/wss/middleware/error-handling'
import { Partida, TamañoTablero } from '@/wss/validators/go'
import { Socket } from 'socket.io-client'
import { storeGo } from '../stores/go-store'

/** Espejo cliente de `handlersGoEstudiante`. */
export default function estudianteGoHandlers(socket: Socket | null) {
  const store = storeGo.getState()

  async function conAck<T>(evento: string, payload?: unknown): Promise<T> {
    if (!socket) throw new Error('Sin conexión')
    const res: Ack<T> = await socket.timeout(5000).emitWithAck(evento, payload)
    if (!res.ok) throw new Error(res.error)
    return res.data
  }

  /**
   * Comandos que devuelven la partida por ack (en vez de por el broadcast `go:partida`, que a esta
   * altura puede no incluir todavía a este socket: recién se une a la sala de la partida después de
   * que el server le respondió). Actualizamos el store nosotros mismos con la respuesta.
   */
  async function conAckPartida(evento: string, payload?: unknown): Promise<Partida> {
    const partida = await conAck<Partida>(evento, payload)
    store.set(partida)
    return partida
  }

  return {
    montar: () => {
      if (!socket) return

      // Actualización de una partida en la que estoy adentro: si es la que estoy observando como
      // espectador va a `observando`, si no es la mía propia (jugadas, pases, conteo, fin de partida).
      socket.on('go:partida', (partida: Partida) => {
        if (storeGo.getState().observando?.id === partida.id) store.setObservando(partida)
        else store.set(partida)
      })

      // Alguien me desafía.
      socket.on('go:desafio', (partida: Partida) => store.agregarDesafio(partida))
      socket.on('go:desafio_rechazado', ({ partidaId }: { partidaId: string }) => {
        store.quitarDesafio(partidaId)
        if (storeGo.getState().partida?.id === partidaId) store.set(null)
      })

      // Alguien de la sala entró o salió de una partida: refresca "la sala" en vivo.
      socket.on('go:rivales_actualizados', (rivales: ReturnType<typeof storeGo.getState>['rivales']) =>
        store.setRivales(rivales)
      )

      // Al conectar, pedimos si ya tenemos una partida en curso (soporta reconexión/refresh). Hasta
      // que esto resuelve, `inicializado` queda en false para que la UI muestre un loading en vez de
      // asumir "no hay partida" y mostrar por un instante el buscador de rivales.
      conAck<Partida | null>('go:mi_partida').then(store.set).finally(store.marcarInicializado)
    },

    acciones: {
      pedirRivales: async () => store.setRivales(await conAck('go:rivales')),
      desafiar: (rivalId: string, tamaño: TamañoTablero = 9) => conAckPartida('go:desafiar', { rivalId, tamaño }),
      aceptar: (partidaId: string) => conAckPartida('go:aceptar', { partidaId }),
      rechazar: async (partidaId: string) => {
        await conAck<void>('go:rechazar', { partidaId })
        store.quitarDesafio(partidaId)
      },
      jugar: (partidaId: string, x: number, y: number) => conAckPartida('go:jugar', { partidaId, x, y }),
      pasar: (partidaId: string) => conAckPartida('go:pasar', { partidaId }),
      marcarMuerta: (partidaId: string, x: number, y: number) => conAckPartida('go:marcar_muerta', { partidaId, x, y }),
      confirmarConteo: (partidaId: string) => conAckPartida('go:confirmar_conteo', { partidaId }),
      abandonar: (partidaId: string) => conAckPartida('go:abandonar', { partidaId }),
      observar: async (partidaId: string) => {
        const partida = await conAck<Partida>('go:observar', { partidaId })
        store.setObservando(partida)
        return partida
      },
      dejarDeObservar: async (partidaId: string) => {
        await conAck<void>('go:dejar_observar', { partidaId })
        store.setObservando(null)
      },
    },

    desmontar: () => {
      if (!socket) return

      socket.removeAllListeners('go:partida')
      socket.removeAllListeners('go:desafio')
      socket.removeAllListeners('go:desafio_rechazado')
      socket.removeAllListeners('go:rivales_actualizados')
    },
  }
}
