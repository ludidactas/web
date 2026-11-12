import { afterEach, describe, expect, test } from 'bun:test'
import { tableroVacio } from '@/lib/go/motor'
import redis from '../redis'
import * as db from './db'

const salaId = `test-drive-${crypto.randomUUID()}`

function pendiente(id: string) {
  return { id, tablero: tableroVacio(9), tamaño: 9 as const, removidas: null, creadaEn: '2026-01-01T00:00:00.000Z' }
}

describe('cola de partidas pendientes de subir a Drive', () => {
  afterEach(() => redis.del(`sala:${salaId}:partidas_drive_pendientes`))

  test('encolar, leer, encolar otra, descartar una y que la otra siga', async () => {
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
