import { afterAll, describe, expect, it, spyOn } from 'bun:test'
import redis from '../wss/redis'
import { clavePendientes, clavesDeBackup, listarBackups } from '../wss/migraciones/backup'
import { armarPlan, correrMigraciones, restaurarMigracion, type EntradaPendiente, type Migracion } from '../wss/migraciones/runner'

const prefijo = `test-migraciones-${crypto.randomUUID()}`
const datos = `${prefijo}-datos`
const opciones = { prefijo, esperaMs: 10, patrones: [`${datos}:*`] }

const idsUsados: string[] = []
const registrar = (id: string) => {
  idsUsados.push(id)
  return id
}
const noop = async () => {}

afterAll(async () => {
  const clavesDatos: string[] = []
  let cursor = '0'
  do {
    const [next, lote] = await redis.scan(cursor, 'MATCH', `${datos}:*`, 'COUNT', 200)
    cursor = next
    clavesDatos.push(...lote)
  } while (cursor !== '0')

  const clavesBackup = idsUsados.flatMap((id) => [
    ...Object.values(clavesDeBackup(prefijo, id)),
    clavePendientes(prefijo, id),
  ])
  const todas = [`${prefijo}:aplicadas`, `${prefijo}:lock`, ...clavesDatos, ...clavesBackup]
  if (todas.length > 0) await redis.del(...todas)
})

