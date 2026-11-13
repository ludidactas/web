/**
 * Migración one-off: claves de redis con la identidad real como id → ids opacos por sala, sin cifrar.
 *
 *   bun run wss:migrar-ids --dry-run    # no escribe; informa cuántas salas y claves convertiría
 *   bun run wss:migrar-ids --confirmar  # aplica la migración
 *
 * Con el WSS detenido y un backup de redis hecho. Cada sala se aplica en un MULTI junto con sus ids
 * (`sala:<id>:ids`, con la identidad sin cifrar como campo) y su marca `sala:<id>:migrado_ids`: una
 * sala con marca se saltea, así que se puede correr dos veces.
 * Una sala con algún documento ilegible no se toca y se reporta por su id.
 * Nunca imprime datos personales: solo ids de sala, conteos y el tipo de error.
 */
import { randomBytes } from 'crypto'
import redis from '../redis'
import { partidaSchema } from '../validators/go'
import { asistenciaDeClaseSchema, eventoAsistenciaSchema } from '../validators/asistencia'
import { WssEstudianteSessionSchema } from '../validators/session'
import { versionado } from '../versionado'

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

type Comando = string[]

interface Plan {
  comandos: Comando[]
  claves: Set<string>
}

export interface Resultado {
  migradas: number
  salteadas: number
  conError: string[]
  claves: number
}

const escaparPatron = (s: string) => s.replace(/[\\*?[\]]/g, '\\$&')

async function claves(patron: string): Promise<string[]> {
  const encontradas: string[] = []
  let cursor = '0'
  do {
    const [next, lote] = await redis.scan(cursor, 'MATCH', patron, 'COUNT', 200)
    cursor = next
    encontradas.push(...lote)
  } while (cursor !== '0')
  return encontradas
}

async function planificar(salaId: string, ahora: number): Promise<Plan> {
  const comandos: Comando[] = []
  const tocadas = new Set<string>()
  const emitir = (clave: string, ...comando: string[]) => {
    tocadas.add(clave)
    comandos.push([comando[0], clave, ...comando.slice(1)])
  }
  const reemplazar = (clave: string, comando: string, valores: string[]) => {
    emitir(clave, 'del')
    if (valores.length > 0) emitir(clave, comando, ...valores)
  }
  const k = (sufijo: string) => `sala:${salaId}:${sufijo}`
  const prefijo = (sufijo: string) => escaparPatron(k(sufijo))

  // Los ids se escriben acá y no con `idOpaco`, que desde el cifrado guarda el campo cifrado.
  const ids = new Map(Object.entries(await redis.hgetall(k('ids'))))
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

  const estudiantes = await redis.hgetall(k('estudiantes'))
  const planilla: string[] = []
  for (const [identidad, str] of Object.entries(estudiantes)) {
    const session = estudianteCodec.parsear(str)
    const id = resolver(identidad)
    planilla.push(id, estudianteCodec.serializar({ ...session, userId: id }))
  }
  if (planilla.length > 0) reemplazar(k('estudiantes'), 'hset', planilla)

  const eventos: string[] = []
  for (const str of await redis.lrange(k('asistencia'), 0, -1)) {
    const evento = eventoCodec.parsear(str)
    eventos.push(eventoCodec.serializar({ ...evento, userId: resolver(evento.userId) }))
  }
  if (eventos.length > 0) reemplazar(k('asistencia'), 'rpush', eventos)

  const pendientes: string[] = []
  for (const str of await redis.lrange(k('asistencia_pendiente'), 0, -1)) {
    const asistencia = asistenciaDeClaseCodec.parsear(str)
    const estudiantesConId = []
    for (const e of asistencia.estudiantes) {
      estudiantesConId.push({ ...e, userId: resolver(e.identidad) })
    }
    pendientes.push(asistenciaDeClaseCodec.serializar({ ...asistencia, estudiantes: estudiantesConId }))
  }
  if (pendientes.length > 0) reemplazar(k('asistencia_pendiente'), 'rpush', pendientes)

  for (const clave of await claves(`${prefijo('poll:')}*`)) {
    const resto = clave.slice(k('poll:').length)
    const voto = resto.match(/^([^:]+):(votos|aportes):(.+)$/)
    if (voto) {
      const destino = k(`poll:${voto[1]}:${voto[2]}:${resolver(voto[3])}`)
      emitir(clave, 'rename', destino)
      tocadas.add(destino)
    } else if (/^[^:]+:votantes$/.test(resto) || /^[^:]+:opcion:[^:]+:votantes$/.test(resto)) {
      reemplazar(clave, 'sadd', (await redis.smembers(clave)).map((miembro) => resolver(miembro)))
    }
  }

  for (const clave of await claves(`${prefijo('go:')}*`)) {
    const resto = clave.slice(k('go:').length)
    const usuario = resto.match(/^(activa|stats):(.+)$/)
    if (usuario) {
      const destino = k(`go:${usuario[1]}:${resolver(usuario[2])}`)
      emitir(clave, 'rename', destino)
      tocadas.add(destino)
      continue
    }
    const str = await redis.get(clave)
    if (str === null) throw new Error('Clave de Go con un tipo inesperado.')
    const partida = partidaCodec.parsear(str)
    emitir(
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

  if (idsNuevos.length > 0) emitir(k('ids'), 'hset', ...idsNuevos)
  emitir(k('ultima_actividad'), 'set', String(ahora), 'NX')
  emitir(k('migrado_ids'), 'set', String(ahora))

  return { comandos, claves: tocadas }
}

async function migrarSala(salaId: string, ahora: number, dryRun: boolean): Promise<number> {
  const plan = await planificar(salaId, ahora)
  if (dryRun) return plan.claves.size

  const resultados = await redis.multi(plan.comandos).exec()
  const fallido = resultados?.find(([err]) => err)
  if (!resultados || fallido) throw new Error('El MULTI de la sala no se aplicó completo.')
  return plan.claves.size
}

export async function migrarIds({ dryRun, ahora = Date.now() }: { dryRun: boolean; ahora?: number }): Promise<Resultado> {
  const ids = await redis.hkeys('salas')
  const resultado: Resultado = { migradas: 0, salteadas: 0, conError: [], claves: 0 }

  for (const salaId of ids) {
    if ((await redis.exists(`sala:${salaId}:migrado_ids`)) === 1) {
      resultado.salteadas++
      continue
    }
    try {
      resultado.claves += await migrarSala(salaId, ahora, dryRun)
      resultado.migradas++
    } catch (err) {
      resultado.conError.push(salaId)
      console.error(`   ❌ ${salaId}: ${err instanceof Error ? err.name : typeof err}`)
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
    console.log(`✅ Dry-run: se convertirían ${r.migradas} sala(s) y ${r.claves} clave(s); ${r.salteadas} ya migrada(s), ${r.conError.length} con error.`)
  } else {
    console.log(`✅ Listo. ${r.migradas} sala(s) migrada(s), ${r.salteadas} ya migrada(s), ${r.conError.length} con error.`)
  }
  if (r.conError.length > 0) console.error(`❌ Salas con error: ${r.conError.join(', ')}`)

  await redis.quit()
  process.exit(r.conError.length > 0 ? 1 : 0)
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('❌ Falló la migración:', err instanceof Error ? err.name : typeof err)
    process.exit(1)
  })
}
