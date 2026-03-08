import { Encuesta } from '@/wss/tipos'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface EncuestaState {
  items: Encuesta[]
  add: (item: Encuesta) => void
  update: (item: Encuesta) => void
  remove: (item: { id: string }) => void
  set: (items: Encuesta[]) => void
}

export const storeEncuestas = create<EncuestaState>()(
  subscribeWithSelector((set) => ({
    items: [],

    add: (item) => set((state) => ({ items: [...state.items, item] })),

    update: (item) =>
      set((state) => ({
        items: state.items.find((e) => e.id === item.id)
          ? state.items.map((e) => (e.id === item.id ? { ...item } : e))
          : [...state.items, item],
      })),

    remove: (item) =>
      set((state) => ({
        items: state.items.filter((e) => e.id !== item.id),
      })),

    set: (items) => set({ items: [...items] }),
  }))
)
