import Redis from 'ioredis'

const opcionesBase = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: (process.env.REDIS_PORT && parseInt(process.env.REDIS_PORT)) || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
}

// Se asume que hay un server redis corriendo
const redis = new Redis(opcionesBase)

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))

/**
 * Conexión para bullmq (`wss/asistencia/seguimiento.ts`): exige `maxRetriesPerRequest: null`, así que
 * no puede ser la misma que `redis`. La comparten Queue y Worker — bullmq duplica internamente lo que
 * necesita para sus comandos bloqueantes, así que una sola instancia alcanza para todos los Queue/Workers.
 */
export const redisBullMQ = new Redis({ ...opcionesBase, maxRetriesPerRequest: null })

redisBullMQ.on('error', (err) => console.error('❌ Redis (bullmq) tiró error:', err))

export default redis
