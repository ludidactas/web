import { randomBytes } from 'node:crypto'
import redis from '../redis'
import type { ProgresoDojoRemoto } from '../validators/dojo'

/** Progreso anónimo del dojo de Go — claves bajo `dojo:<idDojo>:...` (ver `k` abajo). */
const k = {
  /** ZSET — desafíos resueltos del capítulo; el score es el timestamp de la primera resolución. */
  resueltos: (idDojo: string, capitulo: string) => `dojo:${idDojo}:resueltos:${capitulo}`,
  /** HASH — capítulo -> id del desafío abierto por última vez. */
  actual: (idDojo: string) => `dojo:${idDojo}:actual`,
  /** STRING — timestamp de creación del id. */
  creado: (idDojo: string) => `dojo:${idDojo}:creado`,
}

/** Crea un id de visitante nuevo y lo registra. */
export async function emitirId(ahora = Date.now()): Promise<string> {
  const idDojo = randomBytes(16).toString('hex')
  await redis.set(k.creado(idDojo), ahora)
  return idDojo
}

/** Si `idDojo` fue emitido por `emitirId`. */
export async function existe(idDojo: string): Promise<boolean> {
  return (await redis.exists(k.creado(idDojo))) === 1
}

/** Agrega desafíos resueltos sin pisar el timestamp de los que ya estaban. */
export async function agregarResueltos(idDojo: string, capitulo: string, desafios: string[], ahora = Date.now()) {
  if (!desafios.length) return
  await redis.zadd(k.resueltos(idDojo, capitulo), 'NX', ...desafios.flatMap((d) => [ahora, d]))
}

export async function setActual(idDojo: string, capitulo: string, desafio: string) {
  await redis.hset(k.actual(idDojo), capitulo, desafio)
}

export async function getProgreso(idDojo: string, capitulo: string): Promise<ProgresoDojoRemoto> {
  const [resueltos, actual] = await Promise.all([
    redis.zrange(k.resueltos(idDojo, capitulo), 0, -1),
    redis.hget(k.actual(idDojo), capitulo),
  ])
  return { resueltos, actual }
}

