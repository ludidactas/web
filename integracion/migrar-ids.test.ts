import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { tableroVacio } from '@/lib/go/motor'
import redis from '../wss/redis'
import { borrarSala, eliminarSalaDeProfe } from '../wss/salas/db'
import { migrarIds } from '../wss/scripts/migrar-ids'
import { MetodosLogin, RolSala } from '../wss/validators/auth'
import { CONFIG_DEFAULTS } from '../wss/validators/overlay'
import type { SalaData } from '../wss/validators/salas'

const sufijo = crypto.randomUUID()
const salaId = `test-migrar-ids-${sufijo}`
const salaRotaId = `test-migrar-ids-rota-${sufijo}`
const salaNombreId = `test-migrar-ids-nombre-${sufijo}`
const salaGoogleId = `test-migrar-ids-google-${sufijo}`
const salasMigradas = [salaId, salaNombreId, salaGoogleId]

const dni = '20333444555'
const nombre = 'Zoilo Quispe'
const nombreInvitado = 'Zoilo del Padrón'
const otroJugador = 'Bernabé Cárdenas'
const ip = '10.20.30.40'
const agente = 'Mozilla/5.0 (X11; Linux) Gecko/20100101 Firefox/130.0'
const emailProfe = `profe-${sufijo}@test.com`
const nombreProfe = 'Aurelia Quintanilla'
const dniDos = '27111222333'
const nombreDos = 'Facundo Ibarra'
const nombrePorNombre = 'Clotilde Mamani'
const emailGoogle = `ximena.vargas-${sufijo}@test.com`
const nombreGoogle = 'Ximena Vargas'
const avatarGoogle = `https://lh3.example.test/a/avatar-${sufijo}`
const secretos = [
  dni,
  nombre,
  nombreInvitado,
  otroJugador,
  ip,
  agente,
  emailProfe,
  nombreProfe,
  dniDos,
  nombreDos,
  nombrePorNombre,
  emailGoogle,
  nombreGoogle,
  avatarGoogle,
]

const salaDe = (id: string, metodo_login = MetodosLogin.DNI): SalaData => ({
  id,
  profe: { email: emailProfe, nombre: nombreProfe },
  config: {
    nombre_profe: nombreProfe,
    link: 'x',
    metodo_login,
    solo_invitados: true,
    overlay: CONFIG_DEFAULTS,
  },
})

const sesionVieja = {
  rol: RolSala.Estudiante,
  idSala: salaId,
  metodo: MetodosLogin.DNI,
  dni,
  nombre,
  userId: dni,
  userIp: ip,
  agente,
}

const sesionDos = {
  rol: RolSala.Estudiante,
  idSala: salaId,
  metodo: MetodosLogin.DNI,
  dni: dniDos,
  nombre: nombreDos,
  userId: dniDos,
  userIp: ip,
  agente,
}

const sesionPorNombre = {
  rol: RolSala.Estudiante,
  idSala: salaNombreId,
  metodo: MetodosLogin.Nombre,
  nombre: nombrePorNombre,
  userId: nombrePorNombre,
  userIp: ip,
  agente,
}

const sesionGoogle = {
  rol: RolSala.Estudiante,
  idSala: salaGoogleId,
  metodo: MetodosLogin.Google,
  email: emailGoogle,
  nombre: nombreGoogle,
  avatar: avatarGoogle,
  userId: emailGoogle,
  userIp: ip,
  agente,
}

const partidaVieja = {
  id: 'p1',
  salaId,
  tamaño: 9 as const,
  modo: 'partida' as const,
  negro: { userId: dni, nombre },
  blanco: { userId: otroJugador, nombre: otroJugador },
  tablero: tableroVacio(9),
  turno: 'N' as const,
  capturasNegras: 0,
  capturasBlancas: 0,
  pases: 0,
  historial: [],
  ultimaJugada: null,
  removidas: null,
  vivo: null,
  confirmaron: { negro: false, blanco: false },
  estado: 'jugando' as const,
  resultado: null,
  motivoFin: null,
  ganadorUserId: dni,
  creadaEn: '2026-01-01T00:00:00.000Z',
}

const pendienteViejo = {
  id: 'p1',
  tablero: tableroVacio(9),
  tamaño: 9 as const,
  removidas: null,
  creadaEn: partidaVieja.creadaEn,
  info: { modo: 'partida' as const, negro: nombre, blanco: otroJugador, ganador: 'negro' as const, puntos: null },
}

