/**
 * Migración: claves de redis con la identidad real como id → ids opacos por sala, sin cifrar.
 *
 *   bun run wss:migrar-ids --dry-run    # no escribe; informa cuántas salas, claves y pendientes detectaría
 *   bun run wss:migrar-ids --confirmar  # aplica la migración
 *
 * Usa el protocolo de dos fases de `wss/migraciones/runner.ts`: primero planifica en lectura qué
 * claves migrar y cuáles desviar a `migraciones:pendientes:ids-opacos` (documentos corruptos o tipos
 * inesperados de Redis), y luego aplica cada sala en un `MULTI` atómico junto con `sala:<id>:migrado_ids`.
 * Nunca imprime datos personales: solo ids de sala, conteos y el tipo de error.
 */
import { randomBytes } from 'crypto'
import { clavePendientes } from '../migraciones/backup'
import { aplicarPlan, armarPlan, nombreError, type Planificador } from '../migraciones/runner'
import redis from '../redis'
import { asistenciaDeClaseSchema, eventoAsistenciaSchema } from '../validators/asistencia'
import { partidaSchema } from '../validators/go'
import { WssEstudianteSessionSchema } from '../validators/session'
import { versionado } from '../versionado'

const MIGRACION_ID = 'ids-opacos'

const estudianteCodec = versionado({ schema: WssEstudianteSessionSchema })
const eventoCodec = versionado({ schema: eventoAsistenciaSchema })
const partidaCodec = versionado({ schema: partidaSchema })
const asistenciaDeClaseCodec = versionado({
  schema: asistenciaDeClaseSchema,
  migraciones: [
    (doc) => ({
      ...doc,
      estudiantes: Array.isArray(doc.estudiantes)
        ? doc.estudiantes.map((estudiante) => {
            if (typeof estudiante !== 'object' || estudiante === null || 'identidad' in estudiante) return estudiante
            return { ...estudiante, identidad: (estudiante as Record<string, unknown>).userId }
          })
        : doc.estudiantes,
    }),
  ],
})

export interface Resultado {
  migradas: number
  salteadas: number
  conError: string[]
  pendientes: number
  salasConPendientes: string[]
  claves: number
}

const escaparPatron = (s: string) => s.replace(/[\\*?[\]]/g, '\\$&')

