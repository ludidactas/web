import { Partida } from '@/wss/validators/go'
import { create } from 'zustand'

interface GoState {
  /** `false` hasta que llega la respuesta del primer `go:mi_partida`. Mientras tanto no sabemos si
   * ya hay una partida en curso, así que la UI debe mostrar un loading en vez de asumir que no hay. */
  inicializado: boolean
  /** Mi partida activa (pendiente o en curso), o `null` si no tengo ninguna. */
  partida: Partida | null
  /** Desafíos entrantes de otros estudiantes, pendientes de aceptar/rechazar. */
  desafios: Partida[]
  /** Compañeros conectados, con si están o no disponibles para desafiar (ya en una partida). */
  rivales: Array<{ userId: string; nombre: string; enPartida: boolean; partidaId: string | null }>
  /** Partida ajena que estoy mirando como espectador, o `null` si no estoy observando ninguna. */
  observando: Partida | null
  marcarInicializado: () => void
  set: (partida: Partida | null) => void
  agregarDesafio: (partida: Partida) => void
  quitarDesafio: (partidaId: string) => void
  setRivales: (rivales: GoState['rivales']) => void
  setObservando: (partida: Partida | null) => void
  reset: () => void
}

export const storeGo = create<GoState>()((set) => ({
  inicializado: false,
  partida: null,
  desafios: [],
  rivales: [],
  observando: null,

  marcarInicializado: () => set({ inicializado: true }),

  set: (partida) =>
    set((state) => ({
      partida,
      // Si la partida que llega soy yo, deja de ser un desafío entrante.
      desafios: partida ? state.desafios.filter((d) => d.id !== partida.id) : state.desafios,
    })),

  agregarDesafio: (partida) =>
    set((state) => ({
      desafios: state.desafios.find((d) => d.id === partida.id)
        ? state.desafios.map((d) => (d.id === partida.id ? partida : d))
        : [...state.desafios, partida],
    })),

  quitarDesafio: (partidaId) => set((state) => ({ desafios: state.desafios.filter((d) => d.id !== partidaId) })),

  setRivales: (rivales) => set({ rivales }),

  setObservando: (partida) => set({ observando: partida }),

  reset: () => set({ partida: null, desafios: [], rivales: [], observando: null }),
}))
