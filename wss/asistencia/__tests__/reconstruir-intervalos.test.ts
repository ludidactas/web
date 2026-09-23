import { describe, it, expect } from 'bun:test'
import { reconstruirIntervalos } from '../evaluacion'
import type { EventoAsistencia } from '../../salas/db'

const T0 = 1_700_000_000_000

function evento(userId: string, tipo: 'conexion' | 'desconexion', offsetMs: number): EventoAsistencia {
  return { userId, evento: tipo, ts: T0 + offsetMs }
}

describe('reconstruirIntervalos', () => {
  it('un estudiante: conexión y desconexión', () => {
    const eventos = [
      evento('a', 'conexion', 0),
      evento('a', 'desconexion', 60_000),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: T0 + 60_000 }])
  })

  it('intervalo abierto si no hay desconexión', () => {
    const eventos = [evento('a', 'conexion', 0)]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: null }])
  })

  it('multi-tab: dos conexiones simultáneas cuentan como un solo intervalo', () => {
    const eventos = [
      evento('a', 'conexion', 0),
      evento('a', 'conexion', 1_000),
      evento('a', 'desconexion', 30_000),
      evento('a', 'desconexion', 60_000),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: T0 + 60_000 }])
  })

  it('multi-tab: tres conexiones simultáneas siguen siendo un solo intervalo', () => {
    const eventos = [
      evento('a', 'conexion', 0),
      evento('a', 'conexion', 1_000),
      evento('a', 'conexion', 2_000),
      evento('a', 'desconexion', 30_000),
      evento('a', 'desconexion', 45_000),
      evento('a', 'desconexion', 60_000),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: T0 + 60_000 }])
  })

  it('dos intervalos separados', () => {
    const eventos = [
      evento('a', 'conexion', 0),
      evento('a', 'desconexion', 30_000),
      evento('a', 'conexion', 120_000),
      evento('a', 'desconexion', 180_000),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toHaveLength(2)
    expect(result['a'][0]).toEqual({ inicio: T0, fin: T0 + 30_000 })
    expect(result['a'][1]).toEqual({ inicio: T0 + 120_000, fin: T0 + 180_000 })
  })

  it('múltiples estudiantes se separan por userId', () => {
    const eventos = [
      evento('a', 'conexion', 0),
      evento('b', 'conexion', 5_000),
      evento('a', 'desconexion', 60_000),
      evento('b', 'desconexion', 90_000),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: T0 + 60_000 }])
    expect(result['b']).toEqual([{ inicio: T0 + 5_000, fin: T0 + 90_000 }])
  })

  it('eventos desordenados se ordenan por timestamp', () => {
    const eventos = [
      evento('a', 'desconexion', 60_000),
      evento('a', 'conexion', 0),
    ]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([{ inicio: T0, fin: T0 + 60_000 }])
  })

  it('desconexión sin conexión previa no rompe', () => {
    const eventos = [evento('a', 'desconexion', 60_000)]
    const result = reconstruirIntervalos(eventos)
    expect(result['a']).toEqual([])
  })

  it('lista vacía devuelve objeto vacío', () => {
    expect(reconstruirIntervalos([])).toEqual({})
  })
})
