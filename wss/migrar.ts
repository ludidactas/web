/** Corre las migraciones de redis pendientes. El CMD del Dockerfile lo ejecuta antes de levantar el server. */
import { migraciones } from './migraciones'
import { correrMigraciones } from './migraciones/runner'
import redis, { redisBullMQ } from './redis'

try {
  const corridas = await correrMigraciones(redis, migraciones)
  console.log(
    `✅ Migraciones de redis: ${corridas.length} aplicada(s), ${migraciones.length - corridas.length} al día.`
  )
  redis.disconnect()
  redisBullMQ.disconnect()
} catch (err) {
  console.error('❌ Falló una migración de redis:', err)
  process.exit(1)
}
