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
  await seguimiento.registrarApertura(salaId)

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

describe('asistencia — el estado del cierre sobrevive a un restart del proceso', () => {
  it('persiste el registro de clase y el cierre programado en redis, no solo en memoria', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 15,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    setSystemTime(T0)
    await seguimiento.registrarApertura(salaId)
    await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)

    setSystemTime(T0 + 60 * MIN)
    await seguimiento.registrarSalidaDelProfe(salaId)

    // El registro de clase y el cierre programado quedan en redis, listos para sobrevivir un restart.
    expect(await db.getRegistroDeClase(salaId)).toEqual({ inicio: T0, fin: T0 + 60 * MIN })
    const cierres = await db.getCierresProgramados()
    expect(cierres.find((c) => c.salaId === salaId)).toEqual({ salaId, ts: T0 + 60 * MIN + 20 * MIN })
  })

  it('reprogramarCierresPendientes evalúa de una una clase cuyo plazo venció con el proceso caído', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 15,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    setSystemTime(T0)
    await seguimiento.registrarApertura(salaId)
    await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)

    // El profe se va, y el proceso "se cae" durante la espera de 20': lo que queda en redis (registro
    // + cierre programado) es lo único que va a leer `reprogramarCierresPendientes` más abajo.
    setSystemTime(T0 + 60 * MIN)
    await seguimiento.registrarSalidaDelProfe(salaId)

    // El plazo ya venció (estamos bastante después de T0+60min+20min) cuando "reiniciamos" el proceso.
    setSystemTime(T0 + 60 * MIN + 25 * MIN)
    await seguimiento.reprogramarCierresPendientes()

    const pendientes = await db.getAsistenciasPendientes(salaId)
    expect(pendientes).toHaveLength(1)
    expect(pendientes[0]).toMatchObject({ inicio: T0, fin: T0 + 60 * MIN })
    expect(await db.getRegistroDeClase(salaId)).toBeNull()
    expect((await db.getCierresProgramados()).find((c) => c.salaId === salaId)).toBeUndefined()
  })

  it('registrarApertura cancela un cierre programado que sobrevivió un restart (el profe reabrió antes)', async () => {
    const condicion: CondicionAsistencia = {
      forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
      minutos_minimos: 15,
    }
    await db.guardarSala(salaCon(salaId, condicion))

    setSystemTime(T0)
    await seguimiento.registrarApertura(salaId)
    await db.registrarEventoAsistencia(salaId, 'Juan', 'conexion', T0)

    setSystemTime(T0 + 60 * MIN)
    await seguimiento.registrarSalidaDelProfe(salaId)

    // El profe reabre la sala (ej: en el proceso nuevo, tras el restart) antes de que el cierre corra.
    setSystemTime(T0 + 65 * MIN)
    await seguimiento.registrarApertura(salaId)

    expect(await db.getRegistroDeClase(salaId)).toEqual({ inicio: T0, fin: null })
    expect((await db.getCierresProgramados()).find((c) => c.salaId === salaId)).toBeUndefined()

    // La clase sigue abierta: correr reprogramarCierresPendientes de nuevo no la evalúa.
    await seguimiento.reprogramarCierresPendientes()
    expect(await db.getAsistenciasPendientes(salaId)).toEqual([])
  })
})
