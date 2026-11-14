import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { MetodosLogin } from '../../validators/auth'
import { ListaPermitidos } from '../app'

const ID = `test-lista-${crypto.randomUUID()}`
const limpiar = () => redis.del(`sala:${ID}:allowed_list`, `sala:${ID}:allowed_info`)
afterEach(limpiar)

describe('ListaPermitidos con identidad nombre', () => {
  const lista = () => ListaPermitidos.para(ID, MetodosLogin.Nombre)

  it('la pertenencia ignora tildes y mayúsculas, y no duplica entradas', async () => {
    await lista().agregar(['José Pérez'])
    await lista().agregar(['jose perez', 'Ana'])
    expect((await lista().obtener()).sort()).toEqual(['Ana', 'José Pérez'])
    expect(await lista().incluye('JOSE  PEREZ')).toBe(true)
    expect(await lista().incluye('Beto')).toBe(false)
  })

  it('la info se asigna a la entrada guardada y se resuelve por clave', async () => {
    await lista().agregar(['José Pérez'])
    await lista().setInfo('jose perez', { nombre: 'Josefina' })
    expect(await lista().info()).toEqual({ 'José Pérez': { nombre: 'Josefina' } })
    expect(await lista().infoDe('JOSÉ PÉREZ')).toEqual({ nombre: 'Josefina' })
    expect(await lista().infoDe('Beto')).toBeUndefined()
  })

  it('setInfo reemplaza la info completa y una info vacía la quita', async () => {
    await lista().agregar(['Ana'])
    await lista().setInfo('Ana', { nombre: 'Ana García' })
    await lista().setInfo('Ana', { nombre: 'Ana G.' })
    expect(await lista().infoDe('Ana')).toEqual({ nombre: 'Ana G.' })
    await lista().setInfo('Ana', {})
    expect(await lista().info()).toEqual({})
  })

  it('remover por clave borra también la info', async () => {
    await lista().agregar(['José Pérez'])
    await lista().setInfo('José Pérez', { nombre: 'Josefina' })
    await lista().remover(['jose perez'])
    expect(await lista().obtener()).toEqual([])
    expect(await lista().info()).toEqual({})
  })

  it('anotar algo que no figura en la lista falla', async () => {
    await expect(lista().setInfo('Beto', { nombre: 'Roberto' })).rejects.toThrow(/no está en la lista/)
  })
})

describe('ListaPermitidos con identidad google', () => {
  const lista = () => ListaPermitidos.para(ID, MetodosLogin.Google)

  it('guarda emails en minúsculas y rechaza los inválidos sin guardar nada', async () => {
    await expect(lista().agregar(['ana@x.com', 'no-es-email'])).rejects.toThrow()
    expect(await lista().obtener()).toEqual([])

    await lista().agregar(['Ana@X.com'])
    expect(await lista().obtener()).toEqual(['ana@x.com'])
    expect(await lista().incluye('ANA@x.com')).toBe(true)
  })
})

describe('ListaPermitidos con identidad dni', () => {
  it('limpiar borra la lista y la info', async () => {
    const lista = ListaPermitidos.para(ID, MetodosLogin.DNI)
    await lista.agregar(['123'])
    await lista.setInfo('123', { nombre: 'Zoe' })
    await lista.limpiar()
    expect(await lista.obtenerConInfo()).toEqual({ lista: [], info: {} })
  })
})

describe('agregarConInfo', () => {
  it('agrega entradas e info en un solo paso, y no guarda nada si una entrada es inválida', async () => {
    const lista = ListaPermitidos.para(ID, MetodosLogin.DNI)
    await expect(lista.agregarConInfo([{ identidad: '123', info: { nombre: 'Zoe' } }, { identidad: 'x' }])).rejects.toThrow()
    expect(await lista.obtener()).toEqual([])

    await lista.agregarConInfo([{ identidad: '123', info: { nombre: 'Zoe' } }, { identidad: '456' }])
    expect(await lista.obtenerConInfo()).toEqual({
      lista: expect.arrayContaining(['123', '456']),
      info: { '123': { nombre: 'Zoe' } },
    })
  })
})
