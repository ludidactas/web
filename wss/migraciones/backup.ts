import type Redis from 'ioredis'

/** Tiempo de vida por defecto de un backup en redis (7 días): acota cuánto viven snapshots con datos personales. */
export const BACKUP_TTL_SEG = 7 * 24 * 60 * 60

const TAM_LOTE = 200

export interface MetaBackup {
  creadoEn: string
  patrones: string[]
  claves: number
}

export interface ResumenBackup extends MetaBackup {
  id: string
  ttlSeg: number
}

export interface ResultadoRestore {
  restauradas: number
  borradas: number
}

export const clavesDeBackup = (prefijo: string, id: string) => ({
  meta: `${prefijo}:backup:${id}:meta`,
  datos: `${prefijo}:backup:${id}:datos`,
  ttls: `${prefijo}:backup:${id}:ttls`,
})

const esClaveInterna = (clave: string, prefijo: string) =>
  clave.startsWith(`${prefijo}:`) || clave.startsWith('bull:')

async function escanear(redis: Redis, patron: string): Promise<string[]> {
  const encontradas: string[] = []
  let cursor = '0'
  do {
    const [next, lote] = await redis.scan(cursor, 'MATCH', patron, 'COUNT', TAM_LOTE)
    cursor = next
    encontradas.push(...lote)
  } while (cursor !== '0')
  return encontradas
}

/** Lista las claves cubiertas por `patrones`, excluyendo claves de control de migraciones y bullmq. */
export async function listarClavesEnAlcance(redis: Redis, patrones: string[], prefijo: string): Promise<string[]> {
  const unicas = new Set<string>()
  for (const patron of patrones) {
    for (const clave of await escanear(redis, patron)) {
      if (!esClaveInterna(clave, prefijo)) unicas.add(clave)
    }
  }
  return [...unicas]
}

function verificarPipeline(resultados: [Error | null, unknown][] | null, operacion: string): void {
  if (!resultados) throw new Error(`Pipeline sin respuesta al ${operacion}.`)
  const fallido = resultados.find(([err]) => err)
  if (fallido?.[0]) throw new Error(`Error al ${operacion}: ${fallido[0].message}`)
}

/**
 * Guarda un snapshot binario (`DUMP` + `PTTL`) de las claves en `patrones` bajo `<prefijo>:backup:<id>:*`
 * con TTL. Permite revertir modificaciones, borrados y claves nuevas creadas por la migración.
 */
export async function guardarBackup(
  redis: Redis,
  id: string,
  {
    prefijo = 'migraciones',
    patrones = ['*'],
    ttlSeg = BACKUP_TTL_SEG,
  }: { prefijo?: string; patrones?: string[]; ttlSeg?: number } = {}
): Promise<number> {
  const bk = clavesDeBackup(prefijo, id)
  await redis.del(bk.meta, bk.datos, bk.ttls)

  const claves = await listarClavesEnAlcance(redis, patrones, prefijo)
  let guardadas = 0
  let conTtl = false

  for (let i = 0; i < claves.length; i += TAM_LOTE) {
    const lote = claves.slice(i, i + TAM_LOTE)
    const lectura = redis.pipeline()
    for (const clave of lote) {
      lectura.dumpBuffer(clave)
      lectura.pttl(clave)
    }
    const respuestas = await lectura.exec()
    verificarPipeline(respuestas, `leer backup de ${id}`)

    const escritura = redis.pipeline()
    let enLote = 0
    for (let j = 0; j < lote.length; j++) {
      const dump = respuestas![j * 2][1] as Buffer | null
      const pttl = respuestas![j * 2 + 1][1] as number
      if (!dump) continue
      escritura.hset(bk.datos, lote[j], dump)
      if (pttl > 0) {
        escritura.hset(bk.ttls, lote[j], String(pttl))
        conTtl = true
      }
      enLote++
    }
    if (enLote > 0) {
      verificarPipeline(await escritura.exec(), `escribir backup de ${id}`)
      guardadas += enLote
    }
  }

  const meta: MetaBackup = { creadoEn: new Date().toISOString(), patrones, claves: guardadas }
  const cierre = redis.pipeline()
  cierre.set(bk.meta, JSON.stringify(meta), 'EX', ttlSeg)
  if (guardadas > 0) cierre.expire(bk.datos, ttlSeg)
  if (conTtl) cierre.expire(bk.ttls, ttlSeg)
  verificarPipeline(await cierre.exec(), `cerrar backup de ${id}`)

  return guardadas
}

/**
 * Restaura redis al estado guardado en `<prefijo>:backup:<id>:*`: borra claves nuevas dentro de los
 * patrones del backup, restaura con `RESTORE ... REPLACE` cada clave respaldada (con su TTL) y saca
 * `id` de `<prefijo>:aplicadas`. Es idempotente mientras el backup siga vigente.
 */
export async function restaurarBackup(
  redis: Redis,
  id: string,
  { prefijo = 'migraciones' }: { prefijo?: string } = {}
): Promise<ResultadoRestore> {
  const bk = clavesDeBackup(prefijo, id)
  const metaCruda = await redis.get(bk.meta)
  if (!metaCruda) {
    throw new Error(`No hay backup vigente para la migración "${id}" (venció o nunca se guardó).`)
  }
  const meta = JSON.parse(metaCruda) as MetaBackup

  // `hgetallBuffer` conserva los buffers binarios de `DUMP` sin corromperlos como UTF-8.
  const dumps = await redis.hgetallBuffer(bk.datos)
  const ttls = await redis.hgetall(bk.ttls)
  const clavesOriginales = new Set(Object.keys(dumps))

  const actuales = await listarClavesEnAlcance(redis, meta.patrones, prefijo)
  const aBorrar = actuales.filter((c) => !clavesOriginales.has(c))
  for (let i = 0; i < aBorrar.length; i += TAM_LOTE) {
    await redis.del(...aBorrar.slice(i, i + TAM_LOTE))
  }

  const entradas = Object.entries(dumps)
  for (let i = 0; i < entradas.length; i += TAM_LOTE) {
    const pipe = redis.pipeline()
    for (const [clave, dump] of entradas.slice(i, i + TAM_LOTE)) {
      const ttlMs = Number(ttls[clave] ?? 0)
      pipe.restore(clave, ttlMs, dump, 'REPLACE')
    }
    verificarPipeline(await pipe.exec(), `restaurar backup de ${id}`)
  }

  await redis.hdel(`${prefijo}:aplicadas`, id)
  return { restauradas: entradas.length, borradas: aBorrar.length }
}

/** Lista los backups vigentes en redis para `<prefijo>`. */
export async function listarBackups(
  redis: Redis,
  { prefijo = 'migraciones' }: { prefijo?: string } = {}
): Promise<ResumenBackup[]> {
  const prefijoMeta = `${prefijo}:backup:`
  const sufijoMeta = ':meta'
  const clavesMeta = await escanear(redis, `${prefijoMeta}*${sufijoMeta}`)
  const lista: ResumenBackup[] = []

  for (const clave of clavesMeta) {
    const id = clave.slice(prefijoMeta.length, -sufijoMeta.length)
    const [crudo, ttlSeg] = await Promise.all([redis.get(clave), redis.ttl(clave)])
    if (!crudo) continue
    const meta = JSON.parse(crudo) as MetaBackup
    lista.push({ id, ...meta, ttlSeg })
  }
  return lista.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}
