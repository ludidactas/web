import { ConfigSala } from '@/wss/validators/salas'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ConfigSalaState {
  config: ConfigSala
  set: (config: ConfigSala) => void
}

export const storeConfig = create<ConfigSalaState>()(
  subscribeWithSelector((set) => ({
    config: { pedir_dni: false, permitir_anonimo: false, nombre_profe: '', link: '' },
    set: (config: ConfigSala) => set({ config }),
  }))
)
