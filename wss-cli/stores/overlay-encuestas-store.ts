import { EncuestaConVotos } from '@/wss/validators/polls'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface OverlayEncuestaState {
  encuesta: EncuestaConVotos | null
  set: (encuesta: EncuestaConVotos) => void
  clear: () => void
}

export const overlayEncuestaStore = create<OverlayEncuestaState>()(
  subscribeWithSelector((set) => ({
    encuesta: null,
    set: (encuesta) => set({ encuesta }),
    clear: () => set({ encuesta: null }),
  }))
)
