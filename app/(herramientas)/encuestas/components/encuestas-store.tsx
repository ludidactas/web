import { Encuesta } from '@/wss/tipos'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface IdEstudiante{ id: string; nombre: string }

interface EncuestaStore {
  encuestas: Encuesta[]
  socket: Socket | null
  estudiantes: IdEstudiante[]
  historico_estudiantes: (IdEstudiante & {presente: boolean})[]
  addEstudiante: (estudiante: IdEstudiante) => void
  removeEstudiante: (estudianteId: string) => void
  setSocket: (socket: Socket) => void
  addEncuesta: (encuesta: Encuesta) => void
  updateEncuesta: (encuesta: Encuesta) => void
  deleteEncuesta: (pollId: string) => void
  setEncuestas: (encuestas: Encuesta[]) => void
}

export const useEncuestaStore = create<EncuestaStore>()(
  subscribeWithSelector((set) => ({
    encuestas: [],
    estudiantes: [],
    historico_estudiantes: [],
    socket: null,
    addEstudiante: (estudiante) =>
      set((state) => ({
        estudiantes: state.estudiantes.find(e => e.id === estudiante.id) ? state.estudiantes : [...state.estudiantes, estudiante],
        historico_estudiantes: state.historico_estudiantes.find(e => e.id === estudiante.id) ?
          state.historico_estudiantes.map(e => e.id === estudiante.id ? { ...e, presente: true } : e) :
          [...state.historico_estudiantes, { ...estudiante, presente: true }]
      })),
    removeEstudiante: (estudianteId) => set((state) => ({
      estudiantes: state.estudiantes.filter(e => e.id !== estudianteId),
      historico_estudiantes: state.historico_estudiantes.map(e => e.id === estudianteId ? { ...e, presente: false } : e)
    })),
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
