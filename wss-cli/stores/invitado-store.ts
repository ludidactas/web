import { create } from 'zustand'

interface InvitadoState {
  esInvitado: boolean
  nombreProvisto?: string
  set: (payload: { nombreProvisto?: string }) => void
  reset: () => void
}

export const storeInvitado = create<InvitadoState>((set) => ({
  esInvitado: false,
  nombreProvisto: undefined,
  set: ({ nombreProvisto }) => set({ esInvitado: true, nombreProvisto }),
  reset: () => set({ esInvitado: false, nombreProvisto: undefined }),
}))
