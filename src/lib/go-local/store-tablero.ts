import { TAMAÑOS_TABLERO, type ModoPartida, type TamañoTablero } from '@/wss/validators/go'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { nuevaPartidaLocal, type PartidaLocal } from './partida-local'

type Partidas = Record<TamañoTablero, PartidaLocal>

interface TableroLocalState {
  /** Tamaño del tablero que se está mirando. */
  tamaño: TamañoTablero
  /** Una partida por tamaño (con su propio modo): cambiar de tamaño solo cambia cuál se muestra, las demás se conservan. */
  partidas: Partidas
  setTamaño: (tamaño: TamañoTablero) => void
  /** Reemplaza la partida del tamaño que se está mirando. */
  setPartida: (partida: PartidaLocal) => void
  /** Empieza una partida nueva, en el modo dado, en el tamaño que se está mirando. */
  nuevaPartida: (modo: ModoPartida) => void
}

const partidasNuevas = () => Object.fromEntries(TAMAÑOS_TABLERO.map((t) => [t, nuevaPartidaLocal(t)])) as Partidas

/**
 * Partidas locales guardadas en localStorage. `skipHydration`: el servidor renderiza los tableros
 * vacíos, así que el cliente recupera lo guardado recién al montar (`storeTableroLocal.persist.rehydrate()`)
 * para no desincronizar el HTML. Al cambiar la forma de `PartidaLocal` o del store hay que subir
 * `version`: lo guardado con otra versión se descarta.
 */
export const storeTableroLocal = create<TableroLocalState>()(
  persist(
    (set) => ({
      tamaño: 9,
      partidas: partidasNuevas(),
      setTamaño: (tamaño) => set({ tamaño }),
      setPartida: (partida) => set((s) => ({ partidas: { ...s.partidas, [s.tamaño]: partida } })),
      nuevaPartida: (modo) =>
        set((s) => ({ partidas: { ...s.partidas, [s.tamaño]: nuevaPartidaLocal(s.tamaño, modo) } })),
    }),
    {
      name: 'go-tablero-local',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ tamaño, partidas }) => ({ tamaño, partidas }),
      skipHydration: true,
    }
  )
)
