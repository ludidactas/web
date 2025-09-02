import { Encuesta } from '@/wss/tipos'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface EncuestaStore {
  encuestas: Encuesta[]
  socket: Socket | null
  setSocket: (socket: Socket) => void
  addEncuesta: (encuesta: Encuesta) => void
  updateEncuesta: (encuesta: Encuesta) => void
  deleteEncuesta: (pollId: string) => void
  setEncuestas: (encuestas: Encuesta[]) => void
}

export const useEncuestaStore = create<EncuestaStore>()(
  subscribeWithSelector((set) => ({
    encuestas: [],
    socket: null,
    setSocket: (socket) => set({ socket }),
    addEncuesta: (encuesta) => set((state) => ({ encuestas: [...state.encuestas, encuesta] })),
    updateEncuesta: (encuesta) =>
      // Si la encuentra updatea, sino agrega
      set((state) =>
        state.encuestas.find((e) => e.id === encuesta.id)
          ? {
              encuestas: state.encuestas.map((e) => (e.id === encuesta.id ? { ...encuesta } : e)),
            }
          : {
              encuestas: [...state.encuestas, encuesta],
            }
      ),
    deleteEncuesta: (pollId) =>
      set((state) => ({
        encuestas: state.encuestas.filter((e) => e.id !== pollId),
      })),
    setEncuestas: (encuestas) => set({ encuestas: [...encuestas] }),
  }))
)