async function planificarSala(planificador: Planificador, salaId: string): Promise<void> {
  const k = (sufijo: string) => `sala:${salaId}:${sufijo}`
  const prefijo = (sufijo: string) => escaparPatron(k(sufijo))

  await planificador.unidad(salaId, async (u) => {
    // Sin `idOpaco`, que escribe en redis al resolver: los ids van en el MULTI de la sala.
    const idsExistentes = (await u.leerHash(k('ids'), 'ids')) ?? {}
    const ids = new Map(Object.entries(idsExistentes))
    const idsNuevos: string[] = []
    const resolver = (identidad: string) => {
      let id = ids.get(identidad)
      if (!id) {
        id = randomBytes(8).toString('hex')
        ids.set(identidad, id)
        idsNuevos.push(identidad, id)
      }
      return id
    }

    const estudiantes = await u.leerHash(k('estudiantes'), 'estudiantes')
    if (estudiantes !== null) {
      const planilla: string[] = []
      let omitidos = 0
      for (const [identidad, str] of Object.entries(estudiantes)) {
        const session = u.parsearElemento(str, (s) => estudianteCodec.parsear(s), {
          origen: 'estudiantes',
          clave: k('estudiantes'),
          campo: identidad,
        })
        if (!session) {
          omitidos++
          continue
        }
        const id = resolver(identidad)
        planilla.push(id, estudianteCodec.serializar({ ...session, userId: id }))
      }
      if (planilla.length > 0 || omitidos > 0) u.reemplazar(k('estudiantes'), 'hset', planilla)
    }

    const listaAsistencia = await u.leerLista(k('asistencia'), 'asistencia')
    if (listaAsistencia !== null) {
      const eventos: string[] = []
      let omitidos = 0
      for (const str of listaAsistencia) {
        const evento = u.parsearElemento(str, (s) => eventoCodec.parsear(s), {
          origen: 'asistencia',
          clave: k('asistencia'),
        })
        if (!evento) {
          omitidos++
          continue
        }
        eventos.push(eventoCodec.serializar({ ...evento, userId: resolver(evento.userId) }))
      }
      if (eventos.length > 0 || omitidos > 0) u.reemplazar(k('asistencia'), 'rpush', eventos)
    }

    const listaPendientes = await u.leerLista(k('asistencia_pendiente'), 'asistencia_pendiente')
    if (listaPendientes !== null) {
      const pendientes: string[] = []
      let omitidos = 0
      for (const str of listaPendientes) {
        const asistencia = u.parsearElemento(str, (s) => asistenciaDeClaseCodec.parsear(s), {
          origen: 'asistencia_pendiente',
          clave: k('asistencia_pendiente'),
        })
        if (!asistencia) {
          omitidos++
          continue
        }
        const estudiantesConId = asistencia.estudiantes.map((e) => ({ ...e, userId: resolver(e.identidad) }))
        pendientes.push(asistenciaDeClaseCodec.serializar({ ...asistencia, estudiantes: estudiantesConId }))
      }
      if (pendientes.length > 0 || omitidos > 0) u.reemplazar(k('asistencia_pendiente'), 'rpush', pendientes)
    }

    for (const clave of await planificador.escanear(`${prefijo('poll:')}*`)) {
      const resto = clave.slice(k('poll:').length)
      const voto = resto.match(/^([^:]+):(votos|aportes):(.+)$/)
      if (voto) {
        if (!(await u.asegurarTipo(clave, 'set', `poll:${voto[2]}`))) continue
        u.renombrar(clave, k(`poll:${voto[1]}:${voto[2]}:${resolver(voto[3])}`))
      } else if (/^[^:]+:votantes$/.test(resto) || /^[^:]+:opcion:[^:]+:votantes$/.test(resto)) {
        const votantes = await u.leerSet(clave, 'poll:votantes')
        if (votantes !== null) u.reemplazar(clave, 'sadd', votantes.map((miembro) => resolver(miembro)))
      }
    }

    const goIndexEsSet = await u.asegurarTipo(k('go'), 'set', 'go:index')

    for (const clave of await planificador.escanear(`${prefijo('go:')}*`)) {
      const resto = clave.slice(k('go:').length)
      const usuario = resto.match(/^(activa|stats):(.+)$/)
      if (usuario) {
        const esperado = usuario[1] === 'activa' ? 'string' : 'hash'
        if (!(await u.asegurarTipo(clave, esperado, `go:${usuario[1]}`))) continue
        u.renombrar(clave, k(`go:${usuario[1]}:${resolver(usuario[2])}`))
        continue
      }

      const str = await u.leerString(clave, 'go:partida')
      if (str === null) {
        if (goIndexEsSet) u.emitir(k('go'), 'srem', resto)
        continue
      }
      const partida = await u.parsearClave(clave, str, (s) => partidaCodec.parsear(s), 'go:partida')
      if (!partida) {
        if (goIndexEsSet) u.emitir(k('go'), 'srem', resto)
        continue
      }
      u.emitir(
        clave,
        'set',
        partidaCodec.serializar({
          ...partida,
          negro: { ...partida.negro, userId: resolver(partida.negro.userId) },
          blanco: { ...partida.blanco, userId: resolver(partida.blanco.userId) },
          ganadorUserId: partida.ganadorUserId === null ? null : resolver(partida.ganadorUserId),
        })
      )
    }

    if (idsNuevos.length > 0) u.emitir(k('ids'), 'hset', ...idsNuevos)
    u.emitir(k('ultima_actividad'), 'set', String(planificador.ahora), 'NX')
    u.emitir(k('migrado_ids'), 'set', String(planificador.ahora))
  })
}

