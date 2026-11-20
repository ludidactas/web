import type Redis from 'ioredis'

export interface Migracion {
  /** Identificador estable y único; una migración aplicada queda registrada por este id. */
  id: string
  /** Debe ser idempotente: si queda a medias, el próximo arranque la repite entera. */
  up: (redis: Redis) => Promise<void>
}

interface Opciones {
  /** Prefijo de las claves de control (`<prefijo>:aplicadas`, `<prefijo>:lock`). */
  prefijo?: string
  /** Cuánto vive el lock si el proceso que lo tiene muere sin liberarlo. */
  lockMs?: number
  /** Cada cuánto reintenta tomar el lock mientras otra instancia migra. */
  esperaMs?: number
}

const LIBERAR_LOCK = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0`

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Aplica en orden las migraciones que faltan y devuelve los ids que corrió. Un lock en redis
 * serializa a las instancias que arrancan a la vez; la que espera relee `aplicadas` al tomarlo y
 * encuentra todo hecho. Si una migración tira, se corta ahí y las siguientes quedan pendientes.
 */
export async function correrMigraciones(
  redis: Redis,
  migraciones: Migracion[],
  { prefijo = 'migraciones', lockMs = 10 * 60_000, esperaMs = 500 }: Opciones = {}
): Promise<string[]> {
  const claveAplicadas = `${prefijo}:aplicadas`
  const claveLock = `${prefijo}:lock`
  const token = crypto.randomUUID()

  while ((await redis.set(claveLock, token, 'PX', lockMs, 'NX')) !== 'OK') await dormir(esperaMs)

  const corridas: string[] = []
  try {
    const aplicadas = new Set(await redis.hkeys(claveAplicadas))
    for (const m of migraciones) {
      if (aplicadas.has(m.id)) continue
      console.log(`🔧 Migración ${m.id}...`)
      await m.up(redis)
      await redis.hset(claveAplicadas, m.id, new Date().toISOString())
      corridas.push(m.id)
    }
  } finally {
    await redis.eval(LIBERAR_LOCK, 1, claveLock, token)
  }
  return corridas
}
