import { describe, it, expect } from 'bun:test'
import { estuvoPresente, evaluarClase, type VentanaDeClase } from '../evaluacion'
import {
  asistenciaDeClaseSchema,
  FormaEvaluacionAsistencia,
  type CondicionAsistencia,
} from '../../validators/asistencia'
import { MetodosLogin, RolSala } from '../../validators/auth'
import { WssEstudianteSessionSchema } from '../../validators/session'
import type { EventoAsistencia, IntervaloDeConexion } from '../../salas/db'

const MIN = 60_000
const T0 = 1_700_000_000_000

function intervalo(inicioOffset: number, finOffset: number | null): IntervaloDeConexion {
  return { inicio: T0 + inicioOffset, fin: finOffset !== null ? T0 + finOffset : null }
}

/** La clase va de `T0` hasta ese fin: la evaluación no mira `Date.now()`, mira la ventana. */
function ventanaHasta(fin: number): VentanaDeClase {
  return { inicio: T0, fin }
}

describe('estuvoPresente — TotalMinutos', () => {
  const condicion: CondicionAsistencia = {
    forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
    minutos_minimos: 45,
  }
  const finDeLaClase = T0 + 60 * MIN

  it('presente si el tiempo total alcanza el mínimo', () => {
    const intervalos = [intervalo(0, 45 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(true)
  })

  it('ausente si el tiempo total no alcanza', () => {
    const intervalos = [intervalo(0, 30 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(false)
  })

  it('suma intervalos separados', () => {
    const intervalos = [intervalo(0, 20 * MIN), intervalo(30 * MIN, 55 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(true)
  })

  it('un intervalo abierto cuenta hasta el fin de la clase', () => {
    const intervalos = [intervalo(0, null)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(T0 + 50 * MIN))).toBe(true)
  })

  it('intervalo abierto insuficiente', () => {
    const intervalos = [intervalo(0, null)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(T0 + 30 * MIN))).toBe(false)
  })

  it('no cuenta lo conectado antes de que empiece la clase', () => {
    const intervalos = [intervalo(-30 * MIN, 44 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(false)
    expect(estuvoPresente([intervalo(-30 * MIN, 45 * MIN)], condicion, ventanaHasta(finDeLaClase))).toBe(true)
  })
})

describe('estuvoPresente — UltimosMinutos', () => {
  const condicion: CondicionAsistencia = {
    forma_evaluacion: FormaEvaluacionAsistencia.UltimosMinutos,
    minutos_minimos: 60,
  }
  const finDeLaClase = T0 + 120 * MIN

  it('presente si estuvo conectado toda la ventana', () => {
    const intervalos = [intervalo(60 * MIN, 120 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(true)
  })

  // El umbral es exacto (`>=`): se cuentan minutos de conexión, sin tolerancias.
  it('ausente si le falta un minuto para el umbral', () => {
    const intervalos = [intervalo(61 * MIN, 120 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(false)
  })

  it('presente justo en el umbral, ausente un milisegundo antes', () => {
    expect(estuvoPresente([intervalo(60 * MIN, 120 * MIN)], condicion, ventanaHasta(finDeLaClase))).toBe(true)
    expect(estuvoPresente([intervalo(60 * MIN + 1, 120 * MIN)], condicion, ventanaHasta(finDeLaClase))).toBe(false)
  })

  it('solo cuenta la parte dentro de la ventana', () => {
    const intervalos = [intervalo(0, 120 * MIN)]
    expect(estuvoPresente(intervalos, condicion, ventanaHasta(finDeLaClase))).toBe(true)
  })

  it('ausente si no hay intervalos', () => {
    expect(estuvoPresente([], condicion, ventanaHasta(finDeLaClase))).toBe(false)
  })
})


describe('estuvoPresente — matriz 6×2 (umbral × forma)', () => {
  const UMBRALES = [15, 30, 45, 60, 90, 120] as const
  const FIN_OFFSET = 240 * MIN // la clase dura 4 h

  for (const minutos of UMBRALES) {
    describe(`${minutos} min`, () => {
      const umbralMs = minutos * MIN

      it('TotalMinutos: presente si acumula el mínimo', () => {
        const c: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos, minutos_minimos: minutos }
        expect(estuvoPresente([intervalo(0, umbralMs)], c, ventanaHasta(T0 + FIN_OFFSET))).toBe(true)
      })

      it('TotalMinutos: ausente si le falta un milisegundo', () => {
        const c: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos, minutos_minimos: minutos }
        expect(estuvoPresente([intervalo(0, umbralMs - 1)], c, ventanaHasta(T0 + FIN_OFFSET))).toBe(false)
      })

      it('UltimosMinutos: presente si cubre toda la ventana final', () => {
        const c: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.UltimosMinutos, minutos_minimos: minutos }
        expect(estuvoPresente([intervalo(FIN_OFFSET - umbralMs, FIN_OFFSET)], c, ventanaHasta(T0 + FIN_OFFSET))).toBe(true)
      })

      it('UltimosMinutos: ausente si le falta un milisegundo de la ventana final', () => {
        const c: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.UltimosMinutos, minutos_minimos: minutos }
        expect(estuvoPresente([intervalo(FIN_OFFSET - umbralMs + 1, FIN_OFFSET)], c, ventanaHasta(T0 + FIN_OFFSET))).toBe(false)
      })
    })
  }
})

describe('estuvoPresente — separador entre formas', () => {
  const FIN_OFFSET = 240 * MIN

  it('3 h conectado y ausente los últimos 60 min: TotalMinutos presente, UltimosMinutos ausente', () => {
    const intervalos = [intervalo(0, 180 * MIN)] // conectado las primeras 3 h
    const total: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos, minutos_minimos: 60 }
    const ultimos: CondicionAsistencia = { forma_evaluacion: FormaEvaluacionAsistencia.UltimosMinutos, minutos_minimos: 60 }
    const ventana = ventanaHasta(T0 + FIN_OFFSET)

    expect(estuvoPresente(intervalos, total, ventana)).toBe(true)
    expect(estuvoPresente(intervalos, ultimos, ventana)).toBe(false)
  })
})

describe('evaluarClase', () => {
  const condicion: CondicionAsistencia = {
    forma_evaluacion: FormaEvaluacionAsistencia.TotalMinutos,
    minutos_minimos: 45,
  }

  function estudiante(nombre: string) {
    return WssEstudianteSessionSchema.parse({
      rol: RolSala.Estudiante,
      idSala: 'sala-test',
      metodo: MetodosLogin.Nombre,
      nombre,
    })
  }

  function planilla(...nombres: string[]) {
    return Object.fromEntries(nombres.map((n) => [n, estudiante(n)]))
  }

  function evento(userId: string, tipo: 'conexion' | 'desconexion', offsetMs: number): EventoAsistencia {
    return { userId, evento: tipo, ts: T0 + offsetMs }
  }

  it('devuelve null si la clase duró menos del mínimo', () => {
    const eventos = [evento('Juan', 'conexion', 0), evento('Juan', 'desconexion', 29 * MIN)]
    expect(evaluarClase(eventos, planilla('Juan'), condicion, ventanaHasta(T0 + 30 * MIN - 1))).toBeNull()
  })

  it('evalúa en el borde exacto del mínimo de duración', () => {
    const eventos = [evento('Juan', 'conexion', 0), evento('Juan', 'desconexion', 30 * MIN)]
    const asistencia = evaluarClase(eventos, planilla('Juan'), condicion, ventanaHasta(T0 + 30 * MIN))
    expect(asistencia).not.toBeNull()
  })

  it('marca presente y ausente según la condición, y respeta la ventana', () => {
    const eventos = [
      evento('Juan', 'conexion', 0),
      evento('Juan', 'desconexion', 50 * MIN),
      evento('María', 'conexion', 40 * MIN),
      evento('María', 'desconexion', 50 * MIN),
    ]
    const asistencia = evaluarClase(eventos, planilla('Juan', 'María'), condicion, ventanaHasta(T0 + 60 * MIN))

    expect(asistencia).toEqual({
      inicio: T0,
      fin: T0 + 60 * MIN,
      estudiantes: [
        { userId: 'Juan', nombre: 'Juan', presente: true },
        { userId: 'María', nombre: 'María', presente: false },
      ],
    })
  })

  it('un estudiante sin ningún evento queda ausente', () => {
    const eventos = [evento('Juan', 'conexion', 0), evento('Juan', 'desconexion', 50 * MIN)]
    const asistencia = evaluarClase(eventos, planilla('Juan', 'Fantasma'), condicion, ventanaHasta(T0 + 60 * MIN))

    expect(asistencia?.estudiantes).toContainEqual({ userId: 'Fantasma', nombre: 'Fantasma', presente: false })
  })

  it('sin estudiantes devuelve la clase con la lista vacía', () => {
    const asistencia = evaluarClase([], {}, condicion, ventanaHasta(T0 + 60 * MIN))
    expect(asistencia?.estudiantes).toEqual([])
  })

  it('el resultado valida contra asistenciaDeClaseSchema', () => {
    const eventos = [evento('Juan', 'conexion', 0), evento('Juan', 'desconexion', 50 * MIN)]
    const asistencia = evaluarClase(eventos, planilla('Juan'), condicion, ventanaHasta(T0 + 60 * MIN))

    expect(() => asistenciaDeClaseSchema.parse(asistencia)).not.toThrow()
  })
})
