/**
 * Rollback manual de una migración de redis usando el backup guardado antes de aplicarla.
 *
 *   bun run wss/migraciones/restaurar.ts <id>
 *
 * Correr con el WSS detenido para que ningún proceso escriba en paralelo durante el restore.
 * Sin argumentos lista los backups vigentes sin tocar redis.
 */
import redis, { redisBullMQ } from '../redis'
import { listarBackups } from './backup'
import { restaurarMigracion } from './runner'

const id = process.argv[2]

try {
  if (!id) {
    const backups = await listarBackups(redis)
    console.error('Uso: bun run wss/migraciones/restaurar.ts <id>')
    if (backups.length === 0) {
      console.error('No hay backups vigentes en redis.')
    } else {
      console.error('Backups vigentes:')
      for (const b of backups) {
        console.error(`  - ${b.id} (${b.claves} claves, creado ${b.creadoEn}, vence en ${b.ttlSeg}s)`)
      }
    }
    redis.disconnect()
    redisBullMQ.disconnect()
    process.exit(1)
  }

  // Cierra la conexión de bullmq antes de verificar exclusividad (`CLIENT LIST`).
  await redisBullMQ.quit().catch(() => redisBullMQ.disconnect())
  console.log(`⏪ Restaurando redis al estado previo a la migración "${id}"...`)
  const { restauradas, borradas } = await restaurarMigracion(redis, id)
  console.log(`✅ Listo: ${restauradas} clave(s) restaurada(s), ${borradas} clave(s) nueva(s) eliminada(s).`)
  redis.disconnect()
} catch (err) {
  console.error('❌ Falló el rollback de redis:', err)
  redis.disconnect()
  redisBullMQ.disconnect()
  process.exit(1)
}