export async function planificarIds(planificador: Planificador): Promise<void> {
  const ids = await planificador.redis.hkeys('salas')
  for (const salaId of ids) {
    if ((await planificador.redis.exists(`sala:${salaId}:migrado_ids`)) === 1) continue
    await planificarSala(planificador, salaId)
  }
}

export async function migrarIds({
  dryRun,
  ahora = Date.now(),
  prefijo = 'migraciones',
}: {
  dryRun: boolean
  ahora?: number
  prefijo?: string
}): Promise<Resultado> {
  const ids = await redis.hkeys('salas')
  let salteadas = 0
  const aPlanificar: string[] = []
  for (const salaId of ids) {
    if ((await redis.exists(`sala:${salaId}:migrado_ids`)) === 1) {
      salteadas++
    } else {
      aPlanificar.push(salaId)
    }
  }

  const resultado: Resultado = {
    migradas: 0,
    salteadas,
    conError: [],
    pendientes: 0,
    salasConPendientes: [],
    claves: 0,
  }

  const plan = await armarPlan(
    redis,
    async (p) => {
      for (const salaId of aPlanificar) {
        try {
          await planificarSala(p, salaId)
        } catch (err) {
          resultado.conError.push(salaId)
          console.error(`   ❌ ${salaId}: ${nombreError(err)}`)
        }
      }
    },
    { ahora }
  )

  const destinoPendientes = clavePendientes(prefijo, MIGRACION_ID)
  if (dryRun) {
    for (const u of plan.unidades) {
      resultado.migradas++
      resultado.claves += u.claves.size
      if (u.pendientes.length > 0) {
        resultado.pendientes += u.pendientes.length
        resultado.salasConPendientes.push(u.etiqueta)
        const causas = u.pendientes.map((p) => `${p.origen}:${p.motivo}`).join(', ')
        console.warn(`   ⚠️ ${u.etiqueta}: ${u.pendientes.length} entrada(s) irían a ${destinoPendientes} (${causas})`)
      }
    }
    return resultado
  }

  for (const u of plan.unidades) {
    try {
      await aplicarPlan(redis, MIGRACION_ID, { unidades: [u], pendientes: u.pendientes }, { prefijo })
      resultado.migradas++
      resultado.claves += u.claves.size
      if (u.pendientes.length > 0) {
        resultado.pendientes += u.pendientes.length
        resultado.salasConPendientes.push(u.etiqueta)
      }
    } catch (err) {
      resultado.conError.push(u.etiqueta)
      console.error(`   ❌ ${u.etiqueta}: ${nombreError(err)}`)
    }
  }

  return resultado
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (!dryRun && !process.argv.includes('--confirmar')) {
    console.error(
      '❌ Falta --confirmar. Antes de migrar: hacer el backup de redis y detener el WSS. Para ver qué cambiaría, usar --dry-run.'
    )
    process.exit(1)
  }

  console.log(`🔧 Migrando los ids de las salas${dryRun ? ' (dry-run)' : ''}...`)
  const r = await migrarIds({ dryRun })

  if (dryRun) {
    console.log(
      `✅ Dry-run: se convertirían ${r.migradas} sala(s) y ${r.claves} clave(s); ${r.salteadas} ya migrada(s), ${r.pendientes} pendiente(s), ${r.conError.length} con error.`
    )
  } else {
    console.log(
      `✅ Listo. ${r.migradas} sala(s) migrada(s), ${r.salteadas} ya migrada(s), ${r.pendientes} en migraciones:pendientes:${MIGRACION_ID}, ${r.conError.length} con error.`
    )
  }
  if (r.conError.length > 0) console.error(`❌ Salas con error: ${r.conError.join(', ')}`)

  await redis.quit()
  process.exit(r.conError.length > 0 ? 1 : 0)
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('❌ Falló la migración:', nombreError(err))
    process.exit(1)
  })
}
