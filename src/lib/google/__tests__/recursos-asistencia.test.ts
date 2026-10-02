import { describe, it, expect, mock, afterEach } from 'bun:test'
import { escribirAsistenciaEnDrive } from '../recursos-asistencia'
import { DriveNoConectado } from '../comun'

const fetchOriginal = globalThis.fetch

afterEach(() => {
  globalThis.fetch = fetchOriginal
})

const asistencias = [{ inicio: 1, fin: 2, estudiantes: [{ userId: 'u1', nombre: 'Juan', presente: true }] }]

describe('escribirAsistenciaEnDrive', () => {
  it('postea a la ruta de asistencia con el body correcto', async () => {
    const fetchMock = mock(async () => new Response(null, { status: 204 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await escribirAsistenciaEnDrive('sala 1', 'Mi Sala', asistencias)

    expect(fetchMock).toHaveBeenCalledWith('/api/google/salas/sala%201/asistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreSala: 'Mi Sala', asistencias }),
    })
  })

  it('lanza DriveNoConectado ante un 409', async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 409 })) as unknown as typeof fetch

    await expect(escribirAsistenciaEnDrive('sala', 'S', asistencias)).rejects.toThrow(DriveNoConectado)
  })

  it('lanza Error con el mensaje del server ante otro error', async () => {
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: 'boom' }), { status: 502 })) as unknown as typeof fetch

    await expect(escribirAsistenciaEnDrive('sala', 'S', asistencias)).rejects.toThrow('boom')
  })
})