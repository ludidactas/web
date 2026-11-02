import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NextResponse } from 'next/server'

const sinIntegracionGoogle = mock(async () => null as NextResponse | null)

mock.module('@/app/auth', () => ({ auth: mock(async () => ({ user: { email: 'profe@example.com' } })) }))
mock.module('@/server/google/cliente', () => ({
  clienteDrive: mock(),
  responderError: mock(() => NextResponse.json({ error: 'error' }, { status: 502 })),
  sinIntegracionGoogle,
}))

import { POST } from '../route'

const FIRMA_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function formData(imagen: Blob) {
  const form = new FormData()
  form.set('nombreSala', 'Mi sala')
  form.set('partidaId', 'partida-1')
  form.set('nombre', 'tablero.png')
  form.set('imagen', imagen)
  return form
}

function request(imagen: Blob) {
  return new Request('http://localhost/api/google/salas/a1b2c3d4/partidas', {
    method: 'POST',
    body: formData(imagen),
  })
}

const params = (salaId = 'a1b2c3d4') => ({ params: Promise.resolve({ salaId }) })

beforeEach(() => {
  sinIntegracionGoogle.mockClear()
  sinIntegracionGoogle.mockResolvedValue(NextResponse.json({ error: 'vedado' }, { status: 403 }))
})

describe('POST partidas — validación de la imagen', () => {  it('rechaza una imagen que supera el tope sin llegar a Google', async () => {
    const grande = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)])

    const res = await POST(request(grande), params())

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'La imagen es demasiado grande' })
    expect(sinIntegracionGoogle).not.toHaveBeenCalled()
  })

  it('rechaza un archivo que no es PNG sin llegar a Google', async () => {
    const res = await POST(request(new Blob(['no soy un png'])), params())

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'La imagen tiene que ser PNG' })
    expect(sinIntegracionGoogle).not.toHaveBeenCalled()
  })

  it('deja pasar un PNG dentro del tope hasta el gate de Google', async () => {
    const png = new Blob([FIRMA_PNG])

    const res = await POST(request(png), params())

    expect(res.status).toBe(403)
    expect(sinIntegracionGoogle).toHaveBeenCalledTimes(1)
  })
})

describe('POST partidas — salaId inválido', () => {
  it('rechaza un salaId fuera del formato emitido antes de tocar Google', async () => {
    const res = await POST(request(new Blob([FIRMA_PNG])), params("a1b2c3d4' OR 1=1"))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Sala inválida' })
    expect(sinIntegracionGoogle).not.toHaveBeenCalled()
  })
})
