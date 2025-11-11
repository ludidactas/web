import Redis from "ioredis";

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
})

type WssHashmaps =
  // Globales de sala
  'salas_owners' | 'owners_salas' | 'salas'
  // Por sala
  | `sala:${string}:estudiantes` | `sala:${string}:polls`
  // Por encuesta
  | `sala:${string}:poll:${string}:votos`

type WssKeys = `sala:${string}:polls:focused`

type WssSets = `sala:${string}:poll:${string}:votantes`

interface RedisWss extends Omit<Redis, 'smismember'> { 
  hget(key: WssHashmaps, field: string): Promise<string | null>
  get(key: WssKeys): Promise<string | null>
  set(key: WssKeys, value: string): Promise<'OK'>
  // Ojo, estamos chamuyando un poco con esta: 
  smismember(key: WssSets, ...members: string[]): Promise<number[]>
}

redis.on('error', (err) => console.error('❌ Redis tiró error:', err))
redis.on('ready', () => console.log('🚀 Redis corrientdo y conectado'))

export default redis as RedisWss