import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test'

import * as db from '../wss/salas/db'
import { MetodosLogin, RolSala } from '../wss/validators/auth'
import { WssEstudianteSessionSchema } from '../wss/validators/session'

const MIN = 60_000
const T0 = 1_700_000_000_000

function estudiante(salaId: string, nombre: string) {
  return WssEstudianteSessionSchema.parse({
    rol: RolSala.Estudiante,
    idSala: salaId,
    metodo: MetodosLogin.Nombre,
    nombre,
  })
}

let salaId: string

beforeAll(() => {
  salaId = `test-db-${Date.now()}`
})

afterEach(async () => {
  await db.borrarSala(salaId)
})

afterAll(async () => {
  await db.borrarSala(salaId)
})

describe('db — estudiantes', () => {
  it('guardarEstudiante/getEstudiantes preserva la sesión', async () => {
    await db.guardarEstudiante(salaId, estudiante(salaId, 'Juan'))
    await db.guardarEstudiante(salaId, estudiante(salaId, 'María'))

    const estudiantes = await db.getEstudiantes(salaId)
    expect(Object.keys(estudiantes).sort()).toEqual(['Juan', 'María'])
    expect(estudiantes['Juan'].nombre).toBe('Juan')
  })
})

describe('db — log de asistencia', () => {
  it('registrarEventoAsistencia/getEventosAsistencia preserva el shape y el orden', async () => {
    await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
    await db.registrarEventoAsistencia(salaId, 'Juan', 'desconexion', T0 + MIN)

    expect(await db.getEventosAsistencia(salaId)).toEqual([
      { userId: 'Juan', evento: 'conexion', ts: T0 },
      { userId: 'Juan', evento: 'desconexion', ts: T0 + MIN },
    ])
  })

  it('borrarLogDeAsistencia limpia el log', async () => {
    await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
    await db.borrarLogDeAsistencia(salaId)

    expect(await db.getEventosAsistencia(salaId)).toEqual([])
  })
})

describe('db — asistencias pendientes', () => {
  it('encolarAsistencia/getAsistenciasPendientes preserva el shape', async () => {
    const asistencia = {
      inicio: T0,
      fin: T0 + 60 * MIN,
      estudiantes: [{ userId: 'Juan', nombre: 'Juan', presente: true }],
    }
    await db.encolarAsistencia(salaId, asistencia)

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([asistencia])
  })

  it('borrarAsistenciasPendientes limpia la cola', async () => {
    await db.encolarAsistencia(salaId, { inicio: T0, fin: T0 + 60 * MIN, estudiantes: [] })
    await db.borrarAsistenciasPendientes(salaId)

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })
})
