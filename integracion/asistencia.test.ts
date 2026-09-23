import { describe, it, expect, beforeAll, afterAll, afterEach, mock, setSystemTime } from 'bun:test'

mock.module('../wss/server', () => ({
  io: { in: () => ({ fetchSockets: async () => [] }) },
}))

import * as db from '../wss/salas/db'
import { FormaEvaluacionAsistencia, type CondicionAsistencia } from '../wss/validators/asistencia'
import { MetodosLogin, RolSala } from '../wss/validators/auth'
import { WssEstudianteSessionSchema } from '../wss/validators/session'
import { CONFIG_DEFAULTS } from '../wss/validators/overlay'
import type { SalaData } from '../wss/validators/salas'

const MIN = 60_000
const T0 = 1_700_000_000_000

function salaCon(salaId: string, condicion: CondicionAsistencia | null): SalaData {
  return {
    id: salaId,
    profe: { email: 'profe@test.com', nombre: 'Profe Test' },
    config: {
      nombre: 'Sala test',
      nombre_profe: 'Profe Test',
      link: 'http://localhost/sala',
      metodo_login: MetodosLogin.Nombre,
      solo_invitados: false,
      condicion_asistencia: condicion,
      overlay: CONFIG_DEFAULTS,
    },
  }
}

function estudiante(salaId: string, nombre: string) {
  return WssEstudianteSessionSchema.parse({
    rol: RolSala.Estudiante,
    idSala: salaId,
    metodo: MetodosLogin.Nombre,
    nombre,
  })
}

let salaId: string
let seguimiento: typeof import('../wss/asistencia/seguimiento')

beforeAll(async () => {
  salaId = `test-asistencia-${Date.now()}`
  seguimiento = await import('../wss/asistencia/seguimiento')
})

afterEach(async () => {
  setSystemTime()
  await db.borrarSala(salaId)
})

afterAll(async () => {
  await db.borrarSala(salaId)
})

/** Abre la clase en `T0` y hace salir al profe `duracionMin` después. */
async function correrClase(duracionMin: number, registrarEventos: () => Promise<void>) {
  setSystemTime(T0)
  seguimiento.registrarApertura(salaId)

  await registrarEventos()

  setSystemTime(T0 + duracionMin * MIN)
  await seguimiento.registrarSalidaDelProfe(salaId)

  await seguimiento.evaluarYEncolarClase(salaId)
}

describe('asistencia — pipeline completo contra Redis', () => {
  it('encola la clase evaluada con la presencia correcta y borra el log', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 45,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    await correrClase(60, async () => {
      await db.guardarEstudiante(salaId, estudiante(salaId, 'Juan'))
      await db.guardarEstudiante(salaId, estudiante(salaId, 'María'))
      await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
      await db.registrarEventoAsistencia(salaId, 'Juan', 'desconexion', T0 + 50 * MIN)
      await db.registrarEventoAsistencia(salaId, 'María', 'conexion', T0 + 40 * MIN)
      await db.registrarEventoAsistencia(salaId, 'María', 'desconexion', T0 + 50 * MIN)
    })

    const pendientes = await db.getAsistenciasPendientes(salaId)
    expect(pendientes).toHaveLength(1)
    expect(pendientes[0].inicio).toBe(T0)
    expect(pendientes[0].fin).toBe(T0 + 60 * MIN)

    const evaluados = [...pendientes[0].estudiantes].sort((a, b) => a.userId.localeCompare(b.userId))
    expect(evaluados).toEqual([
      { userId: 'Juan', nombre: 'Juan', presente: true },
      { userId: 'María', nombre: 'María', presente: false },
    ])

    expect(await db.getEventosAsistencia(salaId)).toEqual([])
  })

  it('no encola nada si la sala no tiene condición de asistencia', async () => {
    await db.guardarSala(salaCon(salaId, null))

    await correrClase(60, async () => {
      await db.guardarEstudiante(salaId, estudiante(salaId, 'Juan'))
      await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
      await db.registrarEventoAsistencia(salaId, 'Juan', 'desconexion', T0 + 60 * MIN)
    })

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })

  it('no encola nada si no se conectó ningún estudiante', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 15,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    await correrClase(60, async () => {})

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })

  it('no encola nada si la clase duró menos del mínimo', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 15,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    await correrClase(15, async () => {
      await db.guardarEstudiante(salaId, estudiante(salaId, 'Juan'))
      await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
      await db.registrarEventoAsistencia(salaId, 'Juan', 'desconexion', T0 + 15 * MIN)
    })

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })

  it('no encola nada si la sala no existe', async () => {
    await correrClase(60, async () => {
      await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)
    })

    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })
})
