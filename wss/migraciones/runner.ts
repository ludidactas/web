import type Redis from 'ioredis'
import {
  BACKUP_TTL_SEG,
  capturarClave,
  clavePendientes,
  escanear,
  guardarBackup,
  restaurarBackup,
  type ResultadoRestore,
} from './backup'

export type Comando = string[]

export type TipoRedis = 'string' | 'hash' | 'list' | 'set' | 'zset'

export interface EntradaPendiente {
  unidad: string
  origen: string
  motivo: string
  ts: number
  clave: string
  campo?: string
  valor?: string
  dumpBase64?: string
  pttl?: number
}

export interface UnidadPlanificada {
  etiqueta: string
  comandos: Comando[]
  claves: Set<string>
  pendientes: EntradaPendiente[]
}

export interface PlanMigracion {
  unidades: UnidadPlanificada[]
  pendientes: EntradaPendiente[]
}

export interface UnidadPlanificador {
  leerString(clave: string, origen: string): Promise<string | null>
  leerHash(clave: string, origen: string): Promise<Record<string, string> | null>
  leerLista(clave: string, origen: string): Promise<string[] | null>
  leerSet(clave: string, origen: string): Promise<string[] | null>
  asegurarTipo(clave: string, esperado: TipoRedis, origen: string): Promise<boolean>
  parsearElemento<T>(
    raw: string,
    parser: (s: string) => T,
    meta: { origen: string; clave: string; campo?: string }
  ): T | null
  parsearClave<T>(clave: string, raw: string, parser: (s: string) => T, origen: string): Promise<T | null>
  emitir(clave: string, ...comando: string[]): void
  reemplazar(clave: string, comando: string, valores: string[]): void
  renombrar(origen: string, destino: string): void
}

export interface Planificador {
  readonly redis: Redis
  readonly ahora: number
  escanear(patron: string): Promise<string[]>
  unidad(etiqueta: string, fn: (u: UnidadPlanificador) => Promise<void>): Promise<UnidadPlanificada>
}

interface MigracionBase {
  /** Identificador estable y único; una migración aplicada queda registrada por este id. */
  id: string
  /** Si es `true` y corre con `exigirExclusividad`, aborta si hay otros clientes conectados a redis. */
  destructiva?: boolean
  /** Patrones de claves que la migración lee o modifica; acotan backup y rollback (default `['*']`). */
  patrones?: string[]
}

export type Migracion =
  | (MigracionBase & {
      /** Simula y valida la migración sin escribir en redis; corre siempre antes del backup y de `up`. */
      dryRun: (redis: Redis) => Promise<void>
      /** Aplica la migración; si falla en el medio, el runner restaura el backup previo. */
      up: (redis: Redis) => Promise<void>
      planificar?: never
    })
  | (MigracionBase & {
      /** Pre-corrida de solo lectura que clasifica cambios válidos y entradas inválidas (`pendientes`). */
      planificar: (planificador: Planificador) => Promise<void>
      dryRun?: never
      up?: never
    })

export interface Opciones {
  /** Prefijo de las claves de control (`<prefijo>:aplicadas`, `<prefijo>:lock`, `<prefijo>:backup:*`, `<prefijo>:pendientes:*`). */
  prefijo?: string
  /** Cuánto vive el lock si el proceso que lo tiene muere sin liberarlo. */
  lockMs?: number
  /** Cada cuánto reintenta tomar el lock mientras otra instancia migra. */
  esperaMs?: number
  /** Patrones de claves por defecto para el backup cuando la migración no declara `patrones`. */
  patrones?: string[]
  /** Tiempo de vida en segundos de cada backup en redis. */
  backupTtlSeg?: number
  /** Si es `true`, las migraciones con `destructiva: true` abortan si hay otro cliente conectado a redis. */
  exigirExclusividad?: boolean
}

