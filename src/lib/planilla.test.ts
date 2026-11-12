import { describe, expect, test } from 'bun:test'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'
import type { ConfigSala, PlanillaCompleta } from '@/wss/validators/salas'
import { armarTablaPlanilla } from './planilla'

const config = (metodo_login: MetodosLogin, acceso: AccesoSala) => ({ metodo_login, acceso }) as ConfigSala

const planilla: PlanillaCompleta = {
  preguntas: [{ id: 'p1', pregunta: '¿Listo?' }],
  filas: [
    { userId: '111', dni: '111', nombre: 'Ana', nombreProvisto: 'Ana Gómez', asistio: true, respuestas: { p1: 'Sí' } },
    { userId: '222', dni: '222', nombreProvisto: 'Beto Ruiz', asistio: false, respuestas: {} },
  ],
}

describe('armarTablaPlanilla', () => {
  test('sala con lista: agrega Nombre provisto y Asistió, y marca a quien faltó', () => {
    const { columnas, filas } = armarTablaPlanilla(planilla, config(MetodosLogin.DNI, AccesoSala.Lista))
    expect(columnas.map((c) => c.header)).toEqual(['ID', 'Nombre', 'Nombre provisto', 'Asistió', '¿Listo?'])
    expect(filas[0]).toMatchObject({ id: '111', nombre: 'Ana', nombreProvisto: 'Ana Gómez', asistio: 'Sí', p1: 'Sí' })
    expect(filas[1]).toMatchObject({ id: '222', nombre: '', nombreProvisto: 'Beto Ruiz', asistio: 'No' })
  })

  test('sala libre: sin columnas de lista', () => {
    const { columnas } = armarTablaPlanilla(planilla, config(MetodosLogin.DNI, AccesoSala.Libre))
    expect(columnas.map((c) => c.header)).toEqual(['ID', 'Nombre', '¿Listo?'])
  })

  test('identidad nombre: no repite el nombre como columna', () => {
    const { columnas } = armarTablaPlanilla(planilla, config(MetodosLogin.Nombre, AccesoSala.Invitados))
    expect(columnas.map((c) => c.header)).toEqual(['ID', 'Nombre provisto', 'Asistió', '¿Listo?'])
  })
})
