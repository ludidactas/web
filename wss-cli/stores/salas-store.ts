import { create } from 'zustand'

export type SalaResumen = { id: string; nombre?: string }

interface SalasState {
  /** Lista de salas del profe. `null` = todavía no llegó (cargando). */
  salas: SalaResumen[] | null
  set: (salas: SalaResumen[]) => void
}

/** Lista de salas del profe, alimentada por el evento `salas:lista` del WSS. */
export const storeSalas = create<SalasState>((set) => ({
  salas: null,
  set: (salas: SalaResumen[]) => set({ salas }),
}))