const LIBERAR_LOCK = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0`

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const nombreError = (err: unknown): string => (err instanceof Error ? err.name : typeof err)

/** Ejecuta la fase de lectura de una migración y construye el plan `{ unidades, pendientes }` sin escribir en redis. */
export async function armarPlan(
  redis: Redis,
  fn: (planificador: Planificador) => Promise<void>,
  { ahora = Date.now() }: { ahora?: number } = {}
): Promise<PlanMigracion> {
  const unidades: UnidadPlanificada[] = []
  const pendientesTotales: EntradaPendiente[] = []

  const planificador: Planificador = {
    redis,
    ahora,
    escanear: (patron) => escanear(redis, patron),
    async unidad(etiqueta, cb) {
      const comandos: Comando[] = []
      const claves = new Set<string>()
      const pendientes: EntradaPendiente[] = []

      const emitir = (clave: string, ...comando: string[]) => {
        claves.add(clave)
        comandos.push([comando[0], clave, ...comando.slice(1)])
      }
      const reemplazar = (clave: string, comando: string, valores: string[]) => {
        emitir(clave, 'del')
        if (valores.length > 0) emitir(clave, comando, ...valores)
      }
      const renombrar = (origen: string, destino: string) => {
        if (origen === destino) return
        emitir(origen, 'rename', destino)
        claves.add(destino)
      }
      const registrarPendiente = (entrada: Omit<EntradaPendiente, 'unidad' | 'ts'>) => {
        const completa: EntradaPendiente = { unidad: etiqueta, ts: ahora, ...entrada }
        pendientes.push(completa)
        pendientesTotales.push(completa)
      }
      const desviarClave = async (clave: string, origen: string, motivo: string) => {
        const captura = await capturarClave(redis, clave)
        if (!captura) return
        registrarPendiente({ origen, motivo, clave, ...captura })
        emitir(clave, 'del')
      }
      const asegurarTipo = async (clave: string, esperado: TipoRedis, origen: string): Promise<boolean> => {
        const tipo = await redis.type(clave)
        if (tipo === 'none') return false
        if (tipo !== esperado) {
          await desviarClave(clave, origen, `TipoInesperado(${tipo})`)
          return false
        }
        return true
      }

      const u: UnidadPlanificador = {
        emitir,
        reemplazar,
        renombrar,
        asegurarTipo,
        async leerString(clave, origen) {
          if (!(await asegurarTipo(clave, 'string', origen))) return null
          return redis.get(clave)
        },
        async leerHash(clave, origen) {
          if (!(await asegurarTipo(clave, 'hash', origen))) return null
          return redis.hgetall(clave)
        },
        async leerLista(clave, origen) {
          if (!(await asegurarTipo(clave, 'list', origen))) return null
          return redis.lrange(clave, 0, -1)
        },
        async leerSet(clave, origen) {
          if (!(await asegurarTipo(clave, 'set', origen))) return null
          return redis.smembers(clave)
        },
        parsearElemento(raw, parser, meta) {
          try {
            return parser(raw)
          } catch (err) {
            registrarPendiente({ ...meta, motivo: nombreError(err), valor: raw })
            return null
          }
        },
        async parsearClave(clave, raw, parser, origen) {
          try {
            return parser(raw)
          } catch (err) {
            await desviarClave(clave, origen, nombreError(err))
            return null
          }
        },
      }

      await cb(u)
      const planUnidad: UnidadPlanificada = { etiqueta, comandos, claves, pendientes }
      unidades.push(planUnidad)
      return planUnidad
    },
  }

  await fn(planificador)
  return { unidades, pendientes: pendientesTotales }
}

function loguearResumenPlan(id: string, plan: PlanMigracion, dryRun: boolean, prefijo: string): void {
  const destino = clavePendientes(prefijo, id)
  for (const u of plan.unidades) {
    if (u.pendientes.length === 0) continue
    const causas = u.pendientes.map((p) => `${p.origen}:${p.motivo}`).join(', ')
    console.warn(
      `   ⚠️ ${u.etiqueta}: ${u.pendientes.length} entrada(s) ${dryRun ? `irían a ${destino}` : `movida(s) a ${destino}`} (${causas})`
    )
  }
}

/** Aplica cada unidad de `plan` en un `MULTI` atómico junto con sus entradas hacia `<prefijo>:pendientes:<id>`. */
export async function aplicarPlan(
  redis: Redis,
  id: string,
  plan: PlanMigracion,
  { prefijo = 'migraciones' }: { prefijo?: string } = {}
): Promise<void> {
  const destinoPendientes = clavePendientes(prefijo, id)
  for (const u of plan.unidades) {
    const comandos = [...u.comandos]
    if (u.pendientes.length > 0) {
      const pares = u.pendientes.flatMap((p) => [crypto.randomUUID(), JSON.stringify(p)])
      comandos.push(['hset', destinoPendientes, ...pares])
    }
    if (comandos.length === 0) continue
    const resultados = await redis.multi(comandos).exec()
    const fallido = resultados?.find(([err]) => err)
    if (!resultados || fallido) {
      throw new Error(`El MULTI de "${u.etiqueta}" no se aplicó completo.`)
    }
  }
  loguearResumenPlan(id, plan, false, prefijo)
}

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

async function verificarExclusividad(redis: Redis, operacion: string): Promise<void> {
  const miId = Number(await redis.client('ID'))
  const crudo = (await redis.call('CLIENT', 'LIST', 'TYPE', 'normal')) as string
  const ajenos = crudo
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((linea) => Number(linea.match(/^id=(\d+)/)?.[1]))
    .filter((clientId) => Number.isFinite(clientId) && clientId !== miId)

  if (ajenos.length > 0) {
    throw new Error(
      `"${operacion}" requiere exclusividad sobre redis (hay ${ajenos.length} cliente(s) conectado(s)). Detener el WSS antes de correrla.`
    )
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
    exigirExclusividad = false,
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
        if (m.destructiva && exigirExclusividad) await verificarExclusividad(redis, m.id)

        if (m.planificar) {
          const plan = await armarPlan(redis, m.planificar)
          await guardarBackup(redis, m.id, {
            prefijo,
            patrones: m.patrones ?? patrones,
            ttlSeg: backupTtlSeg,
          })
          backupGuardado = true
          await aplicarPlan(redis, m.id, plan, { prefijo })
        } else {
          await m.dryRun(redis)
          await guardarBackup(redis, m.id, {
            prefijo,
            patrones: m.patrones ?? patrones,
            ttlSeg: backupTtlSeg,
          })
          backupGuardado = true
          await m.up(redis)
        }

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

/**
 * Restaura manualmente redis al estado previo a la migración `id`, serializado por el lock del runner.
 * Por defecto exige exclusividad sobre redis (`CLIENT LIST`) para no pisar escrituras de un WSS vivo.
 */
export async function restaurarMigracion(
  redis: Redis,
  id: string,
  {
    prefijo = 'migraciones',
    lockMs = 2 * 60_000,
    esperaMs = 500,
    exigirExclusividad = true,
  }: Pick<Opciones, 'prefijo' | 'lockMs' | 'esperaMs' | 'exigirExclusividad'> = {}
): Promise<ResultadoRestore> {
  return conLock(redis, { prefijo, lockMs, esperaMs }, async () => {
    if (exigirExclusividad) await verificarExclusividad(redis, `restaurar ${id}`)
    return restaurarBackup(redis, id, { prefijo })
  })
}
