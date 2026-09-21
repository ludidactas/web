import type { drive_v3 } from '@googleapis/drive'
import { describe, expect, it, mock } from 'bun:test'

import { guardarColeccion, leerColecciones } from '../drive'

function mockApi(overrides: {
  list?: ReturnType<typeof mock>
  create?: ReturnType<typeof mock>
  get?: ReturnType<typeof mock>
  update?: ReturnType<typeof mock>
} = {}) {
  return {
    files: {
      list: overrides.list ?? mock().mockResolvedValue({ data: { files: [], nextPageToken: null } }),
      create: overrides.create ?? mock().mockResolvedValue({ data: { id: 'nuevo-id', name: 'nuevo' } }),
      get: overrides.get ?? mock(),
      update: overrides.update ?? mock().mockResolvedValue({}),
    },
  } as unknown as drive_v3.Drive
}

describe('leerColecciones', () => {
  it('devuelve array vacío si no hay archivos', async () => {
    const api = mockApi()
    const resultado = await leerColecciones(api, 'sala-1')
    expect(resultado).toEqual([])
  })

  it('devuelve archivo y contenido de cada colección', async () => {
    const api = mockApi({
      list: mock().mockResolvedValue({
        data: {
          files: [
            { id: 'f1', name: 'coleccion-1.yaml' },
            { id: 'f2', name: 'coleccion-2.yaml' },
          ],
          nextPageToken: null,
        },
      }),
      get: mock()
        .mockResolvedValueOnce({ data: 'pregunta: uno' })
        .mockResolvedValueOnce({ data: 'pregunta: dos' }),
    })

    const resultado = await leerColecciones(api, 'sala-1')

    expect(resultado).toEqual([
      { archivo: 'coleccion-1.yaml', contenido: 'pregunta: uno' },
      { archivo: 'coleccion-2.yaml', contenido: 'pregunta: dos' },
    ])
    expect(api.files.get).toHaveBeenCalledWith({ fileId: 'f1', alt: 'media' }, { responseType: 'text' })
    expect(api.files.get).toHaveBeenCalledWith({ fileId: 'f2', alt: 'media' }, { responseType: 'text' })
  })

  it('pagina hasta agotar nextPageToken', async () => {
    const api = mockApi({
      list: mock()
        .mockResolvedValueOnce({ data: { files: [{ id: 'f1', name: 'a.yaml' }], nextPageToken: 'tok2' } })
        .mockResolvedValueOnce({ data: { files: [{ id: 'f2', name: 'b.yaml' }], nextPageToken: null } }),
      get: mock()
        .mockResolvedValueOnce({ data: 'contenido-a' })
        .mockResolvedValueOnce({ data: 'contenido-b' }),
    })

    const resultado = await leerColecciones(api, 'sala-1')

    expect(resultado).toHaveLength(2)
    expect(api.files.list).toHaveBeenCalledTimes(2)
  })
})

describe('guardarColeccion', () => {
  const sala = { salaId: 'sala-1', nombreSala: 'Mi Sala' }

  it('sobrescribe si la colección ya existe', async () => {
    const update = mock().mockResolvedValue({})
    const api = mockApi({
      list: mock().mockResolvedValue({
        data: { files: [{ id: 'existente-id', name: 'mi-col.yaml' }], nextPageToken: null },
      }),
      update,
    })

    await guardarColeccion(api, sala, 'Mi Col', 'contenido-yaml')

    expect(update).toHaveBeenCalledWith({
      fileId: 'existente-id',
      media: { mimeType: 'text/plain; charset=UTF-8', body: 'contenido-yaml' },
    })
    expect(api.files.create).not.toHaveBeenCalled()
  })

  it('crea jerarquía de carpetas y archivo si nada existe', async () => {
    let llamadaCreate = 0
    const list = mock().mockResolvedValue({ data: { files: [], nextPageToken: null } })

    const create = mock(() => {
      llamadaCreate++
      const ids: Record<number, { id: string; name: string }> = {
        1: { id: 'raiz-id', name: 'Ludidactas' },
        2: { id: 'sala-id', name: 'Sala - Mi Sala' },
        3: { id: 'colecciones-id', name: 'Colecciones' },
        4: { id: 'archivo-id', name: 'mi-col.yaml' },
      }
      return Promise.resolve({ data: ids[llamadaCreate] })
    })

    const api = mockApi({ list, create })

    await guardarColeccion(api, sala, 'Mi Col', 'yaml-content')

    expect(create).toHaveBeenCalledTimes(4)

    const ultimaCreacion = (create as any).mock.calls[3][0]
    expect(ultimaCreacion.requestBody.parents).toEqual(['colecciones-id'])
    expect(ultimaCreacion.requestBody.appProperties).toMatchObject({
      ludidactasSala: 'sala-1',
      recurso: 'coleccion',
    })
    expect(ultimaCreacion.media.body).toBe('yaml-content')
  })

  it('reutiliza carpetas existentes', async () => {
    let llamadaList = 0
    const list = mock(() => {
      llamadaList++
      const respuestas: Record<number, { files: { id: string; name: string }[] }> = {
        1: { files: [] },
        2: { files: [{ id: 'raiz-id', name: 'Ludidactas' }] },
        3: { files: [{ id: 'sala-id', name: 'Sala - Mi Sala' }] },
        4: { files: [{ id: 'colecciones-id', name: 'Colecciones' }] },
      }
      return Promise.resolve({ data: { ...respuestas[llamadaList], nextPageToken: null } })
    })

    const create = mock().mockResolvedValue({ data: { id: 'archivo-id', name: 'nueva.yaml' } })
    const api = mockApi({ list, create })

    await guardarColeccion(api, sala, 'Nueva', 'yaml')

    expect(create).toHaveBeenCalledTimes(1)
    expect((create as any).mock.calls[0][0].requestBody.parents).toEqual(['colecciones-id'])
  })

  it('rechaza salaId con caracteres inválidos', async () => {
    const api = mockApi()
    expect(
      guardarColeccion(api, { salaId: 'sala con espacios', nombreSala: 'X' }, 'col', 'yaml')
    ).rejects.toThrow('Término no admitido')
  })
})
