import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@googleapis/drive', () => {
  const OAuth2 = vi.fn()
  OAuth2.prototype.setCredentials = vi.fn()
  return {
    auth: { OAuth2 },
    drive: vi.fn().mockReturnValue({ files: {} }),
  }
})

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

vi.mock('@/app/auth', () => ({
  desconectarDrive: vi.fn(),
}))

import { desconectarDrive } from '@/app/auth'
import { getToken } from 'next-auth/jwt'

import { clienteDrive, responderError } from '../cliente'

const ENV_BASE = {
  AUTH_GOOGLE_ID: 'test-id',
  AUTH_GOOGLE_SECRET: 'test-secret',
  AUTH_SECRET: 'test-auth-secret',
}

function requestFake(url = 'http://localhost:3000/api/google/test') {
  return new Request(url)
}

beforeEach(() => {
  Object.assign(process.env, ENV_BASE)
})

afterEach(() => {
  vi.restoreAllMocks()
  for (const key of Object.keys(ENV_BASE)) delete process.env[key]
})

describe('clienteDrive', () => {
  it('retorna cliente cuando el JWT tiene driveRefreshToken', async () => {
    vi.mocked(getToken).mockResolvedValue({ driveRefreshToken: 'refresh-tok' } as any)
    const api = await clienteDrive(requestFake())
    expect(api).toBeDefined()
    expect(api.files).toBeDefined()
  })

  it('lanza SinConexionDrive sin refresh token', async () => {
    vi.mocked(getToken).mockResolvedValue({ email: 'x@x.com' } as any)
    await expect(clienteDrive(requestFake())).rejects.toThrow('Drive no está conectado')
  })

  it('lanza SinConexionDrive con getToken null', async () => {
    vi.mocked(getToken).mockResolvedValue(null)
    await expect(clienteDrive(requestFake())).rejects.toThrow('Drive no está conectado')
  })

  it('lanza si falta AUTH_GOOGLE_ID', async () => {
    delete process.env.AUTH_GOOGLE_ID
    await expect(clienteDrive(requestFake())).rejects.toThrow('Faltan AUTH_GOOGLE_ID')
  })

  it('lanza si falta AUTH_SECRET', async () => {
    delete process.env.AUTH_SECRET
    await expect(clienteDrive(requestFake())).rejects.toThrow('Falta AUTH_SECRET')
  })

  it('usa secureCookie para URLs https', async () => {
    vi.mocked(getToken).mockResolvedValue({ driveRefreshToken: 'tok' } as any)
    await clienteDrive(requestFake('https://ludidactas.com/api/test'))
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: true })
    )
  })
})

describe('responderError', () => {
  async function obtenerSinConexionDrive() {
    vi.mocked(getToken).mockResolvedValue({ email: 'x@x.com' } as any)
    try {
      await clienteDrive(requestFake())
      throw new Error('no debería llegar acá')
    } catch (e) {
      return e
    }
  }

  it('SinConexionDrive retorna 409 sin llamar desconectarDrive', async () => {
    const error = await obtenerSinConexionDrive()
    const response = await responderError(error)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Drive no está conectado' })
    expect(desconectarDrive).not.toHaveBeenCalled()
  })

  it('invalid_grant en response.data.error retorna 409 y desconecta', async () => {
    const error = { response: { data: { error: 'invalid_grant' } } }
    const response = await responderError(error)
    expect(response.status).toBe(409)
    expect(desconectarDrive).toHaveBeenCalled()
  })

  it('invalid_grant en message retorna 409 y desconecta', async () => {
    const error = new Error('Token invalid_grant revocado')
    const response = await responderError(error)
    expect(response.status).toBe(409)
    expect(desconectarDrive).toHaveBeenCalled()
  })

  it('otro error retorna 502 con mensaje', async () => {
    const error = new Error('ECONNREFUSED')
    const response = await responderError(error)
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'ECONNREFUSED' })
    expect(desconectarDrive).not.toHaveBeenCalled()
  })

  it('error no-Error retorna 502 con mensaje genérico', async () => {
    const response = await responderError('algo raro')
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Error desconocido' })
  })
})
