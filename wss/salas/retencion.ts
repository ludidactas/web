import { Queue, Worker } from 'bullmq'
import redis, { redisBullMQ } from '../redis'
import { Salas } from './app'
import * as db from './db'

const DIA_MS = 24 * 60 * 60_000

/** Días sin uso a partir de los cuales una sala se borra entera. */
export const RETENCION_DIAS = 365

const NOMBRE_COLA = 'salas-retencion'

/**
 * Recorre las salas: marca las que no tienen fecha de actividad y elimina (con `Salas.eliminar`) las
 * que llevan más de `RETENCION_DIAS` sin uso. Una sala que falla se registra por su id y no frena a las demás.
 */
export async function barrerSalasInactivas(ahora = Date.now()): Promise<void> {
  const ids = await redis.hkeys('salas')

  for (const salaId of ids) {
    try {
      const ultima = await db.getUltimaActividad(salaId)
      if (ultima === null) {
        await db.marcarActividad(salaId, ahora)
        continue
      }
      if (ahora - ultima <= RETENCION_DIAS * DIA_MS) continue

      const email = await db.getEmailProfe(salaId)
      if (email) await Salas.eliminar(email, salaId)
      else await db.borrarSala(salaId)
    } catch (err) {
      console.error(`Error aplicando la retención a la sala ${salaId}:`, err instanceof Error ? err.message : err)
    }
  }
}

/** Agenda el barrido diario y arranca el Worker que lo ejecuta. */
export function iniciarRetencion(): void {
  const cola = new Queue(NOMBRE_COLA, { connection: redisBullMQ })
  cola
    .upsertJobScheduler('barrido-diario', { every: DIA_MS }, { name: 'barrido', opts: { removeOnComplete: true, removeOnFail: { count: 50 } } })
    .catch((err) => console.error('Error agendando la retención de salas:', err))

  const worker = new Worker(NOMBRE_COLA, () => barrerSalasInactivas(), { connection: redisBullMQ })
  worker.on('failed', (_job, err) => console.error('Error en el barrido de retención de salas:', err.message))
}
