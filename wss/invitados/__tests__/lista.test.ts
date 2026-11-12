import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { MetodosLogin } from '../../validators/auth'
import { ListaPermitidos } from '../app'

const ID = `test-lista-${crypto.randomUUID()}`
const limpiar = () => redis.del(`sala:${ID}:allowed_list`, `sala:${ID}:allowed_names`)
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

  it('el nombre provisto se asigna a la entrada guardada y se resuelve por clave', async () => {
    await lista().agregar(['José Pérez'])
    await lista().setNombre('jose perez', 'Josefina')
    expect(await lista().nombres()).toEqual({ 'José Pérez': 'Josefina' })
    expect(await lista().nombreProvistoDe('JOSÉ PÉREZ')).toBe('Josefina')
    expect(await lista().nombreProvistoDe('Beto')).toBeUndefined()
  })

  it('remover por clave borra también el nombre provisto', async () => {
    await lista().agregar(['José Pérez'])
    await lista().setNombre('José Pérez', 'Josefina')
    await lista().remover(['jose perez'])
    expect(await lista().obtener()).toEqual([])
    expect(await lista().nombres()).toEqual({})
  })

  it('nombrar algo que no figura en la lista falla', async () => {
    await expect(lista().setNombre('Beto', 'Roberto')).rejects.toThrow(/no está en la lista/)
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
  it('limpiar borra la lista y los nombres', async () => {
    const lista = ListaPermitidos.para(ID, MetodosLogin.DNI)
    await lista.agregar(['123'])
    await lista.setNombre('123', 'Zoe')
    await lista.limpiar()
    expect(await lista.obtenerConNombres()).toEqual({ lista: [], nombres: {} })
  })
})
