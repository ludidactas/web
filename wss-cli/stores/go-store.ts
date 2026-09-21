import { Partida } from '@/wss/validators/go'
import { create } from 'zustand'

interface GoState {
  /** `false` hasta que llega la respuesta del primer `go:mi_partida`. Mientras tanto no sabemos si
   * ya hay una partida en curso, así que la UI debe mostrar un loading en vez de asumir que no hay. */
  inicializado: boolean
  /** Mi partida activa (pendiente o en curso), o `null` si no tengo ninguna. */
  partida: Partida | null
  /** Invitaciones entrantes de otros estudiantes, pendientes de aceptar/rechazar. */
  invitaciones: Partida[]
  /** Compañeros conectados, con si están o no disponibles para invitar (ya en una partida) y, en ese
   * caso, contra quién. */
  contrincantes: Array<{
    userId: string
    nombre: string
    enPartida: boolean
    partidaId: string | null
    contrincante: { userId: string; nombre: string } | null
  }>
  /** Partida ajena que estoy mirando como espectador, o `null` si no estoy observando ninguna. */
  observando: Partida | null
  marcarInicializado: () => void
  set: (partida: Partida | null) => void
  agregarInvitacion: (partida: Partida) => void
  quitarInvitacion: (partidaId: string) => void
  setContrincantes: (contrincantes: GoState['contrincantes']) => void
  setObservando: (partida: Partida | null) => void
  reset: () => void
}

export const storeGo = create<GoState>()((set) => ({
  inicializado: false,
  partida: null,
  invitaciones: [],
  contrincantes: [],
  observando: null,

  marcarInicializado: () => set({ inicializado: true }),

  set: (partida) =>
    set((state) => ({
      partida,
      // Si la partida que llega soy yo, deja de ser una invitación entrante.
      invitaciones: partida ? state.invitaciones.filter((i) => i.id !== partida.id) : state.invitaciones,
    })),

  agregarInvitacion: (partida) =>
    set((state) => ({
      invitaciones: state.invitaciones.find((i) => i.id === partida.id)
        ? state.invitaciones.map((i) => (i.id === partida.id ? partida : i))
        : [...state.invitaciones, partida],
    })),

  quitarInvitacion: (partidaId) =>
    set((state) => ({ invitaciones: state.invitaciones.filter((i) => i.id !== partidaId) })),

  setContrincantes: (contrincantes) => set({ contrincantes }),

  setObservando: (partida) => set({ observando: partida }),

  // No tocamos `invitaciones`: puede haber llegado una mientras todavía tenías `partida` seteada (la
  // que se está por soltar), y no queremos perderla justo cuando el usuario recién se está por fijar
  // en la lista de contrincantes.
  reset: () => set({ partida: null, contrincantes: [], observando: null }),
}))
