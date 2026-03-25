import { create } from 'zustand'

interface LoginState {
  nombre?: string
  dni?: string
  ingresado: boolean
  setNombre: (nombre?: string) => void
  setDNI: (dni?: string) => void
  setIngresado: (ingresado: boolean) => void
}

export const storeEstudianteLogin = create<LoginState>((set) => ({
  nombre: undefined,
  dni: undefined,
  ingresado: false,
  setNombre: (nombre) => set({ nombre }),
  setDNI: (dni) => set({ dni }),
  setIngresado: (ingresado) => set({ ingresado }),
}))
