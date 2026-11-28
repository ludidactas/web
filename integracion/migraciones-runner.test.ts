import { afterAll, describe, expect, it, spyOn } from 'bun:test'
import type Redis from 'ioredis'
import redis from '../wss/redis'
import { clavePendientes, clavesDeBackup, escanear, listarBackups } from '../wss/migraciones/backup'
import {
  aplicarPlan,
  armarPlan,
  correrMigraciones,
  loguearResumenPlan,
  restaurarMigracion,
  type EntradaPendiente,
  type Migracion,
} from '../wss/migraciones/runner'

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
})

describe('migraciones planificadas (dos fases)', () => {
  const leerPendientes = async (id: string) =>
    Object.values(await redis.hgetall(clavePendientes(prefijo, id))).map((s) => JSON.parse(s) as EntradaPendiente)

  it('armarPlan clasifica en lectura sin modificar redis ni crear pendientes', async () => {
    const kStr = `${datos}:p-ro:str`
    const kSet = `${datos}:p-ro:set`
    await redis.set(kStr, 'antes')
    await redis.sadd(kSet, 'miembro')

    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        u.emitir(kStr, 'set', 'despues')
        await u.leerString(kSet, 'item')
      })
    })

    expect(plan.pendientes).toHaveLength(1)
    expect(plan.pendientes[0]).toMatchObject({ origen: 'item', motivo: 'TipoInesperado(set)', clave: kSet })
    expect(await redis.get(kStr)).toBe('antes')
    expect(await redis.smembers(kSet)).toEqual(['miembro'])
  })

  it('escanear filtra por patrón en redis y deduplica claves repetidas', async () => {
    const kA = `${datos}:p-scan:a`
    const kB = `${datos}:p-scan:b`
    const kFuera = `${datos}:p-otro:c`
    await redis.set(kA, '1')
    await redis.set(kB, '2')
    await redis.set(kFuera, '3')

    expect((await escanear(redis, `${datos}:p-scan:*`)).sort()).toEqual([kA, kB].sort())

    const redisDuplicado = {
      scan: async () => ['0', ['k1', 'k2', 'k1']] as [string, string[]],
    } as unknown as Redis
    expect(await escanear(redisDuplicado, '*')).toEqual(['k1', 'k2'])
  })

  it('lectores tipados y asegurarTipo leen valores válidos e ignoran claves ausentes sin generar pendientes', async () => {
    const kStr = `${datos}:p-ok:str`
    const kHash = `${datos}:p-ok:hash`
    const kList = `${datos}:p-ok:list`
    const kSet = `${datos}:p-ok:set`
    const kAusente = `${datos}:p-ok:ausente`
    await redis.set(kStr, 'hola')
    await redis.hset(kHash, 'a', '1')
    await redis.rpush(kList, 'e1', 'e2')
    await redis.sadd(kSet, 'm1')

    let res: Record<string, unknown> = {}
    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        res = {
          str: await u.leerString(kStr, 's'),
          strAusente: await u.leerString(kAusente, 's'),
          hash: await u.leerHash(kHash, 'h'),
          hashAusente: await u.leerHash(kAusente, 'h'),
          list: await u.leerLista(kList, 'l'),
          listAusente: await u.leerLista(kAusente, 'l'),
          set: await u.leerSet(kSet, 'set'),
          setAusente: await u.leerSet(kAusente, 'set'),
          tipoOk: await u.asegurarTipo(kSet, 'set', 't'),
          tipoAusente: await u.asegurarTipo(kAusente, 'set', 't'),
        }
      })
    })

    expect(res).toEqual({
      str: 'hola',
      strAusente: null,
      hash: { a: '1' },
      hashAusente: null,
      list: ['e1', 'e2'],
      listAusente: null,
      set: ['m1'],
      setAusente: null,
      tipoOk: true,
      tipoAusente: false,
    })
    expect(plan.pendientes).toEqual([])
  })

  it('WRONGTYPE en lectores y asegurarTipo desvía claves con DUMP/PTTL restaurables y borra el origen', async () => {
    const id = registrar('plan-wrongtype')
    const kSetPorStr = `${datos}:p-wt:set-por-str`
    const kStrPorHash = `${datos}:p-wt:str-por-hash`
    const kStrPorList = `${datos}:p-wt:str-por-list`
    const kStrPorSet = `${datos}:p-wt:str-por-set`
    const kStrPorAsegurar = `${datos}:p-wt:str-por-asegurar`
    const kRestaurada = `${datos}:p-wt:restaurada`
    await redis.sadd(kSetPorStr, 'miembro')
    await redis.pexpire(kSetPorStr, 60_000)
    await redis.set(kStrPorHash, 'x')
    await redis.set(kStrPorList, 'x')
    await redis.set(kStrPorSet, 'x')
    await redis.set(kStrPorAsegurar, 'x')

    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        expect(await u.leerString(kSetPorStr, 'str')).toBeNull()
        expect(await u.leerHash(kStrPorHash, 'hash')).toBeNull()
        expect(await u.leerLista(kStrPorList, 'list')).toBeNull()
        expect(await u.leerSet(kStrPorSet, 'set')).toBeNull()
        expect(await u.asegurarTipo(kStrPorAsegurar, 'set', 'asegurar')).toBe(false)
      })
    })

    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await aplicarPlan(redis, id, plan, { prefijo })
    } finally {
      silenciar.mockRestore()
    }

    expect(await redis.exists(kSetPorStr, kStrPorHash, kStrPorList, kStrPorSet, kStrPorAsegurar)).toBe(0)
    const pendientes = await leerPendientes(id)
    expect(pendientes).toHaveLength(5)

    const delSet = pendientes.find((x) => x.clave === kSetPorStr)!
    expect(delSet).toMatchObject({ origen: 'str', motivo: 'TipoInesperado(set)' })
    expect(delSet.pttl).toBeGreaterThan(0)
    await redis.restore(kRestaurada, delSet.pttl!, Buffer.from(delSet.dumpBase64!, 'base64'), 'REPLACE')
    expect(await redis.smembers(kRestaurada)).toEqual(['miembro'])
  })

  it('parsearElemento devuelve el valor válido y desvía a pendientes si el parser lanza', async () => {
    let valido: unknown
    let invalido: unknown

    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        valido = u.parsearElemento('{"ok":true}', JSON.parse, { origen: 'tabla', clave: 'k:hash', campo: 'a' })
        invalido = u.parsearElemento('{roto', JSON.parse, { origen: 'tabla', clave: 'k:hash', campo: 'b' })
      })
    })

    expect(valido).toEqual({ ok: true })
    expect(invalido).toBeNull()
    expect(plan.pendientes).toHaveLength(1)
    expect(plan.pendientes[0]).toMatchObject({
      unidad: 'u',
      origen: 'tabla',
      clave: 'k:hash',
      campo: 'b',
      valor: '{roto',
      motivo: 'SyntaxError',
    })
  })

  it('parsearClave devuelve el valor válido y desvía claves inválidas con DUMP/PTTL y DEL', async () => {
    const id = registrar('plan-parsear-clave')
    const kOk = `${datos}:p-pc:ok`
    const kRoto = `${datos}:p-pc:roto`
    await redis.set(kOk, '{"ok":true}')
    await redis.set(kRoto, '{roto', 'PX', 60_000)

    let valido: unknown
    let invalido: unknown
    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        valido = await u.parsearClave(kOk, '{"ok":true}', JSON.parse, 'doc')
        invalido = await u.parsearClave(kRoto, '{roto', JSON.parse, 'doc')
      })
    })

    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await aplicarPlan(redis, id, plan, { prefijo })
    } finally {
      silenciar.mockRestore()
    }

    expect(valido).toEqual({ ok: true })
    expect(invalido).toBeNull()
    expect(await redis.get(kOk)).toBe('{"ok":true}')
    expect(await redis.exists(kRoto)).toBe(0)
    const pendientes = await leerPendientes(id)
    expect(pendientes).toHaveLength(1)
    expect(pendientes[0]).toMatchObject({ origen: 'doc', clave: kRoto, motivo: 'SyntaxError' })
    expect(typeof pendientes[0].dumpBase64).toBe('string')
    expect(pendientes[0].pttl).toBeGreaterThan(0)
  })

  it('renombrar y reemplazar aplican sus escrituras, ignoran mismo nombre y borran con lista vacía', async () => {
    const id = registrar('plan-renombrar-reemplazar')
    const kOrigen = `${datos}:p-rr:origen`
    const kDestino = `${datos}:p-rr:destino`
    const kIgual = `${datos}:p-rr:igual`
    const kSet = `${datos}:p-rr:set`
    const kVaciar = `${datos}:p-rr:vaciar`
    await redis.set(kOrigen, 'v1')
    await redis.set(kIgual, 'v2')
    await redis.sadd(kSet, 'a')
    await redis.sadd(kVaciar, 'x')

    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        u.renombrar(kOrigen, kDestino)
        u.renombrar(kIgual, kIgual)
        u.reemplazar(kSet, 'sadd', ['b'])
        u.reemplazar(kVaciar, 'sadd', [])
      })
    })
    await aplicarPlan(redis, id, plan, { prefijo })

    expect(await redis.exists(kOrigen)).toBe(0)
    expect(await redis.get(kDestino)).toBe('v1')
    expect(await redis.get(kIgual)).toBe('v2')
    expect(await redis.smembers(kSet)).toEqual(['b'])
    expect(await redis.exists(kVaciar)).toBe(0)
  })

  it('aplicarPlan fija TTL acotado a ttlSeg en pendientes:<id>', async () => {
    const id = registrar('plan-ttl-pendientes')
    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('u', async (u) => {
        u.parsearElemento('{roto', JSON.parse, { origen: 'tabla', clave: 'k', campo: 'c' })
      })
    })

    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await aplicarPlan(redis, id, plan, { prefijo, ttlSeg: 120 })
    } finally {
      silenciar.mockRestore()
    }

    const ttl = await redis.ttl(clavePendientes(prefijo, id))
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(120)
  })

  it('loguearResumenPlan distingue dryRun vs up y nunca imprime valor ni campo', async () => {
    const plan = await armarPlan(redis, async (p) => {
      await p.unidad('unidad-x', async (u) => {
        u.parsearElemento('VALOR-SECRETO', JSON.parse, {
          origen: 'estudiantes',
          clave: 'k:estudiantes',
          campo: '20333444555',
        })
      })
    })

    const salida: string[] = []
    const espia = spyOn(console, 'warn').mockImplementation((...args: unknown[]) => void salida.push(args.join(' ')))
    try {
      loguearResumenPlan('m1', plan, true, prefijo)
      loguearResumenPlan('m1', plan, false, prefijo)
    } finally {
      espia.mockRestore()
    }

    expect(salida[0]).toContain('irían')
    expect(salida[1]).toContain('movida(s)')
    const todo = salida.join('\n')
    expect(todo).toContain('unidad-x')
    expect(todo).toContain('estudiantes:SyntaxError')
    expect(todo).not.toContain('VALOR-SECRETO')
    expect(todo).not.toContain('20333444555')
  })

  it('si falla un MULTI a mitad de aplicarPlan, incluye el error de redis y revierte la unidad previa y pendientes', async () => {
    const id = registrar('plan-falla-multi')
    const kOk = `${datos}:p-fm:ok`
    const kInexistente = `${datos}:p-fm:no-existe`
    await redis.set(kOk, 'antes')

    const migracion: Migracion = {
      id,
      patrones: [`${datos}:p-fm:*`],
      planificar: async (p) => {
        await p.unidad('u1', async (u) => {
          u.emitir(kOk, 'set', 'despues')
          u.parsearElemento('{roto', JSON.parse, { origen: 'tabla', clave: kOk, campo: 'c' })
        })
        await p.unidad('u2', async (u) => {
          u.emitir(kInexistente, 'rename', `${datos}:p-fm:dest`)
        })
      },
    }

    const silenciar = spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(correrMigraciones(redis, [migracion], opciones)).rejects.toThrow(/no such key/i)
    } finally {
      silenciar.mockRestore()
    }

    expect(await redis.get(kOk)).toBe('antes')
    expect(await redis.exists(clavePendientes(prefijo, id))).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
  })

  it('si planificar lanza una excepción, no crea backup ni pendientes y libera el lock', async () => {
    const id = registrar('plan-excepcion')
    const migracion: Migracion = {
      id,
      patrones: [`${datos}:p-exc:*`],
      planificar: async () => {
        throw new Error('fallo inesperado en planificar')
      },
    }

    await expect(correrMigraciones(redis, [migracion], opciones)).rejects.toThrow('fallo inesperado en planificar')
    expect(await redis.exists(clavesDeBackup(prefijo, id).meta)).toBe(0)
    expect(await redis.exists(clavePendientes(prefijo, id))).toBe(0)
    expect(await redis.exists(`${prefijo}:lock`)).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
  })

  it('con exigirExclusividad, una migración planificada destructiva aborta antes de invocar planificar', async () => {
    const id = registrar('plan-exclusividad')
    let invocoPlanificar = false
    const migracion: Migracion = {
      id,
      destructiva: true,
      patrones: [`${datos}:p-excl:*`],
      planificar: async () => {
        invocoPlanificar = true
      },
    }

    const otro = redis.duplicate()
    try {
      await otro.ping()
      await expect(
        correrMigraciones(redis, [migracion], { ...opciones, exigirExclusividad: true })
      ).rejects.toThrow('requiere exclusividad')
    } finally {
      await otro.quit().catch(() => otro.disconnect())
    }

    expect(invocoPlanificar).toBe(false)
    expect(await redis.exists(clavesDeBackup(prefijo, id).meta)).toBe(0)
    expect(await redis.exists(`${prefijo}:lock`)).toBe(0)
  })

  it('restaurarMigracion (rollback manual) devuelve claves migradas y rotas y limpia pendientes y aplicadas', async () => {
    const id = registrar('plan-rb-manual')
    const kOk = `${datos}:p-rbm:ok`
    const kSet = `${datos}:p-rbm:set`
    await redis.set(kOk, 'antes')
    await redis.sadd(kSet, 'miembro')

    const migracion: Migracion = {
      id,
      patrones: [`${datos}:p-rbm:*`],
      planificar: async (p) => {
        await p.unidad('u', async (u) => {
          u.emitir(kOk, 'set', 'despues')
          await u.leerString(kSet, 'item')
        })
      },
    }

    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await correrMigraciones(redis, [migracion], opciones)
    } finally {
      silenciar.mockRestore()
    }

    await restaurarMigracion(redis, id, { ...opciones, exigirExclusividad: false })
    expect(await redis.get(kOk)).toBe('antes')
    expect(await redis.smembers(kSet)).toEqual(['miembro'])
    expect(await redis.exists(clavePendientes(prefijo, id))).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
  })

  it('restaurarMigracion borra claves renombradas fuera de patrones cuando la migración usa planificar', async () => {
    const id = registrar('plan-rb-fuera-patrones')
    const kDentro = `${datos}:p-in:a`
    const kFuera = `${datos}:p-out:a`
    await redis.set(kDentro, 'v1')

    const migracion: Migracion = {
      id,
      patrones: [`${datos}:p-in:*`],
      planificar: async (p) => {
        await p.unidad('u', async (u) => {
          u.renombrar(kDentro, kFuera)
        })
      },
    }

    await correrMigraciones(redis, [migracion], opciones)
    expect(await redis.exists(kDentro)).toBe(0)
    expect(await redis.get(kFuera)).toBe('v1')

    await restaurarMigracion(redis, id, { ...opciones, exigirExclusividad: false })
    expect(await redis.get(kDentro)).toBe('v1')
    expect(await redis.exists(kFuera)).toBe(0)
  })

  it('rollback automático en corrida múltiple revierte la migración planificada y borra sus pendientes', async () => {
    const idM1 = registrar('plan-rba-1')
    const idM2 = registrar('plan-rba-2')
    const kOk = `${datos}:p-rba:ok`
    const kSet = `${datos}:p-rba:set`
    await redis.set(kOk, 'antes')
    await redis.sadd(kSet, 'miembro')

    const m1: Migracion = {
      id: idM1,
      patrones: [`${datos}:p-rba:*`],
      planificar: async (p) => {
        await p.unidad('u', async (u) => {
          u.emitir(kOk, 'set', 'despues')
          await u.leerString(kSet, 'item')
        })
      },
    }
    const m2: Migracion = {
      id: idM2,
      patrones: [`${datos}:p-rba:*`],
      dryRun: noop,
      up: async () => {
        throw new Error('falló m2')
      },
    }

    const silenciarWarn = spyOn(console, 'warn').mockImplementation(() => {})
    const silenciarErr = spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(correrMigraciones(redis, [m1, m2], opciones)).rejects.toThrow('falló m2')
    } finally {
      silenciarWarn.mockRestore()
      silenciarErr.mockRestore()
    }

    expect(await redis.get(kOk)).toBe('antes')
    expect(await redis.smembers(kSet)).toEqual(['miembro'])
    expect(await redis.exists(clavePendientes(prefijo, idM1))).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, idM1)).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, idM2)).toBe(0)
  })

  it('flujo completo en orden: pre-corrida, aplicación, re-ejecución idempotente y rollback manual', async () => {
    const id = registrar('plan-flujo-completo')
    const kOk = `${datos}:p-e2e:ok`
    const kRoto = `${datos}:p-e2e:roto`
    const kSet = `${datos}:p-e2e:set`
    await redis.set(kOk, 'antes')
    await redis.set(kRoto, '{roto')
    await redis.sadd(kSet, 'miembro')

    const migracion: Migracion = {
      id,
      patrones: [`${datos}:p-e2e:*`],
      planificar: async (p) => {
        await p.unidad('u', async (u) => {
          u.emitir(kOk, 'set', 'despues')
          await u.parsearClave(kRoto, '{roto', JSON.parse, 'doc')
          await u.leerString(kSet, 'item')
        })
      },
    }

    // 1. Pre-corrida: clasifica sin mutar Redis.
    const pre = await armarPlan(redis, migracion.planificar!)
    expect(pre.pendientes).toHaveLength(2)
    expect(await redis.get(kOk)).toBe('antes')

    // 2. Aplicación y 3. Re-ejecución idempotente.
    const silenciar = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(await correrMigraciones(redis, [migracion], opciones)).toEqual([id])
      expect(await correrMigraciones(redis, [migracion], opciones)).toEqual([])
    } finally {
      silenciar.mockRestore()
    }
    expect(await redis.get(kOk)).toBe('despues')
    expect(await redis.exists(kRoto, kSet)).toBe(0)
    expect(await leerPendientes(id)).toHaveLength(2)
    expect(await redis.ttl(clavePendientes(prefijo, id))).toBeGreaterThan(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(1)

    // 4. Rollback manual: restaura todo al estado inicial y elimina pendientes/aplicadas.
    await restaurarMigracion(redis, id, { ...opciones, exigirExclusividad: false })
    expect(await redis.get(kOk)).toBe('antes')
    expect(await redis.get(kRoto)).toBe('{roto')
    expect(await redis.smembers(kSet)).toEqual(['miembro'])
    expect(await redis.exists(clavePendientes(prefijo, id))).toBe(0)
    expect(await redis.hexists(`${prefijo}:aplicadas`, id)).toBe(0)
  })
})
