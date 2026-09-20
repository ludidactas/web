import type { Ack } from '@/wss/middleware/error-handling'
import { Partida, TamañoTablero } from '@/wss/validators/go'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { storeGo } from '../stores/go-store'

/** Espejo cliente de `handlersGoProfe`: el profe usa los mismos comandos de Go que un estudiante,
 * bajo su propia identidad (ver `estudiante-go-handlers.ts`, del que es prácticamente un calco). */
export default function profeGoHandlers(socket: Socket | null) {
  const store = storeGo.getState()
  // Ver comentario en `estudiante-go-handlers.ts`.
  let desmontado = false

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
      if (desmontado) return
      try {
        const partida = await conAck<Partida | null>('go:mi_partida')
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

      socket.on('go:partida', (partida: Partida) => {
        if (storeGo.getState().observando?.id === partida.id) store.setObservando(partida)
        else store.set(partida)
      })

      socket.on('go:invitacion', (partida: Partida) => store.agregarInvitacion(partida))
      socket.on('go:invitacion_rechazada', ({ partidaId }: { partidaId: string }) => {
        store.quitarInvitacion(partidaId)
        if (storeGo.getState().partida?.id === partidaId) store.set(null)
      })

      // El profe no es un contrincante de nadie, pero sí quiere ver en vivo con quién está jugando
      // cada estudiante (ej: lista de participantes), así que también recibe este evento.
      socket.on('go:contrincantes_actualizados', (contrincantes: ReturnType<typeof storeGo.getState>['contrincantes']) =>
        store.setContrincantes(contrincantes)
      )

      pedirMiPartidaConReintentos().finally(store.marcarInicializado)
    },

    acciones: {
      pedirContrincantes: async () => store.setContrincantes(await conAck('go:contrincantes')),
      invitar: (contrincanteId: string, tamaño: TamañoTablero = 9) =>
        conAckPartida('go:invitar', { contrincanteId, tamaño }),
      aceptar: (partidaId: string) => conAckPartida('go:aceptar', { partidaId }),
      // También sirve para cancelar una invitación propia todavía pendiente: el server trata ambos
      // casos igual (termina la partida pendiente y avisa al otro jugador por `go:invitacion_rechazada`),
      // así que acá limpiamos tanto la lista de entrantes como `partida` si es la que estábamos esperando.
      rechazar: async (partidaId: string) => {
        await conAck<void>('go:rechazar', { partidaId })
        store.quitarInvitacion(partidaId)
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
      desmontado = true
      if (!socket) return

      socket.removeAllListeners('go:partida')
      socket.removeAllListeners('go:invitacion')
      socket.removeAllListeners('go:invitacion_rechazada')
      socket.removeAllListeners('go:contrincantes_actualizados')
    },
  }
}
