import { create } from 'zustand'

interface LoginState {
  nombre?: string
  dni?: string
  clientId?: string
  ingresado: boolean
  setNombre: (nombre?: string) => void
  setDNI: (dni?: string) => void
  setClientId: (clientId: string) => void
  setIngresado: (ingresado: boolean) => void
}

export const storeEstudianteLogin = create<LoginState>((set) => ({
  nombre: undefined,
  dni: undefined,
  clientId: undefined,
  ingresado: false,
  setNombre: (nombre) => set({ nombre }),
  setDNI: (dni) => set({ dni }),
  setClientId: (clientId) => set({ clientId }),
  setIngresado: (ingresado) => set({ ingresado }),
}))
