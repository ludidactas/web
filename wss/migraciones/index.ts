import { planificarIds } from '../scripts/migrar-ids'
import type { Migracion } from './runner'

/** Corren solas en cada arranque (CMD de `wss/Dockerfile` → `wss/migrar.ts`); las ya aplicadas se saltean. Ver `docs/versionado-redis.md`. */
export const migraciones: Migracion[] = [
  {
    id: 'ids-opacos',
    destructiva: true,
    patrones: ['sala:*'],
    planificar: planificarIds,
  },
]
