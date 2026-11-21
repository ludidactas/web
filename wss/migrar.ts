/** Corre las migraciones de redis pendientes. El CMD del Dockerfile lo ejecuta antes de levantar el server. */
import { migraciones } from './migraciones'
import { correrMigraciones } from './migraciones/runner'
import redis, { redisBullMQ } from './redis'

try {
  // Cierra la conexión de bullmq antes de correr para no disparar la guarda de exclusividad (`CLIENT LIST`).
  await redisBullMQ.quit().catch(() => redisBullMQ.disconnect())
  const entorno = process.env.ENTORNO
  const corridas = await correrMigraciones(redis, migraciones, {
    exigirExclusividad: entorno !== 'staging' && entorno !== 'development',
  })
  console.log(
    `✅ Migraciones de redis: ${corridas.length} aplicada(s), ${migraciones.length - corridas.length} al día.`
  )
  redis.disconnect()
} catch (err) {
  console.error('❌ Falló una migración de redis:', err)
  process.exit(1)
}
