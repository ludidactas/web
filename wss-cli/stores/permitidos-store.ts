import { create } from 'zustand'

interface PermitidosState {
  lista: string[]
  nombres: Record<string, string>
  /** Hidrata lista + nombres de una sola vez (viene siempre junta del server). */
  set: (payload: { lista: string[]; nombres: Record<string, string> }) => void
}

export const storePermitidos = create<PermitidosState>()((set) => ({
  lista: [],
  nombres: {},
  set: ({ lista, nombres }) => set({ lista, nombres }),
}))
