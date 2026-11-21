import type Redis from 'ioredis'
import { BACKUP_TTL_SEG, guardarBackup, restaurarBackup, type ResultadoRestore } from './backup'

export interface Migracion {
  /** Identificador estable y único; una migración aplicada queda registrada por este id. */
  id: string
  /** Patrones de claves que la migración lee o modifica; acotan backup y rollback (default `['*']`). */
  patrones?: string[]
  /** Simula y valida la migración sin escribir en redis; corre siempre antes del backup y de `up`. */
  dryRun: (redis: Redis) => Promise<void>
  /** Aplica la migración; si falla en el medio, el runner restaura el backup previo. */
  up: (redis: Redis) => Promise<void>
}

export interface Opciones {
  /** Prefijo de las claves de control (`<prefijo>:aplicadas`, `<prefijo>:lock`, `<prefijo>:backup:*`). */
  prefijo?: string
  /** Cuánto vive el lock si el proceso que lo tiene muere sin liberarlo. */
  lockMs?: number
  /** Cada cuánto reintenta tomar el lock mientras otra instancia migra. */
  esperaMs?: number
  /** Patrones de claves por defecto para el backup cuando la migración no declara `patrones`. */
  patrones?: string[]
  /** Tiempo de vida en segundos de cada backup en redis. */
  backupTtlSeg?: number
}

const LIBERAR_LOCK = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0`

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function conLock<T>(
  redis: Redis,
  { prefijo, lockMs, esperaMs }: { prefijo: string; lockMs: number; esperaMs: number },
  fn: () => Promise<T>
): Promise<T> {
  const claveLock = `${prefijo}:lock`
  const token = crypto.randomUUID()
  while ((await redis.set(claveLock, token, 'PX', lockMs, 'NX')) !== 'OK') await dormir(esperaMs)
  try {
    return await fn()
  } finally {
    await redis.eval(LIBERAR_LOCK, 1, claveLock, token)
  }
}

async function revertirLista(redis: Redis, ids: string[], prefijo: string): Promise<void> {
  for (const id of [...ids].reverse()) {
    console.error(`⏪ Revirtiendo migración ${id} desde su backup...`)
    await restaurarBackup(redis, id, { prefijo })
  }
}

/**
 * Aplica en orden las migraciones pendientes y devuelve los ids que corrió. Un lock en redis
 * serializa a las instancias que arrancan a la vez; la que espera relee `aplicadas` al tomarlo y
 * encuentra todo hecho. Antes de cada `up` guarda un backup con TTL: si una migración falla,
 * revierte sus cambios y los de cualquier otra migración aplicada en la misma corrida.
 */
export async function correrMigraciones(
  redis: Redis,
  migraciones: Migracion[],
  {
    prefijo = 'migraciones',
    lockMs = 2 * 60_000,
    esperaMs = 500,
    patrones = ['*'],
    backupTtlSeg = BACKUP_TTL_SEG,
  }: Opciones = {}
): Promise<string[]> {
  return conLock(redis, { prefijo, lockMs, esperaMs }, async () => {
    const claveAplicadas = `${prefijo}:aplicadas`
    const aplicadas = new Set(await redis.hkeys(claveAplicadas))
    const corridas: string[] = []

    for (const m of migraciones) {
      if (aplicadas.has(m.id)) continue
      console.log(`🔧 Migración ${m.id}...`)

      let backupGuardado = false
      try {
        await m.dryRun(redis)
        await guardarBackup(redis, m.id, {
          prefijo,
          patrones: m.patrones ?? patrones,
          ttlSeg: backupTtlSeg,
        })
        backupGuardado = true
        await m.up(redis)
        await redis.hset(claveAplicadas, m.id, new Date().toISOString())
        corridas.push(m.id)
      } catch (err) {
        const aRevertir = backupGuardado ? [...corridas, m.id] : corridas
        if (aRevertir.length > 0) {
          try {
            await revertirLista(redis, aRevertir, prefijo)
          } catch (rollbackErr) {
            console.error('❌ Falló el rollback automático tras el error de migración:', rollbackErr)
          }
        }
        throw err
      }
    }
    return corridas
  })
}

/** Restaura manualmente redis al estado previo a la migración `id`, serializado por el lock del runner. */
export async function restaurarMigracion(
  redis: Redis,
  id: string,
  { prefijo = 'migraciones', lockMs = 2 * 60_000, esperaMs = 500 }: Pick<Opciones, 'prefijo' | 'lockMs' | 'esperaMs'> = {}
): Promise<ResultadoRestore> {
  return conLock(redis, { prefijo, lockMs, esperaMs }, () => restaurarBackup(redis, id, { prefijo }))
}