async function sembrar() {
  await redis.hset('salas', salaId, JSON.stringify(salaDe(salaId)))
  await redis.hset('salas_owners', salaId, emailProfe)
  await redis.sadd(`profe:${emailProfe}:salas`, salaId)
  await redis.hset(`sala:${salaId}:estudiantes`, dni, JSON.stringify(sesionVieja))
  await redis.sadd(`sala:${salaId}:allowed_list`, dni, dniDos)
  await redis.hset(`sala:${salaId}:estudiantes`, dniDos, JSON.stringify(sesionDos))
  await redis.hset(`sala:${salaId}:allowed_names`, dni, nombreInvitado)
  await redis.rpush(
    `sala:${salaId}:asistencia`,
    JSON.stringify({ userId: dni, evento: 'conexion', ts: 10 }),
    JSON.stringify({ userId: dni, evento: 'desconexion', ts: 20 })
  )
  await redis.rpush(
    `sala:${salaId}:asistencia_pendiente`,
    JSON.stringify({ inicio: 1, fin: 2, estudiantes: [{ userId: dni, nombre, presente: true }] })
  )
  await redis.hset(`sala:${salaId}:poll:p1:votos`, { a: 2, b: 1 })
  await redis.sadd(`sala:${salaId}:poll:p1:votos:${dni}`, 'a')
  await redis.sadd(`sala:${salaId}:poll:p1:aportes:${dni}`, 'a')
  await redis.sadd(`sala:${salaId}:poll:p1:votantes`, dni, otroJugador)
  await redis.sadd(`sala:${salaId}:poll:p1:opcion:a:votantes`, dni)
  await redis.sadd(`sala:${salaId}:poll:p1:opcion:b:votantes`, otroJugador)
  await redis.set(`sala:${salaId}:go:p1`, JSON.stringify(partidaVieja))
  await redis.sadd(`sala:${salaId}:go`, 'p1')
  await redis.set(`sala:${salaId}:go:activa:${dni}`, 'p1')
  await redis.hset(`sala:${salaId}:go:stats:${dni}`, { jugadas: 3, ganadas: 2 })
  await redis.hset(`sala:${salaId}:partidas_drive_pendientes`, 'p1', JSON.stringify(pendienteViejo))

  for (const [id, metodo, sesion, identidad] of [
    [salaNombreId, MetodosLogin.Nombre, sesionPorNombre, nombrePorNombre],
    [salaGoogleId, MetodosLogin.Google, sesionGoogle, emailGoogle],
  ] as const) {
    await redis.hset('salas', id, JSON.stringify(salaDe(id, metodo)))
    await redis.hset('salas_owners', id, emailProfe)
    await redis.sadd(`profe:${emailProfe}:salas`, id)
    await redis.hset(`sala:${id}:estudiantes`, identidad, JSON.stringify(sesion))
    await redis.rpush(
      `sala:${id}:asistencia`,
      JSON.stringify({ userId: identidad, evento: 'conexion', ts: 10 }),
      JSON.stringify({ userId: identidad, evento: 'desconexion', ts: 20 })
    )
  }
  await redis.sadd(`sala:${salaGoogleId}:allowed_list`, emailGoogle)

  await redis.hset('salas', salaRotaId, JSON.stringify(salaDe(salaRotaId)))
  await redis.hset(`sala:${salaRotaId}:estudiantes`, dni, '{no es json')
  await redis.sadd(`sala:${salaRotaId}:allowed_list`, dni)
}

async function volcar(...ids: string[]): Promise<Record<string, unknown>> {
  const salida: Record<string, unknown> = {}
  for (const id of ids) {
    salida[`salas:${id}`] = await redis.hget('salas', id)
    salida[`owners:${id}`] = await redis.hget('salas_owners', id)
    let cursor = '0'
    do {
      const [next, claves] = await redis.scan(cursor, 'MATCH', `sala:${id}:*`, 'COUNT', 200)
      cursor = next
      for (const clave of claves) {
        const tipo = await redis.type(clave)
        if (tipo === 'string') salida[clave] = await redis.get(clave)
        if (tipo === 'hash') salida[clave] = await redis.hgetall(clave)
        if (tipo === 'set') salida[clave] = (await redis.smembers(clave)).sort()
        if (tipo === 'list') salida[clave] = await redis.lrange(clave, 0, -1)
      }
    } while (cursor !== '0')
  }
  let cursor = '0'
  do {
    const [next, claves] = await redis.scan(cursor, 'MATCH', 'profe:*', 'COUNT', 200)
    cursor = next
    for (const clave of claves) salida[clave] = (await redis.smembers(clave)).sort()
  } while (cursor !== '0')
  return salida
}

