import { expect, test } from 'bun:test'
import jwt from 'jsonwebtoken'
import { decodearTokenNextAuth, verificarYAutorizarAccesoEstudianteASala } from '../auth'
import { MetodosLogin } from '../../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../../validators/errors'
import type { Sala } from '../../salas/app'
import type { WssEstudianteIdentidad } from '../../validators/session'

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

function sesionNombre(nombre: string, clientId = 'c1'): WssEstudianteIdentidad {
  return {
    rol: 'estudiante' as const,
    idSala: 's1',
    clientId,
    metodo: MetodosLogin.Nombre,
    nombre,
  } as WssEstudianteIdentidad
}

function sesionDni(dni = '12345678'): WssEstudianteIdentidad {
  return {
    rol: 'estudiante' as const,
    idSala: 's1',
    clientId: 'c1',
    metodo: MetodosLogin.DNI,
    dni,
    nombre: 'Ana',
  } as WssEstudianteIdentidad
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

test('un nombre ya usado por otro estudiante sigue rechazado como NombreEnUso (compara por nombre, no por userId)', async () => {
  const sala = fakeSala({
    listarEstudiantes: async () => [{ userId: 'handle-opaco-ana', nombre: 'Ana', clientId: 'c2' } as never],
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

test('el metodo DNI autoriza por el dni', async () => {
  const sala = fakeSala({}, MetodosLogin.DNI)

  await expect(verificarYAutorizarAccesoEstudianteASala(sesionDni(), sala)).resolves.toBeUndefined()
})

test('el token del WSS se firma y verifica con WSS_TOKEN_SECRET; un secreto ajeno es rechazado', () => {
  const firmar = (secret: string) =>
    jwt.sign({ email: 'profe@colegio.edu' }, secret, {
      algorithm: 'HS256',
      audience: 'wss-client',
      subject: 'profe@colegio.edu',
    })

  expect(decodearTokenNextAuth(firmar(process.env.WSS_TOKEN_SECRET!))?.email).toBe('profe@colegio.edu')
  expect(() => decodearTokenNextAuth(firmar('otro-secreto'))).toThrow()
})

test('con solo_invitados, la autorización va contra el dni real', async () => {
  const sala = fakeSala(
    {
      config: async () =>
        ({
          nombre: 'Sala test',
          metodo_login: MetodosLogin.DNI,
          solo_invitados: true,
          nombre_profe: 'Profe',
          link: 'x',
          overlay: {},
        }) as never,
      listaPermitidos: () => ({ incluye: async (dni: string) => dni === '12345678' }) as never,
    },
    MetodosLogin.DNI
  )

  await expect(verificarYAutorizarAccesoEstudianteASala(sesionDni('12345678'), sala)).resolves.toBeUndefined()
  await expect(verificarYAutorizarAccesoEstudianteASala(sesionDni('99999999'), sala)).rejects.toThrow(ErrorSesion)
})

test('el metodo Google autoriza por el email', async () => {
  const sala = fakeSala({}, MetodosLogin.Google)
  const session = {
    rol: 'estudiante' as const,
    idSala: 's1',
    metodo: MetodosLogin.Google,
    email: 'x@x.com',
    nombre: 'X',
  } as WssEstudianteIdentidad

  await expect(verificarYAutorizarAccesoEstudianteASala(session, sala)).resolves.toBeUndefined()
})
