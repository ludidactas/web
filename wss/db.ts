import Redis from 'ioredis'

// Se asume que hay un server redis corriendo
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
})

/** Keys de hasmaps que tenemos en redis (declaración) */
type WssHashmaps =
  // Globales de sala
  | 'salas_owners'
  | 'owners_salas'
  | 'salas'
  // Por sala
  | `sala:${string}:estudiantes`
  | `sala:${string}:polls`
  // Por encuesta
  | `sala:${string}:poll:${string}:votos`

/** Keys globales que tenemos en redis */
type WssKeys = `sala:${string}:polls:focused`

/** Keys de sets que tenemos en redis */
type WssSets = `sala:${string}:poll:${string}:votantes`

/** Sobreescribimos los tipos de redis para auto-ayudarnos con hints */
interface RedisWss extends Omit<Redis, 'smismember'> {
  hget(key: WssHashmaps, field: string): Promise<string | null>
  get(key: WssKeys): Promise<string | null>
  set(key: WssKeys, value: string): Promise<'OK'>
  // Ojo, estamos chamuyando un poco con esta:
  smismember(key: WssSets, ...members: string[]): Promise<number[]>
}

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))
redis.on('ready', () => console.log('👍 Redis corrientdo y conectado'))

export default redis as RedisWss