let idEstudiante: string
let idOtro: string
let idDos: string
let idPorNombre: string
let idGoogle: string
let antes: Record<string, unknown>
let tras_dry_run: Record<string, unknown>
let resultado: Awaited<ReturnType<typeof migrarIds>>
let consola: string

beforeAll(async () => {
  await sembrar()
  antes = await volcar(...salasMigradas, salaRotaId)

  const salida: string[] = []
  const espias = (['log', 'error', 'warn'] as const).map((m) =>
    spyOn(console, m).mockImplementation((...args: unknown[]) => void salida.push(args.map(String).join(' ')))
  )
  try {
    const simulacro = await migrarIds({ dryRun: true })
    expect(simulacro.migradas).toBeGreaterThanOrEqual(1)
    tras_dry_run = await volcar(...salasMigradas, salaRotaId)
    resultado = await migrarIds({ dryRun: false })
  } finally {
    espias.forEach((e) => e.mockRestore())
  }
  consola = salida.join('\n')

  const idDe = async (sala: string, identidad: string) => (await redis.hget(`sala:${sala}:ids`, identidad))!
  idEstudiante = await idDe(salaId, dni)
  idOtro = await idDe(salaId, otroJugador)
  idDos = await idDe(salaId, dniDos)
  idPorNombre = await idDe(salaNombreId, nombrePorNombre)
  idGoogle = await idDe(salaGoogleId, emailGoogle)
})

afterAll(async () => {
  for (const id of [...salasMigradas, salaRotaId]) {
    await borrarSala(id)
    await eliminarSalaDeProfe(emailProfe, id)
  }
  await redis.srem(`profe:${emailProfe}:salas`, ...salasMigradas, salaRotaId)
})

