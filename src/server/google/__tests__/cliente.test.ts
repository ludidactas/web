import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

const oauth2Spy = mock()
const setCredentialsMock = mock()

mock.module('@googleapis/drive', () => ({
  auth: {
    OAuth2: class {
      constructor(...args: any[]) { oauth2Spy(...args) }
      setCredentials = setCredentialsMock
    },
  },
  drive: mock(() => ({ files: {} })),
}))

mock.module('next-auth/jwt', () => ({
  getToken: mock(),
}))

mock.module('@/app/auth', () => ({
  desconectarDrive: mock(),
}))

import { drive } from '@googleapis/drive'
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
  ;(getToken as any).mockClear()
  ;(desconectarDrive as any).mockClear()
  oauth2Spy.mockClear()
  setCredentialsMock.mockClear()
  ;(drive as any).mockClear()
})

afterEach(() => {
  for (const key of Object.keys(ENV_BASE)) delete process.env[key]
})

describe('clienteDrive', () => {
  it('cablea credentials y config de red al construir el cliente', async () => {
    ;(getToken as any).mockResolvedValue({ driveRefreshToken: 'refresh-tok' })
    await clienteDrive(requestFake())

    expect(oauth2Spy).toHaveBeenCalledWith({ clientId: 'test-id', clientSecret: 'test-secret' })
    expect(setCredentialsMock).toHaveBeenCalledWith({ refresh_token: 'refresh-tok' })
    expect(drive).toHaveBeenCalledWith(expect.objectContaining({
      version: 'v3',
      timeout: 20_000,
      retryConfig: { retry: 3, retryDelay: 500 },
    }))
  })

  it('lanza SinConexionDrive sin refresh token', async () => {
    ;(getToken as any).mockResolvedValue({ email: 'x@x.com' })
    expect(clienteDrive(requestFake())).rejects.toThrow('Drive no está conectado')
  })

  it('lanza SinConexionDrive con getToken null', async () => {
    ;(getToken as any).mockResolvedValue(null)
    expect(clienteDrive(requestFake())).rejects.toThrow('Drive no está conectado')
  })

  it('lanza si falta AUTH_GOOGLE_ID', async () => {
    delete process.env.AUTH_GOOGLE_ID
    expect(clienteDrive(requestFake())).rejects.toThrow('Faltan AUTH_GOOGLE_ID')
  })

  it('lanza si falta AUTH_SECRET', async () => {
    delete process.env.AUTH_SECRET
    expect(clienteDrive(requestFake())).rejects.toThrow('Falta AUTH_SECRET')
  })

  it('usa secureCookie para URLs https', async () => {
    ;(getToken as any).mockResolvedValue({ driveRefreshToken: 'tok' })
    await clienteDrive(requestFake('https://ludidactas.com/api/test'))
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: true })
    )
  })
})

describe('responderError', () => {
  async function obtenerSinConexionDrive() {
    ;(getToken as any).mockResolvedValue({ email: 'x@x.com' })
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
