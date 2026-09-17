import { afterEach, describe, expect, it, mock } from 'bun:test'

import { DriveNoConectado, guardarColeccion, leerColecciones } from '../recursos-colecciones'

const fetchMock = mock()
globalThis.fetch = fetchMock as any

afterEach(() => {
  fetchMock.mockClear()
})

function respuesta(status: number, body?: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

describe('leerColecciones', () => {
  it('retorna colecciones en 200', async () => {
    const colecciones = [{ archivo: 'a.yaml', contenido: 'x' }]
    fetchMock.mockReturnValue(respuesta(200, { colecciones }))

    const resultado = await leerColecciones('sala-1')

    expect(resultado).toEqual(colecciones)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/google/salas/sala-1/colecciones',
      undefined
    )
  })

  it('lanza DriveNoConectado en 409', async () => {
    fetchMock.mockReturnValue(respuesta(409))
    expect(leerColecciones('sala-1')).rejects.toThrow(DriveNoConectado)
  })

  it('lanza Error con mensaje del server en otro status', async () => {
    fetchMock.mockReturnValue(respuesta(500, { error: 'Error interno' }))
    expect(leerColecciones('sala-1')).rejects.toThrow('Error interno')
  })

  it('lanza Error genérico si el body no tiene error', async () => {
    fetchMock.mockReturnValue(respuesta(500, {}))
    expect(leerColecciones('sala-1')).rejects.toThrow('La app respondió 500')
  })
})

describe('guardarColeccion', () => {
  it('envía POST con body correcto y no lanza en 204', async () => {
    fetchMock.mockReturnValue(respuesta(204))

    await guardarColeccion('sala-1', 'Mi Sala', 'colección', 'yaml-content')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/google/salas/sala-1/colecciones',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreSala: 'Mi Sala',
          nombre: 'colección',
          contenido: 'yaml-content',
        }),
      })
    )
  })

  it('lanza DriveNoConectado en 409', async () => {
    fetchMock.mockReturnValue(respuesta(409))
    expect(
      guardarColeccion('sala-1', 'Mi Sala', 'col', 'yaml')
    ).rejects.toThrow(DriveNoConectado)
  })
})
