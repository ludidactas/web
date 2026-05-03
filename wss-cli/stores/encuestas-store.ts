import { EncuestaConVotos } from '@/wss/validators/polls'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface EncuestaState {
  items: EncuestaConVotos[]
  add: (item: EncuestaConVotos) => void
  update: (item: EncuestaConVotos) => void
  remove: (item: { pollId: string }) => void
  set: (items: EncuestaConVotos[]) => void
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
        items: state.items.filter((e) => e.id !== item.pollId),
      })),

    set: (items) => set({ items: [...items] }),
  }))
)