describe('correrMigraciones', () => {
  it('aplica en orden las pendientes (dryRun antes de up) y no repite las ya aplicadas', async () => {
    const orden: string[] = []
    const lista: Migracion[] = [registrar('a'), registrar('b')].map((id) => ({
      id,
      dryRun: async () => void orden.push(`dry:${id}`),
      up: async () => void orden.push(`up:${id}`),
    }))

    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['a', 'b'])
    expect(await correrMigraciones(redis, lista, opciones)).toEqual([])

    lista.push({
      id: registrar('c'),
      dryRun: async () => void orden.push('dry:c'),
      up: async () => void orden.push('up:c'),
    })
    expect(await correrMigraciones(redis, lista, opciones)).toEqual(['c'])
    expect(orden).toEqual(['dry:a', 'up:a', 'dry:b', 'up:b', 'dry:c', 'up:c'])
  })

  it('si dryRun tira, no crea backup ni corre up y libera el lock', async () => {
    const id = registrar('dryrun-falla')
    let corrioUp = false
    const lista: Migracion[] = [
      {
        id,
        dryRun: async () => {
          throw new Error('precondición rota')
        },
        up: async () => {
          corrioUp = true
        },
      },
    ]

    await expect(correrMigraciones(redis, lista, opciones)).rejects.toThrow('precondición rota')
    expect(corrioUp).toBe(false)
    expect(await redis.exists(clavesDeBackup(prefijo, id).meta)).toBe(0)
    expect(await redis.exists(`${prefijo}:lock`)).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
  })

  it('si up falla a mitad de camino, restaura claves borradas/modificadas (con TTL) y borra las nuevas', async () => {
    const id = registrar('falla-a-medias')
    const kStr = `${datos}:str`
    const kHash = `${datos}:hash`
    const kSet = `${datos}:set`
    const kNueva = `${datos}:nueva`

    await redis.set(kStr, 'original', 'PX', 60_000)
    await redis.hset(kHash, 'campo', 'valor')
    await redis.sadd(kSet, 'uno', 'dos')

    const silenciar = spyOn(console, 'error').mockImplementation(() => {})
    try {
      let intentos = 0
      const lista: Migracion[] = [
        {
          id,
          dryRun: noop,
          up: async (r) => {
            await r.del(kStr)
            await r.hset(kHash, 'campo', 'mutado', 'extra', 'x')
            await r.srem(kSet, 'uno')
            await r.set(kNueva, 'creada')
            if (++intentos === 1) throw new Error('boom en el medio')
          },
        },
      ]

      await expect(correrMigraciones(redis, lista, opciones)).rejects.toThrow('boom en el medio')

      expect(await redis.get(kStr)).toBe('original')
      expect(await redis.pttl(kStr)).toBeGreaterThan(0)
      expect(await redis.hgetall(kHash)).toEqual({ campo: 'valor' })
      expect((await redis.smembers(kSet)).sort()).toEqual(['dos', 'uno'])
      expect(await redis.exists(kNueva)).toBe(0)
      expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
      expect(await redis.exists(`${prefijo}:lock`)).toBe(0)

      // Al reintentar sin error, se aplica normalmente.
      expect(await correrMigraciones(redis, lista, opciones)).toEqual([id])
      expect(await redis.get(kNueva)).toBe('creada')
    } finally {
      silenciar.mockRestore()
    }
  })

  it('si falla la segunda migración de una corrida, revierte también la primera sin tocar deploys previos', async () => {
    const idPrevia = registrar('previa')
    const idPaso1 = registrar('paso-1')
    const idPaso2 = registrar('paso-2')
    const k = `${datos}:multi`

    await redis.set(k, 'v0')
    await correrMigraciones(
      redis,
      [{ id: idPrevia, dryRun: noop, up: async (r) => void (await r.set(k, 'v1')) }],
      opciones
    )

    const silenciar = spyOn(console, 'error').mockImplementation(() => {})
    try {
      const lista: Migracion[] = [
        { id: idPrevia, dryRun: noop, up: noop },
        { id: idPaso1, dryRun: noop, up: async (r) => void (await r.set(k, 'v2')) },
        {
          id: idPaso2,
          dryRun: noop,
          up: async (r) => {
            await r.set(k, 'v3')
            throw new Error('falló paso 2')
          },
        },
      ]

      await expect(correrMigraciones(redis, lista, opciones)).rejects.toThrow('falló paso 2')
      expect(await redis.get(k)).toBe('v1')
      expect(await redis.hexists(`${prefijo}:aplicadas`, idPrevia)).toBe(1)
      expect(await redis.hexists(`${prefijo}:aplicadas`, idPaso1)).toBe(0)
      expect(await redis.hexists(`${prefijo}:aplicadas`, idPaso2)).toBe(0)
    } finally {
      silenciar.mockRestore()
    }
  })

  it('restaurarMigracion revierte manualmente una migración ya aplicada y falla si no hay backup', async () => {
    const id = registrar('rollback-manual')
    const kVieja = `${datos}:manual-vieja`
    const kNueva = `${datos}:manual-nueva`

    await redis.set(kVieja, 'antes')
    await correrMigraciones(
      redis,
      [
        {
          id,
          dryRun: noop,
          up: async (r) => {
            await r.rename(kVieja, kNueva)
          },
        },
      ],
      opciones
    )
    expect(await redis.exists(kVieja)).toBe(0)
    expect(await redis.get(kNueva)).toBe('antes')
    expect((await listarBackups(redis, { prefijo })).some((b) => b.id === id)).toBe(true)

    // Por defecto exige exclusividad: con otro cliente conectado aborta sin tocar redis.
    const otro = redis.duplicate()
    try {
      await otro.ping()
      await expect(restaurarMigracion(redis, id, opciones)).rejects.toThrow('requiere exclusividad')
      expect(await redis.get(kNueva)).toBe('antes')
      expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(1)
    } finally {
      await otro.quit().catch(() => otro.disconnect())
    }

    const res = await restaurarMigracion(redis, id, { ...opciones, exigirExclusividad: false })
    expect(res.borradas).toBeGreaterThanOrEqual(1)
    expect(await redis.get(kVieja)).toBe('antes')
    expect(await redis.exists(kNueva)).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)

    await expect(
      restaurarMigracion(redis, 'inexistente', { ...opciones, exigirExclusividad: false })
    ).rejects.toThrow('No hay backup vigente')
  })

  it('con exigirExclusividad, una migración destructiva aborta si hay otro cliente conectado y una normal corre', async () => {
    const idDestructiva = registrar('destructiva-bloqueada')
    const idNormal = registrar('normal-con-clientes')
    let corrioDry = false
    let corrioUp = false

    const otro = redis.duplicate()
    try {
      await otro.ping()

      await expect(
        correrMigraciones(
          redis,
          [
            {
              id: idDestructiva,
              destructiva: true,
              dryRun: async () => {
                corrioDry = true
              },
              up: async () => {
                corrioUp = true
              },
            },
          ],
          { ...opciones, exigirExclusividad: true }
        )
      ).rejects.toThrow('requiere exclusividad')

      expect(corrioDry).toBe(false)
      expect(corrioUp).toBe(false)
      expect(await redis.exists(clavesDeBackup(prefijo, idDestructiva).meta)).toBe(0)
      expect(await redis.exists(`${prefijo}:lock`)).toBe(0)

      expect(
        await correrMigraciones(
          redis,
          [{ id: idNormal, dryRun: noop, up: noop }],
          { ...opciones, exigirExclusividad: true }
        )
      ).toEqual([idNormal])
    } finally {
      await otro.quit().catch(() => otro.disconnect())
    }
  })

  it('dos instancias a la vez: la migración corre una sola vez', async () => {
    let corridas = 0
    const lista: Migracion[] = [
      {
        id: registrar('concurrente'),
        dryRun: noop,
        up: async () => {
          corridas++
          await new Promise((r) => setTimeout(r, 50))
        },
      },
    ]

    await Promise.all([correrMigraciones(redis, lista, opciones), correrMigraciones(redis, lista, opciones)])
    expect(corridas).toBe(1)
  })

  it('planificar clasifica en lectura sin tocar redis, aplica lo válido, desvía inválidos a pendientes y restaurar limpia todo', async () => {
    const id = registrar('planificada-generica')
    const kHash = `${datos}:plan:hash`
    const kStrOk = `${datos}:plan:item:ok`
    const kStrRoto = `${datos}:plan:item:roto`
    const kTipoMalo = `${datos}:plan:item:set`

    await redis.hset(kHash, 'a', JSON.stringify({ n: 1 }), 'b', '{json roto')
    await redis.set(kStrOk, JSON.stringify({ n: 2 }))
    await redis.set(kStrRoto, 'no-es-objeto')
    await redis.sadd(kTipoMalo, 'miembro')

    const parsearN = (s: string): { n: number } => {
      const doc = JSON.parse(s)
      if (typeof doc?.n !== 'number') throw new Error('n inválido')
      return doc
    }

    const migracion: Migracion = {
      id,
      patrones: [`${datos}:plan:*`],
      planificar: async (p) => {
        await p.unidad('hash-global', async (u) => {
          const campos = await u.leerHash(kHash, 'tabla')
          if (!campos) return
          const validos: string[] = []
          let omitidos = 0
          for (const [k, raw] of Object.entries(campos)) {
            const doc = u.parsearElemento(raw, parsearN, { origen: 'tabla', clave: kHash, campo: k })
            if (!doc) {
              omitidos++
              continue
            }
            validos.push(k, JSON.stringify({ n: doc.n * 10 }))
          }
          if (validos.length > 0 || omitidos > 0) u.reemplazar(kHash, 'hset', validos)
        })

        for (const clave of await p.escanear(`${datos}:plan:item:*`)) {
          await p.unidad(clave, async (u) => {
            const raw = await u.leerString(clave, 'item')
            if (raw === null) return
            const doc = await u.parsearClave(clave, raw, parsearN, 'item')
            if (!doc) return
            u.emitir(clave, 'set', JSON.stringify({ n: doc.n * 10 }))
          })
        }
      },
    }

    // Fase 1 aislada: armarPlan clasifica sin mutar ninguna clave en redis.
    const pre = await armarPlan(redis, migracion.planificar)
    expect(pre.pendientes).toHaveLength(3)
    expect(await redis.hgetall(kHash)).toEqual({ a: JSON.stringify({ n: 1 }), b: '{json roto' })
    expect(await redis.type(kTipoMalo)).toBe('set')

    // Corrida completa: aplica válidos y mueve los 3 inválidos a pendientes:<id>.
    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(await correrMigraciones(redis, [migracion], opciones)).toEqual([id])
    } finally {
      silenciar.mockRestore()
    }

    expect(await redis.hgetall(kHash)).toEqual({ a: JSON.stringify({ n: 10 }) })
    expect(await redis.get(kStrOk)).toBe(JSON.stringify({ n: 20 }))
    expect(await redis.exists(kStrRoto)).toBe(0)
    expect(await redis.exists(kTipoMalo)).toBe(0)

    const pendientes = Object.values(await redis.hgetall(clavePendientes(prefijo, id))).map(
      (s) => JSON.parse(s) as EntradaPendiente
    )
    expect(pendientes).toHaveLength(3)
    expect(pendientes.find((x) => x.origen === 'tabla')).toMatchObject({ campo: 'b', valor: '{json roto' })
    expect(pendientes.filter((x) => x.origen === 'item').every((x) => typeof x.dumpBase64 === 'string')).toBe(true)

    // Rollback manual restaura las claves rotas originales y elimina pendientes:<id>.
    await restaurarMigracion(redis, id, { ...opciones, exigirExclusividad: false })
    expect(await redis.hgetall(kHash)).toEqual({ a: JSON.stringify({ n: 1 }), b: '{json roto' })
    expect(await redis.get(kStrRoto)).toBe('no-es-objeto')
    expect(await redis.smembers(kTipoMalo)).toEqual(['miembro'])
    expect(await redis.exists(clavePendientes(prefijo, id))).toBe(0)
  })
})
