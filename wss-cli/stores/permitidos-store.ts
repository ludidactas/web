import { create } from 'zustand'
import type { ListaPermitidosConInfo } from '@/wss/validators/salas'
import type { InfoEntrada } from '@/wss/validators/invitados'

interface PermitidosState {
  lista: string[]
  info: Record<string, InfoEntrada>
  /** Hidrata lista + info de una sola vez (viene siempre junta del server). */
  set: (payload: ListaPermitidosConInfo) => void
}

export const storePermitidos = create<PermitidosState>()((set) => ({
  lista: [],
  info: {},
  set: ({ lista, info }) => set({ lista, info }),
}))
