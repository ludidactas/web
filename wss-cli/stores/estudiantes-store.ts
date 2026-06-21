import { WssEstudianteSession } from '@/wss/validators/session'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// `WssEstudianteSession` es una unión discriminada por método (dni/nombre/google), donde `dni`,
// `email` y `avatar` viven solo en su variante. Para la vista del profe necesitamos acceder a esos
// campos sin discriminar, así que intersectamos la unión con ellos como opcionales (más los campos
// de presentación). No re-enumeramos los campos comunes (userId, nombre, etc.): vienen de la unión.
export type Estudiante = WssEstudianteSession & {
  conectado: boolean
  dni?: string
  email?: string
  avatar?: string
  votos?: Record<string, string[]>
}

interface EstudianteState {
  items: Estudiante[]
  add: (item: Estudiante) => void
  remove: (id: string) => void
  set: (items: Estudiante[]) => void
  connect: (item: Estudiante) => void
  disconnect: (id: string) => void
  cargarVotosEstudiante: (params: { userId: string; votos: Record<string, string[]> }) => void
}

export const storeEstudiantes = create<EstudianteState>()(
  subscribeWithSelector((set) => ({
    items: [],

    add: (item) =>
      set((state) => ({
        items: state.items.find((e) => e.userId === item.userId)
          ? state.items.map((e) => (e.userId === item.userId ? { ...e, ...item, conectado: true } : e))
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

    cargarVotosEstudiante: ({ userId, votos }: { userId: string; votos: Record<string, string[]> }) =>
      set((state) => ({
        items: state.items.map((e) => (e.userId === userId ? { ...e, votos: votos || {} } : e)),
      })),
  }))
)
