import { EncuestaHidratadaEstudiante, EncuestaHidratadaProfe } from '@/wss/validators/polls'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface EncuestaState<T extends { id: string }> {
  items: T[]
  add: (item: T) => void
  update: (item: T) => void
  remove: (item: { pollId: string }) => void
  set: (items: T[]) => void
}

function crearStoreEncuestas<T extends { id: string }>() {
  return create<EncuestaState<T>>()(
    subscribeWithSelector((set) => ({
      items: [],
      add: (item) => set((state) => ({ items: [...state.items, item] })),
      update: (item) =>
        set((state) => ({
          items: state.items.find((e) => e.id === item.id)
            ? state.items.map((e) => (e.id === item.id ? { ...item } : e))
            : [...state.items, item],
        })),
      remove: (item) => set((state) => ({ items: state.items.filter((e) => e.id !== item.pollId) })),
      set: (items) => set({ items: [...items] }),
    }))
  )
}

export const storeEncuestasProfe = crearStoreEncuestas<EncuestaHidratadaProfe>()
export const storeEncuestasEstudiante = crearStoreEncuestas<EncuestaHidratadaEstudiante>()
