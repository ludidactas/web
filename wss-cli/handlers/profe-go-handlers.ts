import type { Ack } from '@/wss/middleware/error-handling'
import { Partida, TamañoTablero } from '@/wss/validators/go'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { storeGo } from '../stores/go-store'

/** Espejo cliente de `handlersGoProfe`: el profe usa los mismos comandos de Go que un estudiante,
 * bajo su propia identidad (ver `estudiante-go-handlers.ts`, del que es prácticamente un calco). */
export default function profeGoHandlers(socket: Socket | null) {
  const store = storeGo.getState()

  async function conAck<T>(evento: string, payload?: unknown): Promise<T> {
    if (!socket) throw new Error('Sin conexión')
    const res: Ack<T> = await socket.timeout(5000).emitWithAck(evento, payload)
    if (!res.ok) throw new Error(res.error)
    return res.data
  }

  async function conAckPartida(evento: string, payload?: unknown): Promise<Partida> {
    const partida = await conAck<Partida>(evento, payload)
    store.set(partida)
    return partida
  }

  /** Ver comentario en `estudiante-go-handlers.ts` (`pedirMiPartidaConReintentos`), del que este es un calco. */
  async function pedirMiPartidaConReintentos() {
    const intentos = 3
    for (let i = 0; i < intentos; i++) {
      try {
        store.set(await conAck<Partida | null>('go:mi_partida'))
        return
      } catch {
        if (i === intentos - 1) toast.error('No pudimos recuperar tu partida en curso. Refrescá la página.')
        else await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  return {
    montar: () => {
      if (!socket) return

      socket.on('go:partida', (partida: Partida) => {
        if (storeGo.getState().observando?.id === partida.id) store.setObservando(partida)
        else store.set(partida)
      })

      socket.on('go:desafio', (partida: Partida) => store.agregarDesafio(partida))
      socket.on('go:desafio_rechazado', ({ partidaId }: { partidaId: string }) => {
        store.quitarDesafio(partidaId)
        if (storeGo.getState().partida?.id === partidaId) store.set(null)
      })

      // El profe no es un rival de nadie, pero sí quiere ver en vivo con quién está jugando cada
      // estudiante (ej: lista de participantes), así que también recibe este evento.
      socket.on('go:rivales_actualizados', (rivales: ReturnType<typeof storeGo.getState>['rivales']) =>
        store.setRivales(rivales)
      )

      pedirMiPartidaConReintentos().finally(store.marcarInicializado)
    },

    acciones: {
      pedirRivales: async () => store.setRivales(await conAck('go:rivales')),
      desafiar: (rivalId: string, tamaño: TamañoTablero = 9) => conAckPartida('go:desafiar', { rivalId, tamaño }),
      aceptar: (partidaId: string) => conAckPartida('go:aceptar', { partidaId }),
      // También sirve para cancelar un desafío propio todavía pendiente: el server trata ambos casos
      // igual (termina la partida pendiente y avisa al otro jugador por `go:desafio_rechazado`), así
      // que acá limpiamos tanto la lista de entrantes como `partida` si es la que estábamos esperando.
      rechazar: async (partidaId: string) => {
        await conAck<void>('go:rechazar', { partidaId })
        store.quitarDesafio(partidaId)
        if (storeGo.getState().partida?.id === partidaId) store.set(null)
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
