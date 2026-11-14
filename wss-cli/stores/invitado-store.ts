import { create } from 'zustand'
import type { InfoEntrada } from '@/wss/validators/invitados'

interface InvitadoState {
  esInvitado: boolean
  info?: InfoEntrada
  set: (payload: { info?: InfoEntrada }) => void
  reset: () => void
}

export const storeInvitado = create<InvitadoState>((set) => ({
  esInvitado: false,
  info: undefined,
  set: ({ info }) => set({ esInvitado: true, info }),
  reset: () => set({ esInvitado: false, info: undefined }),
}))
