import { beforeEach, describe, expect, mock, test } from 'bun:test'

const h = new Map<string, Record<string, string>>()

mock.module('../redis', () => ({
  default: {
    hset: async (clave: string, campo: string, valor: string) => {
      const actual = h.get(clave) ?? {}
      actual[campo] = valor
      h.set(clave, actual)
    },
    hgetall: async (clave: string) => h.get(clave) ?? {},
    hdel: async (clave: string, ...campos: string[]) => {
      const actual = h.get(clave)
      if (!actual) return
      for (const campo of campos) delete actual[campo]
      if (Object.keys(actual).length === 0) h.delete(clave)
    },
  },
}))

import { tableroVacio } from '@/lib/go/motor'
import * as db from '../go/db'

function pendiente(id: string) {
  return { id, tablero: tableroVacio(9), tamaño: 9 as const, removidas: null, creadaEn: '2026-01-01T00:00:00.000Z' }
}

describe('cola de partidas pendientes de subir a Drive', () => {
  beforeEach(() => h.clear())

  test('encolar, leer, encolar otra, descartar una y que la otra siga', async () => {
    const salaId = 'sala-test'

    await db.encolarPartidaDrive(salaId, pendiente('A'))
    let pendientes = await db.getPartidasDrivePendientes(salaId)
    expect(pendientes.map((p) => p.id)).toEqual(['A'])

    await db.encolarPartidaDrive(salaId, pendiente('B'))
    pendientes = await db.getPartidasDrivePendientes(salaId)
    expect(pendientes.map((p) => p.id).sort()).toEqual(['A', 'B'])

    await db.descartarPartidasDrivePendientes(salaId, ['A'])
    pendientes = await db.getPartidasDrivePendientes(salaId)
    expect(pendientes.map((p) => p.id)).toEqual(['B'])
  })
})
