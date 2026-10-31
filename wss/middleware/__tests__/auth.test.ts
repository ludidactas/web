import { expect, test } from 'bun:test'
import { verificarYAutorizarAccesoEstudianteASala } from '../auth'
import { MetodosLogin } from '../../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../../validators/errors'
import type { Sala } from '../../salas/app'
import type { WssEstudianteSession } from '../../validators/session'

const PROFE_EMAIL = 'profe@colegio.edu'

function fakeSala(overrides: Partial<Sala> = {}, metodo_login = MetodosLogin.Nombre) {
  return {
    config: async () => ({
      nombre: 'Sala test',
      metodo_login,
      solo_invitados: false,
      nombre_profe: 'Profe',
      link: 'x',
      overlay: {},
    }),
    listarEstudiantes: async () => [] as never[],
    listaPermitidos: () => ({ incluye: async () => false }),
    profe: { email: PROFE_EMAIL },
    ...overrides,
  } as Sala
}

function sesionNombre(userId: string, clientId = 'c1'): WssEstudianteSession {
  return {
    rol: 'estudiante' as const,
    idSala: 's1',
    clientId,
    metodo: MetodosLogin.Nombre,
    nombre: userId,
    userId,
  } as WssEstudianteSession
}

function sesionDni(userId = '12345678'): WssEstudianteSession {
  return {
    rol: 'estudiante' as const,
    idSala: 's1',
    clientId: 'c1',
    metodo: MetodosLogin.DNI,
    dni: userId,
    userId,
  } as WssEstudianteSession
}

test('un estudiante cuyo nombre normaliza al email del profe es rechazado', async () => {
  const sala = fakeSala()
  const session = sesionNombre('  Profe@COLEGIO.edu ')

  await expect(verificarYAutorizarAccesoEstudianteASala(session, sala)).rejects.toThrow(ErrorSesion)
})

test('un nombre normal distinto al email del profe pasa sin error', async () => {
  const sala = fakeSala()
  const session = sesionNombre('Ana')

  await expect(verificarYAutorizarAccesoEstudianteASala(session, sala)).resolves.toBeUndefined()
})

test('un nombre ya usado por otro estudiante sigue rechazado como NombreEnUso', async () => {
  const sala = fakeSala({
    listarEstudiantes: async () => [{ userId: 'Ana', clientId: 'c2' } as never],
  })
  const session = sesionNombre('Ana', 'c1')

  let err: unknown
  try {
    await verificarYAutorizarAccesoEstudianteASala(session, sala)
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(ErrorSesion)
  expect((err as InstanceType<typeof ErrorSesion>).tipo).toBe(TipoErrorSesion.NombreEnUso)
})

test('el metodo DNI no cambió', async () => {
  const sala = fakeSala({}, MetodosLogin.DNI)

  await expect(verificarYAutorizarAccesoEstudianteASala(sesionDni(), sala)).resolves.toBeUndefined()
})

test('el metodo Google no cambió', async () => {
  const sala = fakeSala({}, MetodosLogin.Google)
  const session = {
    rol: 'estudiante' as const,
    idSala: 's1',
    metodo: MetodosLogin.Google,
    email: 'x@x.com',
    nombre: 'X',
    userId: 'x@x.com',
  } as WssEstudianteSession

  await expect(verificarYAutorizarAccesoEstudianteASala(session, sala)).resolves.toBeUndefined()
})
