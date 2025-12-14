import { Encuesta } from '@/wss/tipos'
import { WssEstudianteSession } from '@/wss/validators/session'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface Estudiante extends WssEstudianteSession {
  conectado: boolean
  // Optionales, para los que están logueados con google
  email?: string
  avatar?: string
}

interface EncuestaStore {
  encuestas: Encuesta[]
  estudiantes: Estudiante[]
  addEstudiante: (estudiante: Estudiante) => void
  removeEstudiante: (estudianteId: string) => void
  setEstudiantes: (estudiantes: Estudiante[]) => void
  addEncuesta: (encuesta: Encuesta) => void
  updateEncuesta: (encuesta: Encuesta) => void
  deleteEncuesta: (pollId: string) => void
  setEncuestas: (encuestas: Encuesta[]) => void
}

export const useEncuestaStore = create<EncuestaStore>()(
  subscribeWithSelector((set) => ({
    encuestas: [],
    estudiantes: [],
    addEstudiante: (estudiante) =>
      set((state) => ({
        estudiantes: state.estudiantes.find(e => e.sessionId === estudiante.sessionId) ?
          state.estudiantes.map(e => e.sessionId === estudiante.sessionId ? { ...e, conectado: true } : e) :
          [...state.estudiantes, { ...estudiante, conectado: true }]
      })),
    removeEstudiante: (estudianteId) => set((state) => ({
      estudiantes: state.estudiantes.map(e => e.sessionId === estudianteId ? { ...e, conectado: false } : e)
    })),
    setEstudiantes: (estudiantes) => set({
      estudiantes: [...estudiantes]
    }),
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
