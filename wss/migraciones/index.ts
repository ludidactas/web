import { migrarIds } from '../scripts/migrar-ids'
import type { Migracion } from './runner'

/** Corren solas en cada arranque (CMD de `wss/Dockerfile` → `wss/migrar.ts`); las ya aplicadas se saltean. Ver `docs/versionado-redis.md`. */
export const migraciones: Migracion[] = [
  {
    id: 'ids-opacos',
    up: async () => {
      const { conError } = await migrarIds({ dryRun: false })
      if (conError.length > 0) throw new Error(`Salas sin migrar: ${conError.join(', ')}`)
    },
  },
]
