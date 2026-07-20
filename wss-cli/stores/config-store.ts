import { ConfigSala } from '@/wss/validators/salas'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ConfigSalaState {
  config: ConfigSala | null
  set: (config: ConfigSala | null) => void
}

export const storeConfig = create<ConfigSalaState>()(
  subscribeWithSelector((set) => ({
    config: null,
    set: (config: ConfigSala | null) => set({ config }),
  }))
)
