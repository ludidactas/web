import { create } from 'zustand'

interface PermitidosState {
  lista: string[]
  set: (items: string[]) => void
}

export const storePermitidos = create<PermitidosState>()((set) => ({
  lista: [],
  set: (items) => set({ lista: items }),
}))