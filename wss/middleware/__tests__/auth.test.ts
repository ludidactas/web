import { describe, expect, test } from 'bun:test'
import jwt from 'jsonwebtoken'
import { decodearTokenNextAuth, verificarYAutorizarAccesoEstudianteASala } from '../auth'
import { AccesoSala, MetodosLogin } from '../../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../../validators/errors'
import type { Sala } from '../../salas/app'
import type { WssEstudianteSession } from '../../validators/session'

const PROFE_EMAIL = 'profe@colegio.edu'

function fakeSala(overrides: Partial<Sala> = {}, metodo_login = MetodosLogin.Nombre) {
  return {
    config: async () => ({
      nombre: 'Sala test',
      metodo_login,
      acceso: AccesoSala.Libre,
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

test('un nombre liberado (fila sin clientId) lo reclama cualquier cliente', async () => {
  const sala = fakeSala({
    listarEstudiantes: async () => [{ userId: 'Ana' } as never],
  })

  await expect(verificarYAutorizarAccesoEstudianteASala(sesionNombre('Ana', 'c-nuevo'), sala)).resolves.toBeUndefined()
})

test('el metodo DNI no cambió', async () => {
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

describe('acceso', () => {
  const salaConLista = (acceso: AccesoSala, metodo_login: MetodosLogin, incluye: boolean) =>
    fakeSala(
      {
        config: async () => ({ metodo_login, acceso, nombre_profe: 'P', link: 'x', overlay: {} }),
        listaPermitidos: () => ({ incluye: async () => incluye }),
      } as unknown as Partial<Sala>,
      metodo_login
    )

  const sesionGoogle = {
    rol: 'estudiante' as const,
    idSala: 's1',
    metodo: MetodosLogin.Google,
    email: 'x@x.com',
    nombre: 'X',
    userId: 'x@x.com',
  } as WssEstudianteSession

  const rechazo = async (session: WssEstudianteSession, sala: Sala) =>
    verificarYAutorizarAccesoEstudianteASala(session, sala).then(
      () => undefined,
      (e) => (e as InstanceType<typeof ErrorSesion>).tipo
    )

  test('lista: rechaza a quien no figura, con el error de su identidad', async () => {
    expect(await rechazo(sesionDni(), salaConLista(AccesoSala.Lista, MetodosLogin.DNI, false))).toBe(
      TipoErrorSesion.DniNoPermitido
    )
    expect(await rechazo(sesionGoogle, salaConLista(AccesoSala.Lista, MetodosLogin.Google, false))).toBe(
      TipoErrorSesion.EmailNoPermitido
    )
    expect(await rechazo(sesionNombre('Ana'), salaConLista(AccesoSala.Lista, MetodosLogin.Nombre, false))).toBe(
      TipoErrorSesion.NombreNoPermitido
    )
  })

  test('lista: admite a quien figura', async () => {
    for (const [sesion, metodo] of [
      [sesionDni(), MetodosLogin.DNI],
      [sesionGoogle, MetodosLogin.Google],
      [sesionNombre('Ana'), MetodosLogin.Nombre],
    ] as const)
      expect(await rechazo(sesion, salaConLista(AccesoSala.Lista, metodo, true))).toBeUndefined()
  })

  test('invitados y libre: admiten a quien no figura', async () => {
    for (const acceso of [AccesoSala.Invitados, AccesoSala.Libre]) {
      expect(await rechazo(sesionDni(), salaConLista(acceso, MetodosLogin.DNI, false))).toBeUndefined()
      expect(await rechazo(sesionNombre('Ana'), salaConLista(acceso, MetodosLogin.Nombre, false))).toBeUndefined()
    }
  })

  test('lista con identidad nombre: sigue rechazando un nombre en uso por otro cliente', async () => {
    const sala = salaConLista(AccesoSala.Lista, MetodosLogin.Nombre, true)
    sala.listarEstudiantes = async () => [sesionNombre('Ana', 'otro-cliente')] as never[]
    expect(await rechazo(sesionNombre('ana'), sala)).toBe(TipoErrorSesion.NombreEnUso)
  })
})
