import { create } from 'zustand'

interface PermitidosState {
  lista: string[]
  nombres: Record<string, string>
  set: (items: string[]) => void
  setNombre: (dni: string, nombre: string) => void
}

export const storePermitidos = create<PermitidosState>()((set) => ({
  lista: [],
  nombres: {},
  set: (items) => set({ lista: items }),
  setNombre: (dni, nombre) =>
    set((state) => ({ nombres: { ...state.nombres, [dni]: nombre } })),
}))