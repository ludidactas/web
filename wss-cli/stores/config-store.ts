import { ConfigSala } from '@/wss/validators/salas'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ConfigSalaState {
  idSala: string | null
  config: ConfigSala | null
  set: (config: ConfigSala | null) => void
  setIdSala: (id: string | null) => void
}

export const storeConfig = create<ConfigSalaState>()(
  subscribeWithSelector((set) => ({
    idSala: null,
    config: null,
    set: (config: ConfigSala | null) => set({ config }),
    setIdSala: (idSala: string | null) => set({ idSala }),
  }))
)
