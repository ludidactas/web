import Redis from 'ioredis'

// Se asume que hay un server redis corriendo
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
})

/** Keys de hasmaps que tenemos en redis (declaración) */
export type WssHashmaps =
  // Globales de sala
  | 'salas_owners'
  | 'owners_salas'
  | 'salas'
  // Por sala
  | `sala:${string}:estudiantes`
  // Por encuesta
  | `sala:${string}:poll:${string}:votos`

/** Keys globales que tenemos en redis */
export type WssKeys =
  | `sala:${string}:polls:focused`
  | `sala:${string}:polls:${string}`

/** Keys de sets que tenemos en redis */
export type WssSets =
  | `sala:${string}:polls`
  | `sala:${string}:poll:${string}:votantes`
  | `sala:${string}:poll:${string}:opcion:${string}:votantes`
  | `sala:${string}:poll:${string}:votos:${string}`

/** Sobreescribimos los tipos de redis para auto-ayudarnos con hints */
interface RedisWss extends Omit<Redis, 'smismember' | 'smembers' | 'sadd' | 'srem' | 'scard' | 'sismember'> {
  hget(key: WssHashmaps, field: string): Promise<string | null>
  get(key: WssKeys): Promise<string | null>
  set(key: WssKeys, value: string): Promise<'OK'>
  smembers(key: WssSets): Promise<string[]>
  sadd(key: WssSets, ...members: string[]): Promise<number>
  srem(key: WssSets, ...members: string[]): Promise<number>
  scard(key: WssSets): Promise<number>
  sismember(key: WssSets, member: string): Promise<number>
  // Ojo, estamos chamuyando un poco con esta:
  smismember(key: WssSets, ...members: string[]): Promise<number[]>
}

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))
redis.on('ready', () => console.log('👍 Redis corrientdo y conectado'))

export default redis as RedisWss