describe('migrar ids', () => {
  it('--dry-run no cambia ninguna clave', () => {
    expect(tras_dry_run).toEqual(antes)
  })

  it('no imprime datos personales y reporta la sala rota por su id', () => {
    for (const secreto of secretos) expect(consola).not.toContain(secreto)
    expect(consola).toContain(salaRotaId)
  })

  it('los ids quedan con la identidad sin cifrar como campo', async () => {
    expect((await redis.hkeys(`sala:${salaId}:ids`)).sort()).toEqual([dni, dniDos, otroJugador].sort())
    expect(await redis.hkeys(`sala:${salaNombreId}:ids`)).toEqual([nombrePorNombre])
    expect(await redis.hkeys(`sala:${salaGoogleId}:ids`)).toEqual([emailGoogle])
  })

  it('la marca de migración quedó escrita', async () => {
    for (const id of salasMigradas) expect(await redis.exists(`sala:${id}:migrado_ids`)).toBe(1)
    expect(await redis.exists(`sala:${salaRotaId}:migrado_ids`)).toBe(0)
  })

  it('la planilla queda por id, sin IP ni User-Agent', async () => {
    expect(resultado.conError).toContain(salaRotaId)
    for (const id of salasMigradas) expect(resultado.conError).not.toContain(id)

    expect((await redis.hkeys(`sala:${salaId}:estudiantes`)).sort()).toEqual([idEstudiante, idDos].sort())
    const documentos = await redis.hgetall(`sala:${salaId}:estudiantes`)
    const estudiante = JSON.parse(documentos[idEstudiante])
    expect(estudiante.userId).toBe(idEstudiante)
    expect(estudiante.userIp).toBeUndefined()
    expect(estudiante.agente).toBeUndefined()
    expect(JSON.parse(documentos[idDos]).userId).toBe(idDos)
  })

  it('la asistencia y los pendientes quedan por id, con la identidad intacta', async () => {
    const eventos = (await redis.lrange(`sala:${salaId}:asistencia`, 0, -1)).map((s) => JSON.parse(s))
    expect(eventos).toEqual([
      { userId: idEstudiante, evento: 'conexion', ts: 10, v: 0 },
      { userId: idEstudiante, evento: 'desconexion', ts: 20, v: 0 },
    ])

    const [pendiente] = (await redis.lrange(`sala:${salaId}:asistencia_pendiente`, 0, -1)).map((s) => JSON.parse(s))
    expect(pendiente.estudiantes).toEqual([{ userId: idEstudiante, identidad: dni, nombre, presente: true }])
  })

  it('las claves de encuestas y Go quedan por id', async () => {
    expect(await redis.exists(`sala:${salaId}:poll:p1:votos:${dni}`)).toBe(0)
    expect(await redis.exists(`sala:${salaId}:poll:p1:votos:${idEstudiante}`)).toBe(1)
    expect(await redis.exists(`sala:${salaId}:poll:p1:aportes:${idEstudiante}`)).toBe(1)
    expect(await redis.hgetall(`sala:${salaId}:poll:p1:votos`)).toEqual({ a: '2', b: '1' })
    expect((await redis.smembers(`sala:${salaId}:poll:p1:votantes`)).sort()).toEqual([idEstudiante, idOtro].sort())
    expect(await redis.smembers(`sala:${salaId}:poll:p1:opcion:a:votantes`)).toEqual([idEstudiante])
    expect(await redis.smembers(`sala:${salaId}:poll:p1:opcion:b:votantes`)).toEqual([idOtro])

    expect(await redis.get(`sala:${salaId}:go:activa:${dni}`)).toBeNull()
    expect(await redis.get(`sala:${salaId}:go:activa:${idEstudiante}`)).toBe('p1')
    expect(await redis.hgetall(`sala:${salaId}:go:stats:${idEstudiante}`)).toEqual({ jugadas: '3', ganadas: '2' })
    const partida = JSON.parse((await redis.get(`sala:${salaId}:go:p1`))!)
    expect(partida.negro).toEqual({ userId: idEstudiante, nombre })
    expect(partida.blanco).toEqual({ userId: idOtro, nombre: otroJugador })
    expect(partida.ganadorUserId).toBe(idEstudiante)
  })

  it('lo que la migración no toca queda igual', async () => {
    expect((await redis.smembers(`sala:${salaId}:allowed_list`)).sort()).toEqual([dni, dniDos].sort())
    expect(await redis.hgetall(`sala:${salaId}:allowed_names`)).toEqual({ [dni]: nombreInvitado })
    expect((await redis.smembers(`profe:${emailProfe}:salas`)).sort()).toEqual([...salasMigradas].sort())
    expect(await redis.hget(`salas_owners`, salaId)).toBe(emailProfe)
    expect(JSON.parse((await redis.hget('salas', salaId))!)).toEqual(salaDe(salaId))
    expect(await redis.hgetall(`sala:${salaId}:partidas_drive_pendientes`)).toEqual({
      p1: JSON.stringify(pendienteViejo),
    })
    expect(await redis.exists(`sala:${salaId}:ultima_actividad`)).toBe(1)
  })

  it('las salas por nombre y por Google quedan por id', async () => {
    expect(await redis.hkeys(`sala:${salaNombreId}:estudiantes`)).toEqual([idPorNombre])
    expect(idPorNombre).not.toBe(nombrePorNombre)
    const eventos = (await redis.lrange(`sala:${salaNombreId}:asistencia`, 0, -1)).map((s) => JSON.parse(s))
    expect(eventos.map((e) => e.userId)).toEqual([idPorNombre, idPorNombre])

    expect(await redis.hkeys(`sala:${salaGoogleId}:estudiantes`)).toEqual([idGoogle])
    expect(idGoogle).not.toBe(emailGoogle)
    expect((await redis.smembers(`sala:${salaGoogleId}:allowed_list`))).toEqual([emailGoogle])
  })

  it('la sala con un documento roto queda intacta', async () => {
    const despues = await volcar(salaRotaId)
    for (const [clave, valor] of Object.entries(despues)) {
      if (clave.startsWith('profe:')) continue
      expect(valor).toEqual(antes[clave])
    }
    expect(await redis.exists(`sala:${salaRotaId}:ids`, `sala:${salaRotaId}:migrado_ids`)).toBe(0)
  })

  it('migrar dos veces da el mismo resultado', async () => {
    const primera = await volcar(...salasMigradas)
    const segunda = await migrarIds({ dryRun: false })
    expect(segunda.salteadas).toBeGreaterThanOrEqual(1)
    for (const id of salasMigradas) expect(segunda.conError).not.toContain(id)
    expect(await volcar(...salasMigradas)).toEqual(primera)
  })

  it('sin --dry-run exige --confirmar', async () => {
    const proceso = Bun.spawn(['bun', 'run', 'wss/scripts/migrar-ids.ts'], {
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    })
    const stderr = await new Response(proceso.stderr).text()
    expect(await proceso.exited).toBe(1)
    expect(stderr).toContain('--confirmar')
    expect(stderr).toContain('backup')
  })
})
