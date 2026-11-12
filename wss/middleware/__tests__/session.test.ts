import { afterEach, describe, expect, it } from 'bun:test'
import type { Socket } from 'socket.io'
import redis from '../../redis'
import { idOpaco } from '../../id-opaco'
import { agregarPermitidosA } from '../../invitados/db'
import { borrarSala, guardarSala } from '../../salas/db'
import { MetodosLogin, RolSala } from '../../validators/auth'
import { CONFIG_DEFAULTS } from '../../validators/overlay'
import type { SalaData } from '../../validators/salas'
import type { WssEstudianteSession } from '../../validators/session'
import { conSession } from '../session'

const salaId = `test-login-dni-${crypto.randomUUID()}`
const dniPermitido = '20333444555'
const dniRechazado = '99999999'

function salaData(): SalaData {
  return {
    id: salaId,
    profe: { email: 'profe@test.com' },
    config: {
      nombre_profe: 'Profe',
      link: 'x',
      metodo_login: MetodosLogin.DNI,
      solo_invitados: true,
      overlay: CONFIG_DEFAULTS,
    },
  }
}

/** Socket mínimo: `conSession` solo lee el handshake, `data` y emite al abrir la sesión. */
function socketFalso(dni: string, emitidos: Record<string, unknown> = {}): Socket {
  return {
    handshake: {
      auth: { rol: RolSala.Estudiante, idSala: salaId, dni },
      headers: {},
      address: '127.0.0.1',
    },
    data: {},
    emit: (evento: string, payload: unknown) => {
      emitidos[evento] = payload
      return true
    },
  } as unknown as Socket
}

function login(socket: Socket) {
  return new Promise<Error | undefined>((resolve) => conSession(socket, (err) => resolve(err)))
}

afterEach(async () => {
  await borrarSala(salaId)
})

describe('login de estudiante por DNI', () => {
  it('un DNI fuera de la lista se rechaza sin crear su id en la sala', async () => {
    await guardarSala(salaData())

    const error = await login(socketFalso(dniRechazado))

    expect(error).toBeDefined()
    expect(await redis.hlen(`sala:${salaId}:ids`)).toBe(0)
  })

  it('un DNI permitido abre la sesión con su id opaco y reconectar mantiene el mismo', async () => {
    await guardarSala(salaData())
    await agregarPermitidosA([dniPermitido], salaId)

    const emitidos: Record<string, unknown> = {}
    expect(await login(socketFalso(dniPermitido, emitidos))).toBeUndefined()

    const abierta = emitidos['session:opened'] as WssEstudianteSession
    expect(abierta.userId).toBe(await idOpaco(salaId, dniPermitido))
    expect(abierta.userId).not.toContain(dniPermitido)
    expect(abierta).not.toHaveProperty('dni')

    const reconexion = socketFalso(dniPermitido)
    expect(await login(reconexion)).toBeUndefined()
    expect(reconexion.data.session?.userId).toBe(abierta.userId)
  })
})
