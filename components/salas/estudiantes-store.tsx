import { WssEstudianteSession } from '@/wss/validators/session'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface Estudiante extends WssEstudianteSession {
  conectado: boolean
  email?: string
  avatar?: string
}

interface EstudianteState {
  items: Estudiante[]
  add: (item: Estudiante) => void
  remove: (id: string) => void
  set: (items: Estudiante[]) => void
  connect: (item: Estudiante) => void
  disconnect: (id: string) => void
}

export const useEstudianteStore = create<EstudianteState>()(
  subscribeWithSelector((set) => ({
    items: [],

    add: (item) =>
      set((state) => ({
        items: state.items.find((e) => e.userId === item.userId)
          ? state.items.map((e) => (e.userId === item.userId ? { ...e, conectado: true } : e))
          : [...state.items, { ...item, conectado: true }],
      })),

    remove: (id) =>
      set((state) => ({
        items: state.items.filter((e) => e.userId !== id),
      })),

    set: (items) => set({ items: [...items] }),

    connect: (item) =>
      set((state) => ({
        items: state.items.map((e) => (e.userId === item.userId ? { ...e, conectado: true } : e)),
      })),

    disconnect: (id) =>
      set((state) => ({
        items: state.items.map((e) => (e.userId === id ? { ...e, conectado: false } : e)),
      })),
  }))
)
